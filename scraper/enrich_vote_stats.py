#!/usr/bin/env python3

import csv
import os
import sys
import re
import argparse
import logging
from datetime import datetime
from typing import List, Dict, Optional, Any
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

# Ensure the script's directory is in sys.path for direct imports
sys.path.append(os.path.dirname(__file__))

# Import local modules using direct imports
from config import logger, REQUEST_DELAY
from utils import normalize_name, clean_constituency, canonicalize_constituency
from enrichment import IdentityResolver

# Configure logging to match enrichment.py
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("vote_stats_enricher")

# DynamoDB Configuration
REGION_NAME = "ap-south-2"
CANDIDATES_TABLE_NAME = "knowyourmla_candidates"
CONSTITUENCIES_TABLE_NAME = "knowyourmla_constituencies"

def clean_percentage(val: str) -> Decimal:
    """Extract Decimal from percentage string like '65.0 %' or '17.2%'."""
    if not val:
        return Decimal('0.0')
    match = re.search(r'(\d+\.?\d*)', val)
    return Decimal(match.group(1)) if match else Decimal('0.0')

def clean_int(val: str) -> int:
    """Extract integer from string like '363,029' or '40571'."""
    if not val:
        return 0
    # Remove commas and non-digits
    cleaned = re.sub(r'[^\d]', '', val)
    return int(cleaned) if cleaned else 0

class VoteStatsEnricher:
    def __init__(self, region: str = REGION_NAME):
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.candidates_table = self.dynamodb.Table(CANDIDATES_TABLE_NAME)
        self.constituencies_table = self.dynamodb.Table(CONSTITUENCIES_TABLE_NAME)
        self.resolver = IdentityResolver(self.dynamodb)

    def get_constituency_pk(self, ac_name: str, district: str) -> Optional[str]:
        """Match constituency by normalized name (with aliases) and district."""
        # Use resolver to handle aliases and cleanup
        pk = self.resolver.get_or_create_constituency(ac_name)
        
        try:
            # Check for existing METADATA
            response = self.constituencies_table.get_item(Key={'PK': pk, 'SK': 'METADATA'})
            if 'Item' in response:
                item = response['Item']
                db_district_id = item.get('district_id', '')
                
                # Use resolver to get canonical district ID
                csv_district_id = self.resolver.resolve_district_id(district)
                
                if db_district_id and csv_district_id and db_district_id != csv_district_id:
                    logger.warning(f"District mismatch for {ac_name}: DB={db_district_id}, CSV={csv_district_id}")
                
                return pk
            
            # If METADATA doesn't exist, it might be a new constituency found via alias
            # but we only want to enrich existing ones in this script.
            # However, IdentityResolver.get_or_create_constituency returns a PK even if it doesn't exist.
            # Let's verify if it exists at all.
            logger.warning(f"Constituency PK {pk} (from {ac_name}) not found in database with METADATA.")
            return None
            
        except ClientError as e:
            logger.error(f"Error fetching constituency {pk}: {e}")
            return None

    def get_winner_pk(self, constituency_id: str, winner_name: str, year: int) -> Optional[str]:
        """Match winner in constituency for a given year using ConstituencyIndex."""
        ac_name = constituency_id.replace("CONSTITUENCY#", "")
        
        try:
            # Efficiently query the GSI to find candidates for this constituency and year
            # PK format for candidates: AFFIDAVIT#<year>#<candidate_id>
            # ConstituencyIndex: HASH=constituency_id, RANGE=PK
            pk_prefix = f"AFFIDAVIT#{year}"
            
            response = self.candidates_table.query(
                IndexName='ConstituencyIndex',
                KeyConditionExpression=Key('constituency_id').eq(constituency_id) & 
                                       Key('PK').begins_with(pk_prefix)
            )
            items = response.get('Items', [])
            
            # Handle pagination for very large constituencies (rare for one year)
            while 'LastEvaluatedKey' in response:
                response = self.candidates_table.query(
                    IndexName='ConstituencyIndex',
                    KeyConditionExpression=Key('constituency_id').eq(constituency_id) & 
                                           Key('PK').begins_with(pk_prefix),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items.extend(response.get('Items', []))

            logger.info(f"Retrieved {len(items)} candidates for {constituency_id} in {year}")

            for item in items:
                db_name = item.get('candidate_name', '')
                from utils import names_are_similar
                logger.info(f"Comparing {db_name} with {winner_name}")
                if names_are_similar(db_name, winner_name):
                    logger.info(f"Found winner {winner_name} for {ac_name} {year}.")
                    return item['PK']
                
            if items:
                logger.debug(f"Candidates found but none matched {winner_name}: {[i.get('candidate_name') for i in items]}")

            logger.warning(f"Winner {winner_name} not found in {constituency_id} for {year}")
            return None
            
        except ClientError as e:
            logger.error(f"Error querying winner for {constituency_id}: {e}")
            return None

    def update_constituency(self, pk: str, year: int, stats: Dict, dry_run: bool):
        """
        Update constituency with year-specific statistics.
        Does not overwrite statistics from other years.
        """
        update_expr = "SET #stats.#year = :val"
        expr_names = {"#stats": "statistics", "#year": str(year)}
        expr_vals = {":val": stats}
        
        if dry_run:
            logger.info(f"  [DRY RUN] Would update constituency {pk} for year {year} with stats: {stats}")
            return

        try:
            # Step 1: Ensure the 'statistics' map exists without overwriting it if it already has other years
            self.constituencies_table.update_item(
                Key={'PK': pk, 'SK': 'METADATA'},
                UpdateExpression="SET #stats = if_not_exists(#stats, :empty_map)",
                ExpressionAttributeNames={"#stats": "statistics"},
                ExpressionAttributeValues={":empty_map": {}}
            )
            
            # Step 2: Append or update the specific year entry in the statistics map
            self.constituencies_table.update_item(
                Key={'PK': pk, 'SK': 'METADATA'},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_vals
            )
            logger.info(f"  Successfully updated statistics for year {year} in constituency {pk}")
        except ClientError as e:
            logger.error(f"  Failed to update constituency {pk} for year {year}: {e}")

    def update_candidate(self, pk: str, stats: Dict, dry_run: bool):
        """Update candidate with vote results."""
        updates = []
        expr_vals = {}
        
        for k, v in stats.items():
            updates.append(f"{k} = :{k}")
            expr_vals[f":{k}"] = v
            
        if not updates:
            return

        update_expr = "SET " + ", ".join(updates)
        
        if dry_run:
            logger.info(f"  [DRY RUN] Would update candidate {pk} with: {stats}")
            return

        try:
            self.candidates_table.update_item(
                Key={'PK': pk, 'SK': 'DETAILS'},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_vals
            )
            logger.info(f"  Updated candidate {pk}")
        except ClientError as e:
            logger.error(f"  Failed to update candidate {pk}: {e}")

    def enrich_from_csv(self, csv_path: str, year: int, dry_run: bool = False):
        if not os.path.exists(csv_path):
            logger.error(f"CSV file not found: {csv_path}")
            return

        logger.info(f"Starting enrichment for year {year} from {csv_path} (Dry Run: {dry_run})")
        
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                ac_name = row.get('AC Name')
                district = row.get('District')
                winner_name = row.get('Winning Candidate')
                if not ac_name or not winner_name:
                    continue
                
                logger.info(f"Processing AC: {ac_name} ({district})")
                
                # 1. Match Constituency
                const_pk = self.get_constituency_pk(ac_name, district)
                if not const_pk:
                    logger.warning(f"Could not find constituency for {ac_name}")
                    continue
                
                # 2. Match Winner
                winner_pk = self.get_winner_pk(const_pk, winner_name, year)
                
                # 3. Prepare Updates
                const_stats = {
                    "total_electors": clean_int(row.get('Total Electors')),
                    "total_votes_polled": clean_int(row.get('Total Votes')),
                    "poll_percentage": clean_percentage(row.get('Poll%'))
                }
                
                winner_stats = {
                    "total_votes": clean_int(row.get('Total Votes')), # Total AC votes
                    "winning_margin": clean_int(row.get('Margin')),
                    "margin_percentage": clean_percentage(row.get('Margin %'))
                }
                
                # 4. Apply Updates
                self.update_constituency(const_pk, year, const_stats, dry_run)
                if winner_pk:
                    self.update_candidate(winner_pk, winner_stats, dry_run)
                else:
                    logger.warning(f"Winner PK not found for {winner_name} in {ac_name}, skipping candidate update")
                
                count += 1
                
        logger.info(f"Finished processing {count} rows.")

def main():
    parser = argparse.ArgumentParser(description="Enrich vote statistics from IndiaVotes CSV.")
    parser.add_argument("--csv", default="scraper/assets/IndiaVotes_AC__Tamil_Nadu_2021.csv", help="Path to CSV file")
    parser.add_argument("--year", type=int, default=2021, help="Election year (default: 2021)")
    group = parser.add_mutually_exclusive_group(required=False)
    group.add_argument("--dryrun", action="store_true", default=True, help="Perform dry run (default)")
    group.add_argument("--execute", action="store_false", dest="dryrun", help="Execute updates")
    
    args = parser.parse_args()
    
    enricher = VoteStatsEnricher()
    enricher.enrich_from_csv(args.csv, args.year, dry_run=args.dryrun)

if __name__ == "__main__":
    main()
