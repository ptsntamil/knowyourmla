#!/usr/bin/env python3

"""
Update Constituency Statistics (2026)
=====================================

This script updates the `knowyourmla_constituencies` DynamoDB table with 
votes polled, poll percentage, and poll breakup (Male, Female, Others) 
from the 2026 election CSV.

Source: scraper/assets/Tamilnadu_2026_votes_polled.csv

Usage:
    python3 scraper/update_constituency_stats_2026.py [--csv PATH] [--dryrun]
"""

import csv
import os
import sys
import argparse
import logging
from decimal import Decimal
from typing import Dict, Any, List, Optional

import boto3
from botocore.exceptions import ClientError

# Set up local imports
sys.path.append(os.path.dirname(__file__))
from utils import canonicalize_constituency, clean_currency_to_int

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("constituency_stats_updater_2026")

# DynamoDB Configuration
REGION_NAME = "ap-south-2"
CONSTITUENCIES_TABLE_NAME = "knowyourmla_constituencies"

class ConstituencyStatsUpdater2026:
    """Updates 2026 constituency statistics in DynamoDB from CSV data."""

    def __init__(self, table_name: str = CONSTITUENCIES_TABLE_NAME, region: str = REGION_NAME):
        """Initializes the updater with DynamoDB resources.

        Args:
            table_name: The name of the DynamoDB table.
            region: The AWS region.
        """
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.table = self.dynamodb.Table(table_name)
        self.year = "2026"

    def parse_csv(self, csv_path: str) -> List[Dict[str, Any]]:
        """Parses the CSV and returns a list of constituency stats.

        Args:
            csv_path: Path to the 2026 votes polled CSV.

        Returns:
            A list of dictionaries containing constituency stats.
        """
        if not os.path.exists(csv_path):
            logger.error(f"CSV file not found: {csv_path}")
            return []

        stats_list = []

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_name = row.get('AC_Name')
                if not raw_name:
                    continue

                try:
                    male = clean_currency_to_int(row.get('Male', '0'))
                    female = clean_currency_to_int(row.get('Female', '0'))
                    others = clean_currency_to_int(row.get('Other', '0'))
                    total = clean_currency_to_int(row.get('Total', '0'))
                    percent = Decimal(str(row.get('Percent', '0')))

                    stats_list.append({
                        "raw_name": raw_name,
                        "total_votes_polled": total,
                        "poll_percentage": percent,
                        "poll_breakup": {
                            "male": male,
                            "female": female,
                            "others": others
                        }
                    })
                except (ValueError, TypeError) as e:
                    logger.error(f"Error parsing stats for {raw_name}: {e}")

        logger.info(f"Successfully parsed {len(stats_list)} constituencies from CSV")
        return stats_list

    def update_dynamodb(self, stats: Dict[str, Any], dry_run: bool = False) -> bool:
        """Updates a single constituency record in DynamoDB.

        Args:
            stats: The statistics to update.
            dry_run: If True, only log the action.

        Returns:
            True if successful, False otherwise.
        """
        raw_name = stats["raw_name"]
        pk = canonicalize_constituency(raw_name)
        
        if not pk:
            logger.warning(f"Could not canonicalize constituency: {raw_name}")
            return False

        if not pk.startswith("CONSTITUENCY#"):
            pk = f"CONSTITUENCY#{pk}"

        if dry_run:
            logger.info(f"[DRY RUN] Would update {pk} ({raw_name}) with {stats}")
            return True

        try:
            # Step 1: Ensure the 'statistics' map exists
            self.table.update_item(
                Key={'PK': pk, 'SK': 'METADATA'},
                UpdateExpression="SET #stats = if_not_exists(#stats, :empty_map)",
                ConditionExpression="attribute_exists(PK)",
                ExpressionAttributeNames={"#stats": "statistics"},
                ExpressionAttributeValues={":empty_map": {}}
            )

            # Step 2: Ensure the specific year map exists within statistics
            try:
                self.table.update_item(
                    Key={'PK': pk, 'SK': 'METADATA'},
                    UpdateExpression="SET #stats.#yr = if_not_exists(#stats.#yr, :empty_map)",
                    ConditionExpression="attribute_exists(PK)",
                    ExpressionAttributeNames={"#stats": "statistics", "#yr": self.year},
                    ExpressionAttributeValues={":empty_map": {}}
                )
            except ClientError as e:
                if e.response['Error']['Code'] == 'ValidationException':
                     self.table.update_item(
                        Key={'PK': pk, 'SK': 'METADATA'},
                        UpdateExpression="SET #stats.#yr = :empty_map",
                        ConditionExpression="attribute_exists(PK) AND attribute_not_exists(#stats.#yr)",
                        ExpressionAttributeNames={"#stats": "statistics", "#yr": self.year},
                        ExpressionAttributeValues={":empty_map": {}}
                    )
                else:
                    raise

            # Step 3: Update specific fields
            self.table.update_item(
                Key={'PK': pk, 'SK': 'METADATA'},
                UpdateExpression="SET #stats.#yr.total_votes_polled = :vp, #stats.#yr.poll_percentage = :pp, #stats.#yr.poll_breakup = :pb",
                ConditionExpression="attribute_exists(PK)",
                ExpressionAttributeNames={"#stats": "statistics", "#yr": self.year},
                ExpressionAttributeValues={
                    ":vp": stats["total_votes_polled"],
                    ":pp": stats["poll_percentage"],
                    ":pb": stats["poll_breakup"]
                }
            )
            logger.debug(f"Updated {pk} ({raw_name})")
            return True

        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.warning(f"Constituency {pk} ({raw_name}) not found in database. Skipping.")
            else:
                logger.error(f"Failed to update {pk}: {e}")
            return False

    def run(self, csv_path: str, dry_run: bool = False):
        """Orchestrates the update process.

        Args:
            csv_path: Path to the source CSV.
            dry_run: Whether to perform a dry run.
        """
        logger.info(f"Starting 2026 stats update from {csv_path} (Dry run: {dry_run})")
        parsed_data = self.parse_csv(csv_path)
        
        if not parsed_data:
            logger.error("No data parsed. Aborting.")
            return

        success_count = 0
        for entry in parsed_data:
            if self.update_dynamodb(entry, dry_run):
                success_count += 1

        logger.info(f"Completed. Successfully processed {success_count}/{len(parsed_data)} constituencies.")

def main():
    """Main entry point for the script."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_csv = os.path.join(script_dir, "assets", "Tamilnadu_2026_votes_polled.csv")

    parser = argparse.ArgumentParser(description="Update constituency stats for 2026 from CSV.")
    parser.add_argument("--csv", default=default_csv, help=f"Path to the source CSV (default: {default_csv})")
    parser.add_argument("--dryrun", action="store_true", help="Perform a dry run")
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    updater = ConstituencyStatsUpdater2026()
    updater.run(csv_path=args.csv, dry_run=args.dryrun)

if __name__ == "__main__":
    main()
