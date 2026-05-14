#!/usr/bin/env python3

import os
import sys
import json
import argparse
import logging
from decimal import Decimal
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

import boto3
from botocore.exceptions import ClientError

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

from utils import normalize_name, names_are_similar, canonicalize_constituency, convert_floats_to_decimal

class DecimalEncoder(json.JSONEncoder):
    """JSON Encoder that converts Decimal objects to float/int."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

# Constants
POLLING_RESULTS_TABLE = "knowyourmla_polling_results"
CANDIDATES_TABLE = "knowyourmla_candidates"
CONSTITUENCIES_TABLE = "knowyourmla_constituencies"
REGION_NAME = "ap-south-2"

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PollingDataImporter:
    def __init__(self, region: str = REGION_NAME):
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.polling_table = self.dynamodb.Table(POLLING_RESULTS_TABLE)
        self.candidates_table = self.dynamodb.Table(CANDIDATES_TABLE)
        self.constituencies_table = self.dynamodb.Table(CONSTITUENCIES_TABLE)
        self.candidate_mappings = {}

    def generate_mapping_from_db(self, year: int = 2026, output_file: str = None):
        """Fetch candidates from DynamoDB and generate a mapping file."""
        logger.info(f"Generating mapping from DB for year {year}...")
        try:
            candidates = []
            exclusive_start_key = None
            
            while True:
                query_kwargs = {
                    'IndexName': 'YearIndex',
                    'KeyConditionExpression': boto3.dynamodb.conditions.Key('year').eq(year)
                }
                if exclusive_start_key:
                    query_kwargs['ExclusiveStartKey'] = exclusive_start_key
                
                response = self.candidates_table.query(**query_kwargs)
                items = response.get('Items', [])
                for item in items:
                    # Resolve constituency name from constituency_id
                    const_id = item.get('constituency_id', '')
                    # Use canonicalize to ensure we are consistent
                    const_name = const_id.replace('CONSTITUENCY#', '')
                    
                    # Resolve party name from party_id
                    party_id = item.get('party_id', '')
                    party_name = party_id.replace('PARTY#', '')

                    candidate_info = {
                        "constituency": const_name,
                        "name": item.get('candidate_name', ''),
                        "party_name": party_name,
                        "db_candidate_pk": item.get('PK')
                    }
                    candidates.append(candidate_info)
                
                exclusive_start_key = response.get('LastEvaluatedKey')
                if not exclusive_start_key:
                    break
            
            logger.info(f"Fetched {len(candidates)} candidates from DB.")
            
            if output_file:
                with open(output_file, 'w') as f:
                    json.dump(candidates, f, indent=2)
                logger.info(f"Saved mapping to {output_file}")
            
            # Populate in-memory mapping
            for entry in candidates:
                const_norm = canonicalize_constituency(entry.get('constituency', ''))
                name_norm = normalize_name(entry.get('name', ''))
                party_norm = normalize_name(entry.get('party_name', ''))
                self.candidate_mappings[(const_norm, name_norm, party_norm)] = entry.get('db_candidate_pk')

        except Exception as e:
            logger.error(f"Failed to generate mapping from DB: {e}")
            sys.exit(1)

    def load_mappings(self, mapping_file: str):
        """Load candidate name-to-ID mappings from JSON."""
        logger.info(f"Loading mappings from {mapping_file}...")
        try:
            with open(mapping_file, 'r') as f:
                data = json.load(f)
                for entry in data:
                    const_norm = normalize_name(entry.get('constituency', ''))
                    name_norm = normalize_name(entry.get('name', ''))
                    party_norm = normalize_name(entry.get('party_name', ''))
                    
                    key = (const_norm, name_norm, party_norm)
                    self.candidate_mappings[key] = entry.get('db_candidate_pk')
            logger.info(f"Loaded {len(self.candidate_mappings)} mappings.")
        except Exception as e:
            logger.error(f"Failed to load mappings: {e}")
            sys.exit(1)

    def resolve_candidate(self, const_norm: str, name: str, party: str) -> Optional[str]:
        """Resolve a candidate name to their db_candidate_pk."""
        name_norm = normalize_name(name)
        party_norm = normalize_name(party)
        
        # Direct match
        key = (const_norm, name_norm, party_norm)
        if key in self.candidate_mappings:
            return self.candidate_mappings[key]
        
        # Fuzzy match if direct match fails
        for (m_const, m_name, m_party), db_pk in self.candidate_mappings.items():
            if m_const == const_norm and m_party == party_norm:
                if names_are_similar(name, m_name):
                    return db_pk
        
        logger.warning(f"Could not resolve candidate: {name} ({party}) in {const_norm}")
        return None

    def process_ac_file(self, file_path: str, dry_run: bool = False):
        """Process a Form 20 JSON file for an entire AC."""
        logger.info(f"Processing file: {file_path}")
        with open(file_path, 'r') as f:
            data = json.load(f)

        meta = data.get('meta', {})
        ac_name = meta.get('ac_name')
        ac_no = meta.get('ac_no')
        year = int(meta.get('year', 2026))
        total_electors = int(meta.get('total_electors', 0))
        
        const_norm = canonicalize_constituency(ac_name)
        const_id = f"CONSTITUENCY#{const_norm}"
        
        json_candidates = data.get('candidates', {})
        stations = data.get('stations', [])

        # Pass 1: Calculate total votes for each candidate in this AC
        candidate_totals = {}  # local_id -> total_votes
        total_valid_votes = 0
        total_nota_votes = 0
        total_rejected_votes = 0
        total_votes_polled = 0

        for ps in stations:
            v_map = ps.get('v', {})
            for cid, votes in v_map.items():
                candidate_totals[cid] = candidate_totals.get(cid, 0) + votes
            
            total_valid_votes += ps.get('valid', 0)
            total_nota_votes += ps.get('nota', 0)
            total_rejected_votes += ps.get('rej', 0)
            total_votes_polled += ps.get('total', 0)

        # Map local_id to db_candidate_pk
        id_map = {} # local_id -> db_pk
        for cid, info in json_candidates.items():
            db_pk = self.resolve_candidate(const_norm, info['name'], info['party'])
            if db_pk:
                id_map[cid] = db_pk
            else:
                logger.error(f"Resolution failed for candidate {cid}: {info['name']}")

        # Map candidate_totals to DB IDs
        db_candidate_totals = {id_map[cid]: votes for cid, votes in candidate_totals.items() if cid in id_map}
        db_candidate_totals["NOTA"] = total_nota_votes

        # Pass 2: Ingest Polling Station Records
        logger.info(f"Ingesting {len(stations)} polling stations for {ac_name}...")
        
        batch_items = []
        for ps in stations:
            ps_val = ps.get('ps')
            if ps_val in ['TOTAL_POLLING', 'TOTAL', 'SUMMARY']:
                continue
                
            try:
                ps_no = int(ps_val)
            except (ValueError, TypeError):
                logger.error(f"Invalid polling station number: {ps_val}")
                continue
                
            v_map = ps.get('v', {})
            ps_valid = int(ps.get('valid', 0))
            ps_total = int(ps.get('total', 0))
            ps_nota = int(ps.get('nota', 0))
            ps_rej = int(ps.get('rej', 0))
            
            results = {}
            for cid, votes in v_map.items():
                if cid not in id_map: continue
                db_pk = id_map[cid]
                
                # Calculations
                share = round((votes / ps_valid * 100), 2) if ps_valid > 0 else 0
                contribution = round((votes / candidate_totals[cid] * 100), 2) if candidate_totals.get(cid, 0) > 0 else 0
                
                results[db_pk] = {
                    "votes": votes,
                    "vote_share_percentage": share,
                    "candidate_contribution_percentage": contribution
                }
            
            # Add NOTA to results
            ps_nota = ps.get('nota', 0)
            results["NOTA"] = {
                "votes": ps_nota,
                "vote_share_percentage": round((ps_nota / ps_valid * 100), 2) if ps_valid > 0 else 0
            }

            pk = f"CONSTITUENCY#{const_norm}#YEAR#{year}#PS#{ps_no}"
            item = {
                "PK": pk,
                "SK": "METADATA",
                "constituency_id": const_id,
                "polling_station_no": ps_no,
                "year": year,
                "results": results,
                "valid_votes": ps_valid,
                "rejected_votes": ps_rej,
                "nota_votes": ps_nota,
                "total_votes_polled": ps_total,
                "created_at": int(datetime.now(timezone.utc).timestamp())
            }
            
            item = convert_floats_to_decimal(item)
            if dry_run:
                if ps_no == 1: logger.info(f"Dry Run Sample Item: {json.dumps(item, indent=2, cls=DecimalEncoder)}")
            else:
                self.polling_table.put_item(Item=item)

        # Pass 3: Ingest AC Summary Record
        summary_pk = f"CONSTITUENCY#{const_norm}#YEAR#{year}"
        summary_item = {
            "PK": summary_pk,
            "SK": "AC_SUMMARY",
            "constituency_id": const_id,
            "year": year,
            "candidate_totals": db_candidate_totals,
            "total_valid_votes": total_valid_votes,
            "total_votes_polled": total_votes_polled,
            "total_electors": total_electors,
            "poll_percentage": round((total_votes_polled / total_electors * 100), 2) if total_electors > 0 else 0,
            "created_at": int(datetime.now(timezone.utc).timestamp())
        }
        
        summary_item = convert_floats_to_decimal(summary_item)
        if dry_run:
            logger.info(f"Dry Run AC Summary: {json.dumps(summary_item, indent=2, cls=DecimalEncoder)}")
        else:
            self.polling_table.put_item(Item=summary_item)
            logger.info(f"Successfully ingested data for {ac_name}")

if __name__ == "__main__":
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_mapping = os.path.join(script_dir, "assets", "2026", "tn_2026_candidates.json")

    parser = argparse.ArgumentParser(description="Import polling station level data into DynamoDB.")
    parser.add_argument("file", nargs="?", help="Path to the Form 20 JSON file.")
    parser.add_argument("--mapping", default=default_mapping, help="Path to the candidate mapping JSON.")
    parser.add_argument("--dry-run", action="store_true", help="Perform calculations but do not write to DynamoDB.")
    parser.add_argument("--generate-mapping", action="store_true", help="Generate the mapping file from DynamoDB.")
    parser.add_argument("--year", type=int, default=2026, help="Election year for mapping generation.")
    
    args = parser.parse_args()
    
    importer = PollingDataImporter()
    
    if args.generate_mapping:
        importer.generate_mapping_from_db(year=args.year, output_file=args.mapping)
    else:
        importer.load_mappings(args.mapping)
    
    if args.file:
        importer.process_ac_file(args.file, dry_run=args.dry_run)
    elif not args.generate_mapping:
        parser.print_help()
