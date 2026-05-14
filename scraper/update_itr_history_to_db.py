#!/usr/bin/env python3

"""
Update itr_history and income_itr in DynamoDB from tn_2026_candidates.json.

Flattening Logic:
- itr_history.dependents: Collapses a list of objects into a single map (year -> sum_of_incomes).
- income_itr: Extracts the most recent 'self' income as a Number.
"""

import argparse
import json
import logging
import os
import sys
from decimal import Decimal
from typing import Any, Dict, List, Tuple
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

# Add project root to path
sys_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if sys_path not in sys.path:
    sys.path.append(sys_path)

from scraper.utils import convert_floats_to_decimal, clean_currency_to_int

# Constants
CANDIDATES_TABLE = "knowyourmla_candidates"
REGION_NAME = "ap-south-2"

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("update_itr_to_db")

def flatten_itr_history(itr_history: Any) -> Dict[str, Any]:
    """
    Flatten itr_history structure for DynamoDB.
    - self, spouse, huf: preserved as maps.
    - dependents: list of objects -> individual keys (dependent1, dependent2...).
    """
    if not isinstance(itr_history, dict):
        return {}

    flattened = {}
    
    # Process standard keys
    for key in ["self", "spouse", "huf"]:
        if key in itr_history and isinstance(itr_history[key], dict):
            # Clean values in history
            cleaned_hist = {y: clean_currency_to_int(str(a)) for y, a in itr_history[key].items()}
            flattened[key] = cleaned_hist
        else:
            flattened[key] = {}

    # Process dependents into individual keys
    dependents_data = itr_history.get("dependents", [])
    
    if isinstance(dependents_data, list):
        for i, dep in enumerate(dependents_data):
            if not isinstance(dep, dict):
                continue
            income_details = dep.get("income_tax_details")
            if not isinstance(income_details, dict):
                continue
            
            key = f"dependent{i+1}"
            cleaned_hist = {y: clean_currency_to_int(str(a)) for y, a in income_details.items()}
            flattened[key] = cleaned_hist
    elif isinstance(dependents_data, dict):
        # Handle case where it might already be partially flattened or in different format
        for k, v in dependents_data.items():
            if isinstance(v, dict):
                 flattened[f"dependent_{k}" if not k.startswith("dependent") else k] = {y: clean_currency_to_int(str(a)) for y, a in v.items()}

    return flattened

def get_latest_income_map(flattened_itr: Dict[str, Any]) -> Dict[str, int]:
    """Extract the latest available income for EACH member in the flattened history."""
    income_map = {}
    
    for member, history in flattened_itr.items():
        if not history:
            income_map[member] = 0
            continue
            
        # Sort years to find the latest
        years = sorted(history.keys(), reverse=True)
        if not years:
            income_map[member] = 0
            continue
            
        latest_year = years[0]
        income_map[member] = history[latest_year]
        
    return income_map

def update_candidate_details(table, pk: str, itr_history: Dict[str, Any], income_map: Dict[str, int], dry_run: bool = False) -> bool:
    """Update itr_history and income_itr (map) for a candidate in DynamoDB."""
    try:
        if dry_run:
            logger.info(f"[DRY RUN] Would update {pk}: income_itr={income_map}")
            return True

        # Convert to Decimal for DynamoDB
        safe_itr = convert_floats_to_decimal(itr_history)
        safe_income = convert_floats_to_decimal(income_map)

        table.update_item(
            Key={"PK": pk, "SK": "DETAILS"},
            UpdateExpression="SET itr_history = :itr, income_itr = :inc",
            ExpressionAttributeValues={
                ":itr": safe_itr,
                ":inc": safe_income
            },
            ConditionExpression="attribute_exists(PK)"
        )
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.error(f"Candidate {pk} not found in database.")
        else:
            logger.error(f"Error updating {pk}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error for {pk}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Update ITR data in DynamoDB from JSON.")
    parser.add_argument("--file", default="tn_2026_candidates.json", help="Path to JSON file")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without updating DB")
    parser.add_argument("--limit", type=int, help="Limit number of processed records")
    parser.add_argument("--start", type=int, default=0, help="Start index")
    parser.add_argument("--only-pk", help="Process only a specific db_candidate_pk")
    
    args = parser.parse_args()

    if not os.path.exists(args.file):
        logger.error(f"File not found: {args.file}")
        return

    with open(args.file, "r") as f:
        candidates = json.load(f)

    dynamodb = boto3.resource("dynamodb", region_name=REGION_NAME)
    table = dynamodb.Table(CANDIDATES_TABLE)

    total = len(candidates)
    processed = 0
    updated = 0
    errors = 0

    end = total if args.limit is None else min(args.start + args.limit, total)

    for i in range(args.start, end):
        cand = candidates[i]
        pk = cand.get("db_candidate_pk")
        
        if not pk:
            continue
            
        if args.only_pk and pk != args.only_pk:
            continue

        extracted = cand.get("extracted_data", {})
        raw_itr = extracted.get("itr_history")
        
        if raw_itr is None:
            continue

        # 1. Flatten
        flattened_itr = flatten_itr_history(raw_itr)
        
        # 2. Get latest income map
        income_map = get_latest_income_map(flattened_itr)

        # 3. Update DB
        if update_candidate_details(table, pk, flattened_itr, income_map, dry_run=args.dry_run):
            updated += 1
        else:
            errors += 1
            
        processed += 1
        
        if processed % 100 == 0:
            logger.info(f"Processed {processed} records...")

    logger.info(f"Summary: Processed={processed}, Updated={updated}, Errors={errors}")

if __name__ == "__main__":
    main()
