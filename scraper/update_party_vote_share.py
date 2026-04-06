#!/usr/bin/env python3
"""
Script to update political parties with vote share data from party_vote_share.json.
Matches parties by name or short name and adds a `vote_share` field to DynamoDB.
"""

import json
import os
import sys
import logging
import argparse
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timezone
from decimal import Decimal

# Add the parent directory to sys.path to import utils
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scraper.utils import normalize_name

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
TABLE_NAME = "knowyourmla_political_parties"
REGION_NAME = "ap-south-2"
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
VOTE_SHARE_FILE = os.path.join(ASSETS_DIR, "party_vote_share.json")

def load_vote_share_data(file_path):
    """Load vote share data from JSON file."""
    if not os.path.exists(file_path):
        logger.error(f"Vote share file not found: {file_path}")
        return []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def update_party_vote_share(party_data, dry_run=False):
    """Update party in DynamoDB with vote share data."""
    dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
    table = dynamodb.Table(TABLE_NAME)
    
    party_name = party_data.get('party_name')
    short_name = party_data.get('short_name', '').lower()
    assembly_stats = party_data.get('assembly', {})
    
    if not party_name:
        logger.warning("Found party entry without party_name. Skipping.")
        return False

    normalized = normalize_name(party_name)
    pk = f"PARTY#{normalized}"
    sk = "METADATA"

    # Convert floats to Decimals for DynamoDB
    def float_to_decimal(obj):
        if isinstance(obj, float):
            return Decimal(str(obj))
        if isinstance(obj, dict):
            return {k: float_to_decimal(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [float_to_decimal(v) for v in obj]
        return obj

    vote_share = {
        "assembly": float_to_decimal(assembly_stats)
    }

    # Attempt to find the party in DynamoDB
    logger.info(f"Processing party: {party_name} ({short_name or 'No short name'})")
    
    try:
        response = table.get_item(Key={'PK': pk, 'SK': sk})
        item = response.get('Item')
        
        if not item and short_name:
            # Try finding by short name if direct name match fails
            # We skip this for now because the PK is derived from the full name
            # In our system, the PK should match normalized_name of the full party name.
            # If it's missing, maybe it's stored under a different name.
            logger.info(f"  Party '{party_name}' not found by PK {pk}. Scanning for short_name '{short_name}'...")
            
            # This is slow but safer for a one-time update
            lookup_response = table.scan(
                FilterExpression="short_name = :s OR normalized_name = :n",
                ExpressionAttributeValues={":s": short_name.upper(), ":n": normalized}
            )
            items = lookup_response.get('Items', [])
            if items:
                item = items[0]
                pk = item['PK']
                logger.info(f"  Found party by short_name/normalized scan: {item.get('name')} (PK: {pk})")
            else:
                logger.warning(f"  Party '{party_name}' not found in database. Skipping.")
                return False

        if not item:
            logger.warning(f"  Party '{party_name}' not found in database. Skipping.")
            return False

        if dry_run:
            logger.info(f"  [DRY RUN] Would update {pk} with vote_share: {json.dumps(vote_share)}")
            return True

        # Update the item
        now_ts = int(datetime.now(tz=timezone.utc).timestamp())
        table.update_item(
            Key={'PK': pk, 'SK': sk},
            UpdateExpression="SET vote_share = :v, updated_at = :u",
            ExpressionAttributeValues={
                ':v': vote_share,
                ':u': now_ts
            }
        )
        logger.info(f"  Successfully updated {pk} with vote share data.")
        return True

    except ClientError as e:
        logger.error(f"  DynamoDB Error for {party_name}: {e.response['Error']['Message']}")
        return False
    except Exception as e:
        logger.error(f"  Unexpected error for {party_name}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Update political parties with vote share data.")
    parser.add_argument("--dry-run", action="store_true", help="Print updates without modifying DynamoDB.")
    parser.add_argument("--limit", type=int, help="Limit the number of parties to process.")
    args = parser.parse_args()

    logger.info("Starting party vote share update...")
    if args.dry_run:
        logger.info("DRY RUN ENABLED - No changes will be made to DynamoDB.")

    data = load_vote_share_data(VOTE_SHARE_FILE)
    if not data:
        logger.error("No data to process. Exiting.")
        return

    logger.info(f"Loaded {len(data)} party entries from JSON.")
    
    success_count = 0
    fail_count = 0
    
    for i, party_entry in enumerate(data):
        if args.limit and i >= args.limit:
            break
            
        if update_party_vote_share(party_entry, dry_run=args.dry_run):
            success_count += 1
        else:
            fail_count += 1
            
    logger.info("Update complete.")
    logger.info(f"Processed: {i + 1 if args.limit and i < len(data) else len(data)}")
    logger.info(f"Successfully updated: {success_count}")
    logger.info(f"Failed/Skipped: {fail_count}")

if __name__ == "__main__":
    main()
