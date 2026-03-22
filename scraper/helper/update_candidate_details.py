#!/usr/bin/env python3

import os
import sys
import argparse
import boto3
import time
from typing import List, Dict, Optional
from boto3.dynamodb.conditions import Key

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enrichment import EnrichmentPipeline
from config import logger
from utils import normalize_name

CANDIDATES_TABLE = "knowyourmla_candidates"
REGION_NAME = "ap-south-2"
FAILURE_LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "logs", "failed_candidates.txt")

class CandidateUpdater:
    def __init__(self, dry_run: bool = True, force: bool = False):
        self.pipeline = EnrichmentPipeline()
        self.dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
        self.candidates_table = self.dynamodb.Table(CANDIDATES_TABLE)
        self.dry_run = dry_run
        self.force = force
        self.failure_log = FAILURE_LOG
        
        # Ensure logs directory exists
        os.makedirs(os.path.dirname(self.failure_log), exist_ok=True)

    def get_year_slug(self, year: str) -> str:
        """Resolve year to Myneta URL slug."""
        if year == "2021":
            return "TamilNadu2021"
        elif year == "2006":
            return "tn2006"
        else:
            return f"tamilnadu{year}"

    def log_failure(self, aff_id: str):
        """Log a failed affidavit ID to a file."""
        if self.dry_run:
            return
            
        try:
            with open(self.failure_log, "a") as f:
                f.write(f"{aff_id}\n")
            logger.info(f"  Logged failure for {aff_id} to {self.failure_log}")
        except Exception as e:
            logger.error(f"  Error logging failure for {aff_id}: {e}")

    def update_affidavit(self, year: str, cid: str) -> bool:
        """Fetch and update a single affidavit."""
        pk = f"AFFIDAVIT#{year}#{cid}"
        logger.info(f"Processing candidate {pk}")

        # 1. Fetch current record
        try:
            response = self.candidates_table.get_item(Key={"PK": pk, "SK": "DETAILS"})
            if "Item" not in response:
                logger.error(f"  Candidate {pk} not found in database.")
                return False
            item = response["Item"]
        except Exception as e:
            logger.error(f"  Error fetching {pk}: {e}")
            return False

        # 2. Check if update is needed
        has_itr = item.get("income_itr") and item.get("income_itr") != 0
        has_district = item.get("district_id")
        
        if not self.force and has_itr and has_district:
            logger.info(f"  Candidate {pk} already has ITR and District. Skipping (use --force to update).")
            return True

        # 3. Extract fresh details from Myneta
        year_slug = self.get_year_slug(year)
        url = f"https://www.myneta.info/{year_slug}/candidate.php?candidate_id={cid}"
        
        logger.info(f"  Fetching fresh data from: {url}")
        details = self.pipeline.extract_affidavit_details(url)
        
        if not details:
            logger.error(f"  Failed to extract details for {pk}")
            self.log_failure(pk)
            return False

        # 4. Prepare updates
        updates = []
        attr_values = {}
        remove_fields = []

        # ITR Update
        new_income = details.get("income_itr", 0)
        new_history = details.get("itr_history", {})
        
        if self.force or not item.get("income_itr"):
            if new_income:
                updates.append("income_itr = :inc")
                attr_values[":inc"] = new_income
            if new_history:
                updates.append("itr_history = :hist")
                attr_values[":hist"] = new_history

        # District Update
        new_dist_id = details.get("district_id")
        curr_dist_id = item.get("district_id")
        
        logger.info(f"  District check: Current={curr_dist_id}, New={new_dist_id}")
        
        if self.force or not curr_dist_id:
            if new_dist_id and new_dist_id != curr_dist_id:
                updates.append("district_id = :dist")
                attr_values[":dist"] = new_dist_id
                logger.info(f"  Will update district_id to {new_dist_id}")
                if "district" in item:
                    remove_fields.append("district")
            elif new_dist_id == curr_dist_id and new_dist_id:
                logger.info("  District ID already correct.")
        
        if not updates:
            logger.info(f"  No new information to update for {pk}")
            return True

        # 5. Perform Update
        logger.info(f"  Updating {pk}: {', '.join(updates)}")
        if self.dry_run:
            logger.info("  [Dry Run] Skipping update.")
            return True

        try:
            update_expression = "SET " + ", ".join(updates)
            if remove_fields:
                update_expression += " REMOVE " + ", ".join(remove_fields)
            
            self.candidates_table.update_item(
                Key={"PK": pk, "SK": "DETAILS"},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=attr_values
            )
            logger.info(f"  Successfully updated {pk}")
            return True
        except Exception as e:
            logger.error(f"  Error updating {pk}: {e}")
            self.log_failure(pk)
            return False

    def update_person(self, person_id: str) -> int:
        """Update all candidates associated with a person."""
        logger.info(f"Processing person {person_id}")
        
        try:
            response = self.candidates_table.query(
                IndexName='PersonIndex',
                KeyConditionExpression=Key('person_id').eq(person_id)
            )
            items = response.get('Items', [])
            if not items:
                logger.warning(f"  No candidates found for person {person_id}")
                return 0
            
            logger.info(f"  Found {len(items)} candidates for person {person_id}")
            updated_count = 0
            for item in items:
                pk = item.get("PK")
                if pk and pk.startswith("AFFIDAVIT#"):
                    parts = pk.split("#")
                    if len(parts) == 3:
                        year, cid = parts[1], parts[2]
                        if self.update_affidavit(year, cid):
                            updated_count += 1
            return updated_count
            
        except Exception as e:
            logger.error(f"  Error querying candidates for person {person_id}: {e}")
            return 0

    def process_from_file(self, file_path: str) -> int:
        """Process affidavit IDs from a file."""
        if not os.path.exists(file_path):
            logger.error(f"Input file not found: {file_path}")
            return 0
        
        logger.info(f"Processing candidates from file: {file_path}")
        count = 0
        processed_count = 0
        # Read all IDs
        with open(file_path, "r") as f:
            all_ids = [line.strip() for line in f if line.strip()]
            
        logger.info(f"Processing {len(all_ids)} candidates from {file_path}")
        
        count = len(all_ids)
        processed_count = 0
        
        # Iterate over a copy so we can modify the original list
        for idx, aff_id in enumerate(all_ids[:]):
            logger.info(f"Processing candidate {aff_id} ({idx+1}/{count})")
            parts = aff_id.split("#")
            if len(parts) == 3:
                if self.update_affidavit(parts[1], parts[2]):
                    processed_count += 1
                    # Remove from the list and update file (ONLY IF NOT DRY RUN)
                    if not self.dry_run:
                        all_ids.remove(aff_id)
                        try:
                            with open(file_path, "w") as f:
                                for remaining_id in all_ids:
                                    f.write(f"{remaining_id}\n")
                        except Exception as e:
                            logger.error(f"Failed to update input file: {e}")
                    else:
                        logger.info(f"  [Dry Run] Not removing {aff_id} from input file.")
            else:
                logger.error(f"Invalid affidavit ID format: {aff_id}")
                    
        logger.info(f"Finished processing file. Processed {processed_count}/{count} items.")
        return processed_count

    def update_all(self) -> int:
        """Scan and update all candidates in the table."""
        logger.info("Scanning table for all candidates...")
        count = 0
        updated_count = 0
        
        try:
            response = self.candidates_table.scan()
            items = response.get("Items", [])
            
            while True:
                for item in items:
                    count += 1
                    pk = item.get("PK")
                    if pk and pk.startswith("AFFIDAVIT#"):
                        parts = pk.split("#")
                        if len(parts) == 3:
                            year, cid = parts[1], parts[2]
                            if self.update_affidavit(year, cid):
                                updated_count += 1
                                
                if "LastEvaluatedKey" in response:
                    response = self.candidates_table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
                    items = response.get("Items", [])
                else:
                    break
        except Exception as e:
            logger.error(f"Error during scan: {e}")
            
        logger.info(f"Finished scan. Processed {count} items, updated {updated_count}.")
        return updated_count

def main():
    parser = argparse.ArgumentParser(description="Update existing candidates with ITR and District information.")
    parser.add_argument("--affidavits", nargs="+", help="One or more affidavit IDs (e.g. AFFIDAVIT#2021#504)")
    parser.add_argument("--persons", nargs="+", help="One or more person IDs (e.g. PERSON#hash)")
    parser.add_argument("--all", action="store_true", help="Update all candidates in the database.")
    parser.add_argument("--input-file", help="Path to a file containing affidavit IDs to process.")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Don't perform actual updates.")
    parser.add_argument("--force", action="store_true", default=False, help="Update even if data already exists.")
    
    args = parser.parse_args()
    
    if not args.affidavits and not args.persons and not args.all and not args.input_file:
        parser.print_help()
        sys.exit(1)
        
    updater = CandidateUpdater(dry_run=args.dry_run, force=args.force)
    
    if args.all:
        updater.update_all()
        return

    if args.input_file:
        updater.process_from_file(args.input_file)
        return

    if args.affidavits:
        for aff_id in args.affidavits:
            parts = aff_id.split("#")
            if len(parts) == 3:
                updater.update_affidavit(parts[1], parts[2])
            else:
                logger.error(f"Invalid affidavit ID format: {aff_id}")

    if args.persons:
        for person_id in args.persons:
            updater.update_person(person_id)

if __name__ == "__main__":
    main()
