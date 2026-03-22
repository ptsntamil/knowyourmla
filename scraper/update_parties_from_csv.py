#!/usr/bin/env python3

import csv
import os
import sys
import boto3
import logging
import argparse
from datetime import datetime, timezone
from botocore.exceptions import ClientError

# Add the current directory to sys.path to import utils
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scraper.utils import normalize_name

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# DynamoDB Configuration
TABLE_NAME = "knowyourmla_political_parties"
REGION_NAME = "ap-south-2"
CSV_PATH = os.path.join(os.path.dirname(__file__), "assets", "Political Parties - Sheet2.csv")

def normalize_state(state: str) -> str:
    """Normalize state name to STATE#slug format."""
    if not state:
        return ""
    slug = state.strip().lower().replace(" ", "")
    return f"STATE#{slug}"

def extract_pincode(address: str) -> str:
    """Extract 6-digit pincode from address."""
    import re
    if not address:
        return ""
    match = re.search(r'(\d{6})', address.strip())
    if match:
        return match.group(1)
    return ""

def update_parties(dry_run=True):
    if not os.path.exists(CSV_PATH):
        logger.error(f"CSV file not found at {CSV_PATH}")
        return

    dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
    table = dynamodb.Table(TABLE_NAME)
    now_ts = int(datetime.now(tz=timezone.utc).timestamp())

    updates_count = 0
    inserts_count = 0
    errors_count = 0

    with open(CSV_PATH, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            party_name = row.get('Party Name', '').strip()
            symbol = row.get('Symbol', '').strip() or row.get('Flag', '').strip()
            address = row.get('Address', '').strip()
            short_name = row.get('sort', '').strip()

            if not party_name:
                continue

            # Conditional logic for Tamil Nadu
            state_registered = ""
            party_type = "Unrecognized" # Default type
            
            if "tamil nadu" in address.lower() or "tamilnadu" in address.lower():
                state_registered = normalize_state("Tamil Nadu")
                party_type = "State Registered"

            normalized = normalize_name(party_name)
            pk = f"PARTY#{normalized}"
            sk = "METADATA"

            logger.info(f"Processing: {party_name} ({pk})")

            try:
                # Check if party exists
                response = table.get_item(Key={'PK': pk, 'SK': sk})
                item_exists = 'Item' in response

                if item_exists:
                    existing_item = response['Item']
                    # Prepare update
                    update_expr = "SET symbol = :s, full_address = :a, short_name = :sn, pincode = :p, updated_at = :u, #t = :t, state_registered = :sr"
                    expr_values = {
                        ':s': symbol,
                        ':a': address,
                        ':sn': short_name,
                        ':p': extract_pincode(address),
                        ':u': now_ts,
                        ':t': party_type,
                        ':sr': state_registered
                    }
                    expr_names = {
                        '#t': 'type' # 'type' is a reserved keyword in DynamoDB
                    }
                    
                    if dry_run:
                        logger.info(f"  [DRY RUN] Would update {party_name}")
                        logger.info(f"    Symbol: {existing_item.get('symbol')} -> {symbol}")
                        logger.info(f"    Short Name: {existing_item.get('short_name')} -> {short_name}")
                        logger.info(f"    Type: {existing_item.get('type')} -> {party_type}")
                        logger.info(f"    State Registered: {existing_item.get('state_registered')} -> {state_registered}")
                    else:
                        # table.update_item(
                        #     Key={'PK': pk, 'SK': sk},
                        #     UpdateExpression=update_expr,
                        #     ExpressionAttributeValues=expr_values,
                        #     ExpressionAttributeNames=expr_names
                        # )
                        logger.info(f"  Updated {party_name}")
                    updates_count += 1
                else:
                    # Create new entry
                    new_item = {
                        "PK": pk,
                        "SK": sk,
                        "name": party_name,
                        "normalized_name": normalized,
                        "short_name": short_name,
                        "symbol": symbol,
                        "full_address": address,
                        "pincode": extract_pincode(address),
                        "type": party_type,
                        "state_registered": state_registered,
                        "created_at": now_ts,
                        "updated_at": now_ts
                    }
                    
                    if dry_run:
                        logger.info(f"  [DRY RUN] Would insert new party: {party_name}")
                        logger.info(f"    Data: {new_item}")
                    else:
                        table.put_item(Item=new_item)
                        logger.info(f"  Inserted {party_name}")
                    inserts_count += 1

            except ClientError as e:
                logger.error(f"  DynamoDB Error for {party_name}: {e.response['Error']['Message']}")
                errors_count += 1
            except Exception as e:
                logger.error(f"  Error processing {party_name}: {e}")
                errors_count += 1

    mode = "DRY RUN" if dry_run else "EXECUTION"
    logger.info(f"--- {mode} Summary ---")
    logger.info(f"Total Updates: {updates_count}")
    logger.info(f"Total Inserts: {inserts_count}")
    logger.info(f"Total Errors: {errors_count}")

def main():
    parser = argparse.ArgumentParser(description="Update political parties from CSV to DynamoDB.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dryrun", action="store_true", help="Perform a dry run without making changes.")
    group.add_argument("--execute", action="store_true", help="Apply changes to DynamoDB.")
    
    args = parser.parse_args()
    
    update_parties(dry_run=args.dryrun)

if __name__ == "__main__":
    main()
