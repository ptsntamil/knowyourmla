#!/usr/bin/env python3

"""
Election Data CSV Importer
==========================

WHEN TO USE THIS FILE:
- Use this script when you have election result data in CSV format from external sources like TCPD (Trivedi Centre for Political Data) or OpenCity.
- It is designed to be used after the initial database setup and after any required master data (Constituencies, Parties, Districts) has been populated.

WHY TO USE THIS FILE:
- To automate the ingestion of large-scale election results into the KnowYourMLA DynamoDB tables.
- It handles complex logic such as candidate-to-person linking (deduplication), calculating winning margins, and updating constituency-level statistics.
- It ensures data consistency across different election years by using a centralized IdentityResolver.

WHERE TO USE THIS FILE:
- This script is part of the 'scraper' directory and should be run from the root of the project to ensure local imports (enrichment, utils) work correctly.
- It targets the 'knowyourmla_candidates' and 'knowyourmla_constituencies' DynamoDB tables.

HOW TO RUN THIS FILE:
- Prerequisites: Ensure AWS credentials are configured and required Python packages are installed (`pip install -r scraper/requirements.txt`).
- Basic Command:
    python3 scraper/import_election_csv.py --csv path/to/your/election_data.csv
- Dry Run (Recommended): To see what would happen without writing to the database:
    python3 scraper/import_election_csv.py --csv path/to/your/election_data.csv --dryrun
- Partial Import: To start from a specific row or limit the number of rows:
    python3 scraper/import_election_csv.py --csv path/to/data.csv --start 100 --limit 50
"""

import csv
import os
import sys
import argparse
import logging
import time
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

# Set up local imports
sys.path.append(os.path.dirname(__file__))
from enrichment import IdentityResolver, AffidavitData
from utils import names_are_similar, normalize_name, strip_initials

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("election_importer")

# DynamoDB Tables
CANDIDATES_TABLE = "knowyourmla_candidates"
CONSTITUENCIES_TABLE = "knowyourmla_constituencies"
PERSONS_TABLE = "knowyourmla_persons"
REGION_NAME = "ap-south-2"

class ElectionCSVImporter:
    def __init__(self, region: str = REGION_NAME):
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.candidates_table = self.dynamodb.Table(CANDIDATES_TABLE)
        self.constituencies_table = self.dynamodb.Table(CONSTITUENCIES_TABLE)
        self.persons_table = self.dynamodb.Table(PERSONS_TABLE)
        self.resolver = IdentityResolver(self.dynamodb)

    def clean_val(self, val: str) -> Optional[str]:
        if not val or val.lower() in ["", "none", "not available", "nan"]:
            return None
        return val.strip()

    def parse_bool(self, val: str) -> bool:
        if not val: return False
        return val.lower() in ["true", "yes", "1", "incumbent"]

    def parse_int(self, val: str) -> Optional[int]:
        if not val: return None
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return None

    def parse_decimal(self, val: str) -> Optional[Decimal]:
        if not val: return None
        try:
            # Clean up percentage signs or commas if present
            clean_val = str(val).replace('%', '').replace(',', '').strip()
            return Decimal(clean_val)
        except (ValueError, TypeError, Exception):
            return None

    def process_row(self, row: Dict, dry_run: bool = False, row_index: int = -1, processed_constituencies: Optional[set] = None):
        year = str(row.get('Year'))
        if not year or year == 'Year': return

        candidate_name = self.clean_val(row.get('Candidate', ''))
        if not candidate_name: return
        
        constituency_name = row.get('Constituency_Name')
        party_name = row.get('Party')

        # Handle NOTA candidate specially
        is_nota = candidate_name.lower() in ["none of the above", "nota", "none of the above (nota)"]
        
        if is_nota:
            candidate_name = "None Of The Above"
            person_id = "PERSON#nota"
            party_id = "PARTY#nota"
            logger.info(f"Processing NOTA for {constituency_name} ({year})")
        else:
            logger.info(f"Processing candidate {candidate_name} ({constituency_name})")

        # 1. Resolve Location & Party
        district_name = row.get('District_Name')

        const_id = self.resolver.get_or_create_constituency(constituency_name, dry_run=dry_run)
        if not self._validate_constituency(const_id, constituency_name, candidate_name, row_index):
            return

        if not is_nota:
            party_id = self.resolver.resolve_party_id(party_name)
        
        dist_id = self.resolver.resolve_district_id(district_name)

        # 2. Prepare Metadata for Resolver
        details = self._prepare_affidavit_details(row, candidate_name, constituency_name, party_id, dist_id)

        # 3. Match candidate (skip resolution for NOTA)
        if is_nota:
            # For NOTA, we generate a stable PK based on constituency and year
            pk = f"AFFIDAVIT#{year}#NOTA#{const_id.split('#')[-1]}"
            is_update = False
            # Check if this NOTA record already exists
            try:
                resp = self.candidates_table.get_item(Key={'PK': pk, 'SK': 'DETAILS'})
                if 'Item' in resp: is_update = True
            except ClientError: pass
        else:
            match_result = self._find_matching_candidate(details, year, const_id, party_id, dry_run)
            pk = match_result['pk']
            person_id = match_result['person_id']
            is_update = match_result['is_update']

        if dry_run:
            if not person_id and not is_nota:
                person_id = self.resolver.get_or_create_person(details, year, cid=0, dry_run=dry_run)
            self._log_dry_run_action(candidate_name, constituency_name, year, person_id, pk, is_update)
            return "updated" if is_update else "created"

        # 4. Resolve Person (if not already found via matching and not NOTA)
        if not is_nota:
            if not person_id:
                person_id = self.resolver.get_or_create_person(details, year, cid=0, dry_run=dry_run)
            else:
                self.resolver.get_or_create_person(details, year, cid=0, dry_run=dry_run, person_id_override=person_id)

        # 5. Update Constituency Statistics (only once per AC)
        if processed_constituencies is not None and const_id not in processed_constituencies:
            ac_valid_votes = self.parse_int(row.get('Valid_Votes'))
            if ac_valid_votes:
                self._update_constituency_stats(const_id, year, ac_valid_votes)
                processed_constituencies.add(const_id)

        # 6. Save/Update Candidate
        label = "winner stats" if details.position == 1 else "stats"
        action = "Updating" if is_update else "Creating"
        logger.info(f"  [{action}] {label} for {candidate_name} ({pk})")
        
        self._update_candidate(pk, person_id, const_id, dist_id, party_id, details, year)
        return "updated" if is_update else "created"

    def _validate_constituency(self, const_id: str, constituency_name: str, candidate_name: str, row_index: int) -> bool:
        try:
            const_resp = self.constituencies_table.get_item(Key={'PK': const_id, 'SK': 'METADATA'})
            if 'Item' not in const_resp:
                logger.error(f"Row {row_index}: Constituency NOT FOUND for '{constituency_name}' (resolved to {const_id}). Alias mismatch likely. Skipping candidate {candidate_name}.")
                return False
            return True
        except ClientError as e:
            logger.error(f"Row {row_index}: Error querying constituency {const_id}: {e}")
            return False

    def _prepare_affidavit_details(self, row: Dict, candidate_name: str, constituency_name: str, party_id: str, dist_id: str) -> AffidavitData:
        pid_val = row.get('pid')
        return AffidavitData(
            candidate_name=candidate_name,
            lastname=None, # This is not available in TCPD data
            age=self.parse_int(row.get('Age')),
            sex=self.clean_val(row.get('Sex')),
            tcpd_pid=self.clean_val(pid_val) if pid_val else None,
            constituency=constituency_name,
            party_id=party_id,
            district_id=dist_id,
            position=self.parse_int(row.get('Position')),
            total_votes=self.parse_int(row.get('Votes')),
            winning_margin=self.parse_int(row.get('Margin')),
            margin_percentage=self.parse_decimal(row.get('Margin_Percentage')),
            is_incumbent=self.parse_bool(row.get('Incumbent')),
            is_turncoat=self.parse_bool(row.get('Turncoat')),
            no_terms=self.parse_int(row.get('No_Terms')),
            candidate_type=self.clean_val(row.get('Candidate_Type')),
            candidacy_type=self.clean_val(row.get('Election_Type', 'General'))
        )

    def _find_matching_candidate(self, details: AffidavitData, year: str, const_id: str, party_id: str, dry_run: bool) -> Dict:
        pk = None
        person_id = None
        is_update = False
        
        # Generate a fallback PK
        safe_pid = details.tcpd_pid
        if not safe_pid:
            hash_input = f"{year}_{const_id}_{details.candidate_name}".encode('utf-8')
            safe_pid = f"fallback_{hashlib.md5(hash_input).hexdigest()[:8]}"
        pk = f"AFFIDAVIT#{year}#T#{safe_pid}"

        try:
            resp = self.candidates_table.query(
                IndexName='ConstituencyIndex',
                KeyConditionExpression=Key('constituency_id').eq(const_id)
            )
            candidates = resp.get('Items', [])
            
            # 1. Filter by Name Similarity
            name_matches = self._get_name_matches(candidates, details.candidate_name)
            # print(f"Names {name_matches}")
            if not name_matches:
                return {'pk': pk, 'person_id': person_id, 'is_update': is_update}

            # 2. Tiered Matching Strategy
            # Use separate pools for Same Year (Updates) vs Cross Year (Links)
            same_year_pool = [c for c in name_matches if str(c.get('year')) == str(year)]
            cross_year_pool = [c for c in name_matches if str(c.get('year')) != str(year)]
            # print(f"Same Year {same_year_pool}")
            # print(f"Cross Year {cross_year_pool}")
            # A. Same-Year Handle if only one candidate(Update case)
            # if len(same_year_pool) == 1:
            #     pk = same_year_pool[0]['PK']
            #     person_id = same_year_pool[0].get('person_id')
            #     is_update = True
            #     logger.debug(f"    Matched existing candidate {pk} ({same_year_pool[0].get('candidate_name')}) for contest year {year}")
            #     return {'pk': pk, 'person_id': person_id, 'is_update': is_update}
            # print(f"Party id: {party_id} ----- {same_year_pool[0].get('party_id')}")
            # A.a Multiple Candidates with same name party match for same-year updates
            same_year_record = next((c for c in same_year_pool if c.get('party_id') == party_id ), None)
            if same_year_record:
                pk = same_year_record['PK']
                person_id = same_year_record.get('person_id')
                is_update = True
                logger.debug(f"    Matched existing candidate {pk} ({same_year_record.get('candidate_name')}) for contest year {year}")
                return {'pk': pk, 'person_id': person_id, 'is_update': is_update}
            elif same_year_pool:
                # Same name candidate exists in this year but with DIFFERENT party
                # Force new person creation for this candidate to be safe
                logger.info(f"    Name similarity found in {year} but Party ({party_id}) does not match existing records. Forcing new identity.")
                return {'pk': pk, 'person_id': None, 'is_update': False}

            # B. Cross-Year Handle (Link case)
            if cross_year_pool:
                best_matches = self._apply_tiebreak_logic(cross_year_pool, party_id, year, details.age)
                if best_matches:
                    person_id = best_matches[0].get('person_id')
                    c_year = best_matches[0].get('year')
                    logger.info(f"    Fallback Link: Matched person {person_id} from year {c_year} in same constituency (Name/Party priority)")

        except ClientError as e:
            logger.debug(f"Candidate constituency lookup failed: {e}")

        return {'pk': pk, 'person_id': person_id, 'is_update': is_update}

    def _get_name_matches(self, candidates: List[Dict], target_name: str) -> List[Dict]:
        """Filters candidates by name similarity."""
        name_matches = []
        target_stripped = strip_initials(target_name) or normalize_name(target_name)
        for c in candidates:
            c_name = c.get('candidate_name', '')
            c_stripped = strip_initials(c_name) or normalize_name(c_name)
            if names_are_similar(target_stripped, c_stripped) or names_are_similar(target_name, c_name):
                name_matches.append(c)
        return name_matches

    def _apply_tiebreak_logic(self, name_matches: List[Dict], party_id: str, year: str, age: Optional[int]) -> List[Dict]:
        """Applies priority logic to narrow down cross-year matches."""
        # 1. Potential suitable candidates must match (Party OR (Independent AND Age))
        potentially_suitable = []
        for c in name_matches:
            is_party_match = (c.get('party_id') == party_id)
            # Age-based matching only allowed for cross-year OR as tie-break for independents
            is_age_matched = self._check_age_match(c, year, age)
            
            # Allow link if party matches OR if it's an independent with matching age
            if is_party_match or (party_id == 'PARTY#independent' and is_age_matched):
                potentially_suitable.append(c)
        
        if not potentially_suitable:
            return []

        # 2. Priority 1: Match Party
        party_matches = [c for c in potentially_suitable if c.get('party_id') == party_id]
        if party_matches:
            best_matches = party_matches
        else:
            best_matches = potentially_suitable

        # 3. Priority 2: Match Age (Secondary tie-break)
        if len(best_matches) > 1:
            age_matches = [c for c in best_matches if self._check_age_match(c, year, age)]
            if age_matches:
                best_matches = age_matches
        
        return best_matches

    def _check_age_match(self, c: Dict, year: str, current_age: Optional[int]) -> bool:
        """Checks if age or birth year is consistent between records."""
        if not current_age:
            return True # Cannot verify age, assume match if name/party matched
            
        db_age = c.get('age')
        db_year = c.get('year') or c.get('PK', '').split('#')[1]
        
        if db_age is None:
            # Fetch birth_year from persons table as fallback
            db_birth_year = self._get_person_birth_year(c.get('person_id'))
            if db_birth_year:
                db_age = int(db_year) - int(db_birth_year)
        
        if db_age is not None:
            # Compare ages relative to their respective election years
            # db_age in db_year vs current_age in year
            target_birth_year = int(year) - int(current_age)
            db_birth_year_calc = int(db_year) - int(db_age)
            return abs(target_birth_year - db_birth_year_calc) <= 2
            
        return True # No age data in DB, assume match

    def _get_person_birth_year(self, person_id: str) -> Optional[int]:
        if not person_id: return None
        try:
            resp = self.persons_table.get_item(Key={'PK': person_id, 'SK': 'METADATA'})
            if 'Item' in resp:
                return resp['Item'].get('birth_year')
        except ClientError:
            pass
        return None

    def _log_dry_run_action(self, candidate_name: str, constituency_name: str, year: str, person_id: str, pk: str, is_update: bool):
        if not person_id:
            logger.info(f"          Action: Would create NEW Person and then link to candidate record {pk}")
        else:
            action = "Updating" if is_update else "Creating"
            logger.info(f"          Action: Found existing Person: {person_id}")
            logger.info(f"          Action: {action} candidate record {pk}")

    def _update_constituency_stats(self, pk: str, year: str, total_votes: int):
        """Update total AC votes in constituency statistics."""
        try:
            # Ensure the 'statistics' map exists first
            self.constituencies_table.update_item(
                Key={'PK': pk, 'SK': 'METADATA'},
                UpdateExpression="SET #stats = if_not_exists(#stats, :empty_map)",
                ConditionExpression="attribute_exists(PK)",
                ExpressionAttributeNames={"#stats": "statistics"},
                ExpressionAttributeValues={":empty_map": {}}
            )
            
            try:
                # Try updating the specific year's nested attribute
                self.constituencies_table.update_item(
                    Key={'PK': pk, 'SK': 'METADATA'},
                    UpdateExpression="SET #stats.#yr.total_votes_polled = :tv",
                    ConditionExpression="attribute_exists(PK)",
                    ExpressionAttributeNames={"#stats": "statistics", "#yr": str(year)},
                    ExpressionAttributeValues={":tv": total_votes}
                )
            except ClientError as e:
                # If the year map doesn't exist, ValidationException is thrown
                if e.response['Error']['Code'] == 'ValidationException' and 'document path provided in the update expression is invalid' in e.response['Error']['Message']:
                    # Create the year map with the value
                    self.constituencies_table.update_item(
                        Key={'PK': pk, 'SK': 'METADATA'},
                        UpdateExpression="SET #stats.#yr = :map",
                        ConditionExpression="attribute_exists(PK)",
                        ExpressionAttributeNames={"#stats": "statistics", "#yr": str(year)},
                        ExpressionAttributeValues={":map": {"total_votes_polled": total_votes}}
                    )
                else:
                    raise
                    
            logger.debug(f"    Updated Constituency Stats for {pk} year {year}")
        except ClientError as e:
            logger.error(f"    Failed to update constituency stats for {pk}: {e}")

    def _update_candidate(self, pk: str, person_id: str, const_id: str, dist_id: str, party_id: str, details: AffidavitData, year: str):
        updates = [
            "person_id = :pid",
            "constituency_id = :cid",
            "district_id = :did",
            "party_id = :pty",
            "is_winner = :win",
            "candidate_name = :name",
            "#yr = :yr",
            "#pos = :pos",
            "total_votes = :tv",
            "winning_margin = :wm",
            "margin_percentage = :mp",
            "is_incumbent = :inc",
            "is_turncoat = :tc",
            "no_terms = :nt",
            "candidate_type = :ct",
            "createdtime = if_not_exists(createdtime, :ctm)"
        ]
        
        if details.age:
            updates.append("age = :age")
        
        is_winner = (details.position == 1)
        
        vals = {
            ":pid": person_id, ":cid": const_id, ":did": dist_id, ":pty": party_id,
            ":win": is_winner, ":name": details.candidate_name,
            ":yr": int(year), ":pos": details.position,
            ":tv": details.total_votes, ":wm": details.winning_margin, ":mp": details.margin_percentage,
            ":inc": details.is_incumbent, ":tc": details.is_turncoat, ":nt": details.no_terms,
            ":ct": details.candidate_type, ":ctm": datetime.now(timezone.utc).isoformat()
        }
        
        if details.age:
            vals[":age"] = details.age
        
        # Remove empty numerical values instead of writing None if DynamoDB complains about types
        
        try:
            self.candidates_table.update_item(
                Key={'PK': pk, 'SK': 'DETAILS'},
                UpdateExpression="SET " + ", ".join(updates),
                ExpressionAttributeNames={"#yr": "year", "#pos": "position"},
                ExpressionAttributeValues=vals
            )
        except ClientError as e:
            logger.error(f"    Failed to update candidate {pk}: {e}")

    def import_csv(self, csv_path: str, dry_run: bool = False, start_index: int = 0, limit: Optional[int] = None, target_constituency: Optional[str] = None):
        if not os.path.exists(csv_path):
            logger.error(f"File not found: {csv_path}")
            return

        target_const_norm = normalize_name(target_constituency) if target_constituency else None
        processed_constituencies = set()

        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = list(csv.DictReader(f))
            total_rows = len(reader)
            
            # Application of start and limit
            end_index = total_rows
            if limit is not None:
                end_index = min(start_index + limit, total_rows)
            
            rows_to_process = reader[start_index:end_index]
            
            if target_const_norm:
                logger.info(f"Filtering for constituency: {target_constituency} ({target_const_norm})")

            count = 0
            created_count = 0
            updated_count = 0
            for row in rows_to_process:
                try:
                    ac_name = row.get('Constituency_Name')
                    if target_const_norm and normalize_name(ac_name or "") != target_const_norm:
                        continue
                    
                    # +2 since start_index is 0-based and CSV has a header row
                    status = self.process_row(row, dry_run, row_index=start_index + count + 2, processed_constituencies=processed_constituencies)
                    if status == "created":
                        created_count += 1
                    elif status == "updated":
                        updated_count += 1
                    
                    if status:
                        count += 1

                    if count > 0 and count % 100 == 0:
                        logger.info(f"Processed {count} records so far...")
                except Exception as e:
                    logger.error(f"Error processing row {start_index + count}: {e}")
            
            logger.info(f"Finished. Created: {created_count}, Updated: {updated_count}. Successfully processed {count} records across {len(processed_constituencies)} constituencies.")

def main():
    parser = argparse.ArgumentParser(description="Import Election Data CSV (OpenCity/TCPD) into DynamoDB.")
    parser.add_argument("--csv", default="assets/OpenCity_TN_Assembly_Election_2021.csv", help="Path to Election CSV")
    parser.add_argument("--dryrun", action="store_true", help="Perform dry run without writing to DB")
    parser.add_argument("--start", type=int, default=0, help="Start row index (0-based)")
    parser.add_argument("--limit", type=int, default=None, help="Maximum number of rows to process")
    parser.add_argument("--constituency", "-c", help="Specific constituency to process (optional)")
    args = parser.parse_args()

    importer = ElectionCSVImporter()
    importer.import_csv(args.csv, dry_run=args.dryrun, start_index=args.start, limit=args.limit, target_constituency=args.constituency)

if __name__ == "__main__":
    main()
