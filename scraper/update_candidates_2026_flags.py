#!/usr/bin/env python3

"""
Update Candidate Flags for 2026 Elections
==========================================

This script updates two specific flags for 2026 candidates in DynamoDB (and optionally JSON):
1. 'new_comer': True if the candidate has exactly one candidate entry in the entire DB (the 2026 one).
2. 'is_incumbent': True if the candidate was a winner in any election between 2021 and 2025.

Usage:
    python3 update_candidates_2026_flags.py [--dry-run] [--json-file path/to/json]
"""

import json
import os
import sys
import argparse
import logging
from typing import List, Dict, Any, Optional
import boto3
from boto3.dynamodb.conditions import Key, Attr

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger("update_2026_flags")

# Constants
CANDIDATES_TABLE = "knowyourmla_candidates"
REGION_NAME = "ap-south-2"

def get_dynamodb_resource():
    return boto3.resource('dynamodb', region_name=REGION_NAME)

def update_flags_in_db(dry_run: bool = True):
    """Scan 2026 candidates and update flags in DynamoDB."""
    dynamodb = get_dynamodb_resource()
    table = dynamodb.Table(CANDIDATES_TABLE)
    
    logger.info(f"Scanning {CANDIDATES_TABLE} for 2026 candidates...")
    
    candidates_to_update = []
    
    try:
        # Scan for 2026 candidates
        # Note: Scans can be expensive, but for a one-off update on a managed table it's usually fine.
        response = table.scan(
            FilterExpression=Attr('year').eq(2026)
        )
        candidates_to_update.extend(response.get('Items', []))
        
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression=Attr('year').eq(2026),
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            candidates_to_update.extend(response.get('Items', []))
            
        logger.info(f"Found {len(candidates_to_update)} candidates from 2026.")
        
        stats = {"updated": 0, "skipped": 0, "errors": 0}
        
        for cand in candidates_to_update:
            pk = cand.get('PK')
            person_id = cand.get('person_id')
            
            if not person_id:
                logger.warning(f"Candidate {pk} has no person_id. Skipping.")
                stats["skipped"] += 1
                continue
                
            # Query all candidates for this person
            try:
                person_records_resp = table.query(
                    IndexName='PersonIndex',
                    KeyConditionExpression=Key('person_id').eq(person_id)
                )
                user_records = person_records_resp.get('Items', [])
                
                # Logic:
                # new_comer: Exactly one record (the current one)
                new_comer = (len(user_records) == 1)
                
                # is_incumbent: Winner in 2021-2025
                is_incumbent = any(
                    r.get('year', 0) >= 2021 and 
                    r.get('year', 0) < 2026 and 
                    r.get('is_winner') is True 
                    for r in user_records
                )
                
                # Check if current flags match to avoid unnecessary writes
                curr_new_comer = cand.get('new_comer')
                curr_is_incumbent = cand.get('is_incumbent')
                
                if curr_new_comer == new_comer and curr_is_incumbent == is_incumbent:
                    logger.debug(f"Candidate {pk} flags already correct. Skipping.")
                    stats["skipped"] += 1
                    continue
                
                logger.info(f"Updating {pk} ({cand.get('candidate_name', 'Unknown')}): new_comer={new_comer}, is_incumbent={is_incumbent}")
                
                if not dry_run:
                    table.update_item(
                        Key={'PK': pk, 'SK': 'DETAILS'},
                        UpdateExpression="SET new_comer = :nc, is_incumbent = :inc",
                        ExpressionAttributeValues={
                            ':nc': new_comer,
                            ':inc': is_incumbent
                        }
                    )
                
                stats["updated"] += 1
                
            except Exception as e:
                logger.error(f"Error processing records for person {person_id}: {e}")
                stats["errors"] += 1
                
        logger.info(f"DB Update complete. Stats: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Failed to scan candidates: {e}")
        return None

def update_flags_in_json(json_path: str, stats_db: Dict[str, Any]):
    """Sync the flags to the local JSON file if it exists."""
    if not os.path.exists(json_path):
        logger.warning(f"JSON file {json_path} not found. Skipping sync.")
        return

    logger.info(f"Syncing flags to {json_path}...")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # We need a lookup for candidates in DB to update JSON
    # Since we already scanned them in update_flags_in_db, we could pass them,
    # but let's just do a fresh lookup for simplicity or re-scan if needed.
    # Actually, let's fetch them from DB again or use the person_id logic.
    
    dynamodb = get_dynamodb_resource()
    table = dynamodb.Table(CANDIDATES_TABLE)
    
    updated_json_count = 0
    for item in data:
        person_id = item.get('db_person_id') or item.get('person_id')
        if not person_id:
            continue
            
        try:
            # For each candidate in JSON, get their full history from DB to determine flags
            person_records_resp = table.query(
                IndexName='PersonIndex',
                KeyConditionExpression=Key('person_id').eq(person_id)
            )
            user_records = person_records_resp.get('Items', [])
            
            new_comer = (len(user_records) == 1)
            is_incumbent = any(
                r.get('year', 0) >= 2021 and 
                r.get('year', 0) < 2026 and 
                r.get('is_winner') is True 
                for r in user_records
            )
            
            item['new_comer'] = new_comer
            item['is_incumbent'] = is_incumbent
            updated_json_count += 1
        except Exception as e:
            logger.error(f"Error syncing JSON for person {person_id}: {e}")

    # Save JSON
    temp_path = f"{json_path}.tmp"
    with open(temp_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    os.replace(temp_path, json_path)
    
    logger.info(f"JSON Sync complete. Updated {updated_json_count} items.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Update target flags for 2026 candidates.")
    parser.add_argument("--dry-run", action="store_true", help="Log changes without updating DynamoDB.")
    parser.add_argument("--json-file", type=str, default="tn_2026_candidates.json", help="Path to JSON file to sync.")
    parser.add_argument("--skip-json", action="store_true", help="Skip updating the JSON file.")
    
    args = parser.parse_args()
    
    if args.dry_run:
        logger.info("DRY RUN MODE: No changes will be written to DynamoDB.")
    
    db_stats = update_flags_in_db(dry_run=args.dry_run)
    
    if not args.skip_json and db_stats and not args.dry_run:
        # Resolve json path relative to script
        json_path = args.json_file
        if not os.path.isabs(json_path):
            json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), json_path)
        update_flags_in_json(json_path, db_stats)
