#!/usr/bin/env python3

import csv
import os
import sys
import re
import argparse
import logging
from datetime import datetime, timezone
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
from enrichment import IdentityResolver, AffidavitData

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

    def get_constituency_pk(self, ac_name: str) -> Optional[str]:
        """Match constituency by normalized name (with aliases)."""
        # Use resolver to handle aliases and cleanup
        pk = self.resolver.get_or_create_constituency(ac_name)
        
        try:
            # Check for existing METADATA
            response = self.constituencies_table.get_item(Key={'PK': pk, 'SK': 'METADATA'})
            if 'Item' in response:
                return pk
            
            logger.warning(f"Constituency PK {pk} (from {ac_name}) not found in database with METADATA.")
            return None
            
        except ClientError as e:
            logger.error(f"Error fetching constituency {pk}: {e}")
            return None

    def get_constituency_candidates(self, constituency_id: str, year: int) -> List[Dict]:
        """Fetch all candidates for a constituency and year from GSI."""
        try:
            # PK format for candidates: AFFIDAVIT#<year>#<candidate_id>
            # ConstituencyIndex: HASH=constituency_id, RANGE=PK
            pk_prefix = f"AFFIDAVIT#{year}"
            
            response = self.candidates_table.query(
                IndexName='ConstituencyIndex',
                KeyConditionExpression=Key('constituency_id').eq(constituency_id) & 
                                       Key('PK').begins_with(pk_prefix)
            )
            items = response.get('Items', [])
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = self.candidates_table.query(
                    IndexName='ConstituencyIndex',
                    KeyConditionExpression=Key('constituency_id').eq(constituency_id) & 
                                           Key('PK').begins_with(pk_prefix),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items.extend(response.get('Items', []))

            logger.info(f"Retrieved {len(items)} candidates from DB for {constituency_id} in {year}")
            return items
            
        except ClientError as e:
            logger.error(f"Error querying candidates for {constituency_id}: {e}")
            return []

    def match_candidate_in_list(self, items: List[Dict], target_name: str, target_party: Optional[str] = None) -> Optional[str]:
        """Find candidate PK in list by name similarity and optionally party."""
        from utils import names_are_similar
        
        target_party_id = self.resolver.resolve_party_id(target_party) if target_party else None
        
        for item in items:
            db_name = item.get('candidate_name', '')
            db_party_id = item.get('party_id')
            
            if names_are_similar(db_name, target_name):
                # If party info is available in both, it must match
                if target_party_id and db_party_id:
                    if target_party_id == db_party_id:
                        return item['PK']
                    else:
                        continue # Name matches but different party
                
                # Fallback to name-only match if party info is incomplete
                return item['PK']
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

    def create_minimal_candidate(self, cand_name: str, party_name: str, const_pk: str, year: int, person_id: str, is_winner: bool, stats: Dict, dry_run: bool) -> str:
        """Create a new candidate record for a person for the given year."""
        import hashlib
        # Generate a stable candidate ID (prefix ext_ to distinguish from MyNeta IDs)
        # Seed with name, const, year for idempotency
        seed = f"{cand_name}_{const_pk}_{year}".encode()
        unique_suffix = hashlib.md5(seed).hexdigest()[:8]
        cand_id = f"ext_{unique_suffix}"
        pk = f"AFFIDAVIT#{year}#{cand_id}"
        
        item = {
            "PK": pk,
            "SK": "DETAILS",
            "person_id": person_id,
            "constituency_id": const_pk,
            "candidate_name": cand_name,
            "party_id": self.resolver.resolve_party_id(party_name),
            "year": int(year),
            "is_winner": is_winner,
            "createdtime": datetime.now(timezone.utc).isoformat(),
            **stats
        }
        
        if dry_run:
            logger.info(f"  [DRY RUN] Would create NEW candidate {pk} (Person: {person_id})")
        else:
            try:
                self.candidates_table.put_item(Item=item)
                logger.info(f"  Successfully created NEW candidate {pk} for {cand_name} ({person_id})")
            except ClientError as e:
                logger.error(f"  Error creating candidate record {pk}: {e}")
        
        return pk

    def _find_person_by_name_and_party(self, name: str, party_id: str) -> Optional[str]:
        """Search for a person who has run for this party under this name before."""
        from utils import normalize_name
        norm_name = normalize_name(name)
        
        try:
            # Query the NameIndex on the persons table
            response = self.resolver.persons_table.query(
                IndexName='NameIndex',
                KeyConditionExpression=Key('normalized_name').eq(norm_name)
            )
            items = response.get('Items', [])
            
            for item in items:
                person_id = item['PK']
                # Check this person's historical candidacies via PersonIndex on the candidates table
                c_resp = self.candidates_table.query(
                    IndexName='PersonIndex',
                    KeyConditionExpression=Key('person_id').eq(person_id)
                )
                candidacies = c_resp.get('Items', [])
                if any(c.get('party_id') == party_id for c in candidacies):
                    return person_id
            
            return None
        except ClientError as e:
            logger.error(f"Error searching person by name+party: {e}")
            return None

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

    def enrich_from_csv(self, csv_path: str, year: int, dry_run: bool = False, target_constituency: Optional[str] = None):
        if not os.path.exists(csv_path):
            logger.error(f"CSV file not found: {csv_path}")
            return

        logger.info(f"Starting enrichment for year {year} from {csv_path} (Dry Run: {dry_run})")
        
        if target_constituency:
            target_const_norm = normalize_name(target_constituency)
            logger.info(f"Filtering for constituency: {target_constituency} ({target_const_norm})")
        else:
            target_const_norm = None

        processed_constituencies = set()
        cached_candidates = []
        current_const_pk = None

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                # Support different CSV column naming conventions (IndiaVotes, OpenCity, etc.)
                ac_name = row.get('AC Name') or row.get('Constituency_Name')
                
                # Filter by constituency if requested
                if target_const_norm and normalize_name(ac_name or "") != target_const_norm:
                    continue
                
                # Handle winner filtering if 'Position' exists (OpenCity format)
                position = row.get('Position')
                is_winner = True
                if position is not None:
                    try:
                        # Position can be '1' or '1.0'
                        is_winner = int(float(position)) == 1
                    except (ValueError, TypeError):
                        is_winner = False
                
                # Extract candidate name and party based on source format
                cand_name = row.get('Winning Candidate') or row.get('Candidate')
                party_name = row.get('Party')
                
                if not ac_name or not cand_name:
                    continue
                
                # 1. Match Constituency
                const_pk = self.get_constituency_pk(ac_name)
                if not const_pk:
                    logger.warning(f"Could not find constituency for {ac_name}")
                    continue
                
                # 2. Update Constituency Stats (only once per AC)
                if const_pk not in processed_constituencies:
                    const_stats = {
                        "total_electors": clean_int(row.get('Total Electors') or row.get('Electors')),
                        "total_votes_polled": clean_int(row.get('Total Votes') or row.get('Valid_Votes')),
                        "poll_percentage": clean_percentage(row.get('Poll%') or row.get('Turnout_Percentage'))
                    }
                    self.update_constituency(const_pk, year, const_stats, dry_run)
                    processed_constituencies.add(const_pk)
                
                # Cache candidates if constituency changes
                if const_pk != current_const_pk:
                    current_const_pk = const_pk
                    cached_candidates = self.get_constituency_candidates(const_pk, year)
                
                # 3. Update Candidate Stats (all candidates)
                candidate_stats = {
                    "total_votes": clean_int(row.get('Votes') or row.get('Total Votes')),
                }
                
                candidate_stats["winning_margin"] = clean_int(row.get('Margin'))
                candidate_stats["margin_percentage"] = clean_percentage(row.get('Margin %') or row.get('Margin_Percentage'))
                
                # Match Candidate from cache (with party check)
                cand_pk = self.match_candidate_in_list(cached_candidates, cand_name, party_name)
                
                if cand_pk:
                    label = "winner stats" if is_winner else "stats"
                    logger.info(f"Updating {label} for {cand_name} in {ac_name}")
                    self.update_candidate(cand_pk, candidate_stats, dry_run)
                else:
                    # FALLBACK: Create new candidate and maybe person
                    logger.info(f"Candidate {cand_name} not found for {year} in {ac_name}. Attempting identity resolution (Party-Aware)...")
                    
                    # Construct minimal AffidavitData for the resolver
                    target_party_id = self.resolver.resolve_party_id(party_name)
                    details = AffidavitData(
                        candidate_name=cand_name,
                        party_id=target_party_id,
                        year=int(year)
                    )
                    
                    # Step 1: Find person who has run for this party under this name before
                    person_id = self._find_person_by_name_and_party(cand_name, target_party_id)
                    
                    if person_id:
                        logger.info(f"  Matched existing person {person_id} (Same Party History)")
                    else:
                        # Step 2: Register a new person record
                        from utils import strip_initials
                        norm_name = normalize_name(cand_name)
                        person_id = self.resolver._register_new_person(
                            details, cand_name, norm_name, None, None, 0, dry_run=dry_run
                        )
                        logger.info(f"  Registered NEW person record {person_id} for {cand_name}")
                    
                    if person_id:
                        # Create the new candidate record for this person (linked by person_id)
                        cand_pk = self.create_minimal_candidate(
                            cand_name, party_name, const_pk, year, person_id, is_winner, candidate_stats, dry_run
                        )
                        # Update cache for future rows in same CSV (though usually not needed)
                        if not dry_run:
                            cached_candidates.append({"PK": cand_pk, "candidate_name": cand_name, "party_id": details.party_id})
                    else:
                        logger.error(f"Could not resolve person for {cand_name}, skipping candidate creation")
                
                count += 1
                
        logger.info(f"Finished processing {count} rows across {len(processed_constituencies)} constituencies.")

def main():
    parser = argparse.ArgumentParser(description="Enrich vote statistics from IndiaVotes CSV.")
    parser.add_argument("--csv", default="scraper/assets/IndiaVotes_AC__Tamil_Nadu_2021.csv", help="Path to CSV file")
    parser.add_argument("--year", type=int, default=2021, help="Election year (default: 2021)")
    parser.add_argument("--constituency", "-c", help="Specific constituency to process (optional)")
    group = parser.add_mutually_exclusive_group(required=False)
    group.add_argument("--dryrun", action="store_true", default=True, help="Perform dry run (default)")
    group.add_argument("--execute", action="store_false", dest="dryrun", help="Execute updates")
    
    args = parser.parse_args()
    
    enricher = VoteStatsEnricher()
    enricher.enrich_from_csv(args.csv, args.year, dry_run=args.dryrun, target_constituency=args.constituency)

if __name__ == "__main__":
    main()
