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

    def parse_bool(self, val: Any) -> bool:
        """Parses a boolean from various string or primitive representations.

        Args:
            val: Input value (string, bool, or int).

        Returns:
            Boolean representation of value.
        """
        if not val:
            return False
        if isinstance(val, bool):
            return val
        return str(val).strip().lower() in ["true", "yes", "1", "incumbent", "t", "y"]

    def parse_int(self, val: str) -> int:
        if not val: return 0
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return 0

    def parse_decimal(self, val: str) -> Decimal:
        if not val: return Decimal('0')
        try:
            # Clean up percentage signs or commas if present
            clean_val = str(val).replace('%', '').replace(',', '').strip()
            return Decimal(clean_val)
        except (ValueError, TypeError, Exception):
            return Decimal('0')

    def _format_candidate_pk(self, candidate_id: str, year: str) -> str:
        """Formats candidate_id into standard candidate PK.

        Args:
            candidate_id: Raw candidate ID or PK.
            year: Election year.

        Returns:
            Formatted DynamoDB PK for knowyourmla_candidates.
        """
        clean_id = str(candidate_id).strip()
        if clean_id.startswith("AFFIDAVIT#"):
            return clean_id
        if clean_id.startswith(f"{year}#"):
            return f"AFFIDAVIT#{clean_id}"
        return f"AFFIDAVIT#{year}#{clean_id}"

    def _match_by_explicit_candidate_id(self, candidate_id: str, year: str) -> Dict[str, Any]:
        """Matches candidate using explicit candidate_id from CSV.

        Args:
            candidate_id: Candidate identifier or PK from CSV.
            year: Election year.

        Returns:
            Dictionary with pk, person_id, and is_update flag.
        """
        pk = self._format_candidate_pk(candidate_id, year)
        person_id = None
        is_update = True
        try:
            resp = self.candidates_table.get_item(Key={'PK': pk, 'SK': 'DETAILS'})
            item = resp.get('Item')
            if item:
                person_id = item.get('person_id')
                logger.debug(f"Matched existing candidate by candidate_id {pk} (person: {person_id})")
            else:
                logger.info(f"Explicit candidate_id {pk} provided; updating/creating candidate record.")
        except ClientError as e:
            logger.error(f"Error fetching candidate with PK {pk}: {e}")
        return {'pk': pk, 'person_id': person_id, 'is_update': is_update}

    def _resolve_nota_candidate(self, const_id: str, year: str) -> Dict[str, Any]:
        """Resolves PK and update status for NOTA candidate.

        Args:
            const_id: Constituency ID.
            year: Election year.

        Returns:
            Dictionary with pk, person_id, and is_update flag.
        """
        pk = f"AFFIDAVIT#{year}#NOTA#{const_id.split('#')[-1]}"
        is_update = False
        try:
            resp = self.candidates_table.get_item(Key={'PK': pk, 'SK': 'DETAILS'})
            if 'Item' in resp:
                is_update = True
        except ClientError:
            pass
        return {'pk': pk, 'person_id': 'PERSON#nota', 'is_update': is_update}

    def _resolve_candidate_match(
        self,
        row: Dict,
        details: AffidavitData,
        year: str,
        const_id: str,
        party_id: str,
        is_nota: bool,
        dry_run: bool
    ) -> Dict[str, Any]:
        """Resolves candidate PK, person_id, and update status.

        Args:
            row: CSV row dictionary.
            details: Prepared AffidavitData.
            year: Election year.
            const_id: Constituency ID.
            party_id: Political party ID.
            is_nota: True if candidate is NOTA.
            dry_run: True if running dry run.

        Returns:
            Dictionary with pk, person_id, and is_update.
        """
        if is_nota:
            return self._resolve_nota_candidate(const_id, year)

        raw_candidate_id = (
            row.get('candidate_id')
            or row.get('Candidate_ID')
            or row.get('Candidate_Id')
            or row.get('candidateId')
            or row.get('Candidate_id')
            or row.get('CANDIDATE_ID')
        )
        candidate_id = self.clean_val(str(raw_candidate_id)) if raw_candidate_id is not None else None
        if candidate_id:
            return self._match_by_explicit_candidate_id(candidate_id, year)

        return self._find_matching_candidate(details, year, const_id, party_id, dry_run)

    def _resolve_person_identity(
        self,
        details: AffidavitData,
        year: str,
        person_id: Optional[str],
        dry_run: bool
    ) -> str:
        """Resolves person_id through IdentityResolver with optional override.

        Args:
            details: Candidate affidavit details.
            year: Election year.
            person_id: Pre-matched person_id override if found.
            dry_run: Whether running in dry-run mode.

        Returns:
            Resolved person_id string.
        """
        if not person_id:
            return self.resolver.get_or_create_person(details, year, cid=0, dry_run=dry_run)
        return self.resolver.get_or_create_person(
            details, year, cid=0, dry_run=dry_run, person_id_override=person_id
        )

    def _maybe_update_constituency_stats(
        self,
        row: Dict,
        const_id: str,
        year: str,
        processed_constituencies: Optional[set]
    ) -> None:
        """Updates constituency aggregate statistics once per constituency.

        Args:
            row: CSV row dictionary.
            const_id: Constituency ID.
            year: Election year.
            processed_constituencies: Set tracking already updated constituencies.
        """
        if processed_constituencies is None or const_id in processed_constituencies:
            return

        ac_valid_votes = self.parse_int(row.get('Valid_Votes'))
        ac_electors = self.parse_int(row.get('Electors'))
        ac_poll_percent = self.parse_decimal(row.get('Turnout_Percentage'))
        if ac_valid_votes or ac_electors:
            self._update_constituency_stats(const_id, year, ac_valid_votes, ac_electors, ac_poll_percent)
            processed_constituencies.add(const_id)

    def process_row(
        self,
        row: Dict,
        dry_run: bool = False,
        row_index: int = -1,
        processed_constituencies: Optional[set] = None
    ) -> Optional[str]:
        """Processes a single CSV row of election data.

        Args:
            row: Dictionary containing row fields from CSV.
            dry_run: Whether to simulate without writing to database.
            row_index: 1-based index of row for logging.
            processed_constituencies: Set of constituency IDs already updated.

        Returns:
            Status string 'created', 'updated', or None if skipped.
        """
        year = str(row.get('Year') or '').strip()
        if not year or year == 'Year':
            return None

        candidate_name = self.clean_val(row.get('Candidate', ''))
        if not candidate_name:
            return None

        constituency_name = row.get('Constituency_Name')
        is_nota = candidate_name.lower() in ["none of the above", "nota", "none of the above (nota)"]

        if is_nota:
            candidate_name = "None Of The Above"
            party_id = "PARTY#nota"
            logger.info(f"Processing NOTA for {constituency_name} ({year})")
        else:
            party_id = self.resolver.resolve_party_id(row.get('Party'))
            logger.info(f"Processing candidate {candidate_name} ({constituency_name})")

        const_id = self.resolver.get_or_create_constituency(constituency_name, dry_run=dry_run)
        if not self._validate_constituency(const_id, constituency_name, candidate_name, row_index):
            return None

        dist_id = self.resolver.resolve_district_id(row.get('District_Name'))
        details = self._prepare_affidavit_details(row, candidate_name, constituency_name, party_id, dist_id)

        match_result = self._resolve_candidate_match(row, details, year, const_id, party_id, is_nota, dry_run)
        pk = match_result['pk']
        person_id = match_result['person_id']
        is_update = match_result['is_update']

        if not is_nota:
            person_id = self._resolve_person_identity(details, year, person_id, dry_run)

        if dry_run:
            self._log_dry_run_action(candidate_name, constituency_name, year, person_id, pk, is_update)
            return "updated" if is_update else "created"

        self._maybe_update_constituency_stats(row, const_id, year, processed_constituencies)

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

    def _prepare_affidavit_details(
        self,
        row: Dict,
        candidate_name: str,
        constituency_name: str,
        party_id: str,
        dist_id: str
    ) -> AffidavitData:
        """Prepares an AffidavitData instance from CSV row data.

        Args:
            row: Dictionary containing row fields.
            candidate_name: Cleaned candidate name.
            constituency_name: Constituency name.
            party_id: Resolved party ID.
            dist_id: Resolved district ID.

        Returns:
            AffidavitData object.
        """
        pid_val = row.get('pid')
        turncoat_val = (
            row.get('Turncoat')
            or row.get('turncoat')
            or row.get('is_turncoat')
            or row.get('Is_Turncoat')
            or row.get('Turn_Coat')
        )
        return AffidavitData(
            candidate_name=candidate_name,
            lastname=None,
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
            is_turncoat=self.parse_bool(turncoat_val),
            no_terms=self.parse_int(row.get('No_Terms')),
            candidate_type=self.clean_val(row.get('Candidate_Type')),
            candidacy_type=self.clean_val(row.get('Election_Type', 'General')),
            deposit_lost=self.parse_bool(row.get('Deposit_Lost'))
        )

    def _generate_fallback_candidate_pk(self, details: AffidavitData, year: str, const_id: str) -> str:
        """Generates deterministic fallback candidate PK.

        Args:
            details: Candidate affidavit details.
            year: Election year.
            const_id: Constituency ID.

        Returns:
            DynamoDB PK string.
        """
        if details.tcpd_pid:
            return f"AFFIDAVIT#{year}#T#{details.tcpd_pid}"
        hash_input = f"{year}_{const_id}_{details.candidate_name}".encode('utf-8')
        safe_pid = f"fallback_{hashlib.md5(hash_input).hexdigest()[:8]}"
        return f"AFFIDAVIT#{year}#T#{safe_pid}"

    def _match_same_year(
        self,
        same_year_pool: List[Dict],
        party_id: str,
        year: str,
        details: AffidavitData,
        fallback_pk: str
    ) -> Optional[Dict[str, Any]]:
        """Handles candidate matching for same election year.

        Args:
            same_year_pool: Candidates in same constituency and election year.
            party_id: Political party ID.
            year: Election year.
            details: Candidate affidavit details.
            fallback_pk: Fallback PK if creating new identity.

        Returns:
            Match dict if resolved, or None to fall through to cross-year.
        """
        same_party = next((c for c in same_year_pool if c.get('party_id') == party_id), None)
        if same_party:
            logger.debug(f"Matched existing candidate {same_party['PK']} ({same_party.get('candidate_name')}) for year {year}")
            return {'pk': same_party['PK'], 'person_id': same_party.get('person_id'), 'is_update': True}

        if not details.is_turncoat:
            logger.info(f"Name similarity found in {year} but Party ({party_id}) does not match existing records. Forcing new identity.")
            return {'pk': fallback_pk, 'person_id': None, 'is_update': False}

        turncoat_matches = [c for c in same_year_pool if self._check_age_match(c, year, details.age)]
        if turncoat_matches:
            matched = turncoat_matches[0]
            logger.info(f"Turncoat matched person {matched.get('person_id')} from party {matched.get('party_id')} in {year}")
            return {'pk': fallback_pk, 'person_id': matched.get('person_id'), 'is_update': False}

        return None

    def _find_matching_candidate(
        self,
        details: AffidavitData,
        year: str,
        const_id: str,
        party_id: str,
        dry_run: bool,
        candidate_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Finds matching candidate record in DynamoDB.

        Args:
            details: Affidavit data of candidate.
            year: Election year.
            const_id: Constituency ID.
            party_id: Political party ID.
            dry_run: Whether running in dry-run mode.
            candidate_id: Optional explicit candidate ID.

        Returns:
            Dictionary with pk, person_id, and is_update flag.
        """
        if candidate_id:
            return self._match_by_explicit_candidate_id(candidate_id, year)

        pk = self._generate_fallback_candidate_pk(details, year, const_id)
        person_id = None
        is_update = False

        try:
            resp = self.candidates_table.query(
                IndexName='ConstituencyIndex',
                KeyConditionExpression=Key('constituency_id').eq(const_id)
            )
            name_matches = self._get_name_matches(resp.get('Items', []), details.candidate_name)
            if not name_matches:
                return {'pk': pk, 'person_id': person_id, 'is_update': is_update}

            same_year_pool = [c for c in name_matches if str(c.get('year')) == str(year)]
            if same_year_pool:
                same_year_result = self._match_same_year(same_year_pool, party_id, year, details, pk)
                if same_year_result is not None:
                    return same_year_result

            cross_year_pool = [c for c in name_matches if str(c.get('year')) != str(year)]
            if cross_year_pool:
                best_matches = self._apply_tiebreak_logic(
                    cross_year_pool, party_id, year, details.age, is_turncoat=bool(details.is_turncoat)
                )
                if best_matches:
                    person_id = best_matches[0].get('person_id')
                    c_year = best_matches[0].get('year')
                    logger.info(f"Fallback Link: Matched person {person_id} from year {c_year} in same constituency (Turncoat={details.is_turncoat})")

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

    def _is_suitable_cross_year_candidate(
        self,
        candidate: Dict,
        party_id: str,
        year: str,
        age: Optional[int],
        is_turncoat: bool
    ) -> bool:
        """Determines if a candidate record is suitable for cross-year linking.

        Args:
            candidate: Candidate dictionary from database.
            party_id: Target party ID.
            year: Target election year.
            age: Target candidate age.
            is_turncoat: Whether candidate switched party.

        Returns:
            True if candidate is suitable for linking, False otherwise.
        """
        if candidate.get('party_id') == party_id:
            return True
        if not self._check_age_match(candidate, year, age):
            return False
        return is_turncoat or (party_id == 'PARTY#independent')

    def _apply_tiebreak_logic(
        self,
        name_matches: List[Dict],
        party_id: str,
        year: str,
        age: Optional[int],
        is_turncoat: bool = False
    ) -> List[Dict]:
        """Applies priority logic to narrow down cross-year matches.

        Args:
            name_matches: List of candidate records matching name.
            party_id: Target candidate party ID.
            year: Target election year.
            age: Target candidate age.
            is_turncoat: Whether candidate switched party.

        Returns:
            List of best candidate matches.
        """
        suitable = [
            c for c in name_matches
            if self._is_suitable_cross_year_candidate(c, party_id, year, age, is_turncoat)
        ]
        if not suitable:
            return []

        if not is_turncoat:
            party_matches = [c for c in suitable if c.get('party_id') == party_id]
            best_matches = party_matches or suitable
        else:
            best_matches = suitable

        if len(best_matches) > 1:
            age_matches = [c for c in best_matches if self._check_age_match(c, year, age)]
            if age_matches:
                best_matches = age_matches

        best_matches.sort(key=lambda x: int(x.get('year') or 0), reverse=True)
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

    def _update_constituency_stats(self, pk: str, year: str, total_votes: int, electors: int, poll_percentage: Decimal):
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
                    UpdateExpression="SET #stats.#yr.total_votes_polled = :tv, #stats.#yr.total_electors = :te, #stats.#yr.poll_percentage = :pp",
                    ConditionExpression="attribute_exists(PK)",
                    ExpressionAttributeNames={"#stats": "statistics", "#yr": str(year)},
                    ExpressionAttributeValues={":tv": total_votes, ":te": electors, ":pp": poll_percentage}
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
                        ExpressionAttributeValues={":map": {
                            "total_votes_polled": total_votes,
                            "total_electors": electors,
                            "poll_percentage": poll_percentage
                        }}
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
            "deposit_lost = :dl",
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
            ":ct": details.candidate_type, ":dl": details.deposit_lost, ":ctm": datetime.now(timezone.utc).isoformat()
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
