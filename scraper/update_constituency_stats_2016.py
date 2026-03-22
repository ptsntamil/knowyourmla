#!/usr/bin/env python3

"""
Update Constituency Statistics (2016)
=====================================

This script updates the `knowyourmla_constituencies` DynamoDB table with 
total electors and voter turnout percentage from the 2016 Assembly Election CSV.

Usage:
    python3 scraper/update_constituency_stats_2016.py [--csv PATH] [--dryrun]
"""

import csv
import os
import sys
import argparse
import logging
from decimal import Decimal
from typing import Dict, Any, Optional

import boto3
from botocore.exceptions import ClientError

# Set up local imports
sys.path.append(os.path.dirname(__file__))
from utils import canonicalize_constituency

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("constituency_stats_updater_2016")

# DynamoDB Configuration
REGION_NAME = "ap-south-2"
CONSTITUENCIES_TABLE_NAME = "knowyourmla_constituencies"

class ConstituencyStatsUpdater:
    """Updates constituency statistics in DynamoDB from CSV data."""

    def __init__(self, table_name: str = CONSTITUENCIES_TABLE_NAME, region: str = REGION_NAME):
        """Initializes the updater with DynamoDB resources.

        Args:
            table_name: The name of the DynamoDB table.
            region: The AWS region.
        """
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.table = self.dynamodb.Table(table_name)
        self.year = "2016"

    def parse_csv(self, csv_path: str) -> Dict[str, Dict[str, Any]]:
        """Parses the CSV and groups data by canonicalized constituency.

        Args:
            csv_path: Path to the 2016 election CSV.

        Returns:
            A dictionary mapping canonical constituency PKs to their stats.
        """
        if not os.path.exists(csv_path):
            logger.error(f"CSV file not found: {csv_path}")
            return {}

        constituency_stats = {}

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_name = row.get('Constituency_Name')
                if not raw_name:
                    continue

                pk = canonicalize_constituency(raw_name)
                if not pk:
                    logger.warning(f"Could not canonicalize constituency: {raw_name}")
                    continue

                # PK should be prefixed for the table if not already
                if not pk.startswith("CONSTITUENCY#"):
                    pk = f"CONSTITUENCY#{pk}"

                # Electors and Turnout_Percentage are repeated per candidate, 
                # so we just need them once per constituency.
                if pk not in constituency_stats:
                    try:
                        electors = int(float(row.get('Electors', 0)))
                        turnout = Decimal(str(row.get('Turnout_Percentage', 0)))
                        
                        constituency_stats[pk] = {
                            "total_electors": electors,
                            "poll_percentage": turnout,
                            "raw_name": raw_name  # Keep for logging
                        }
                    except (ValueError, TypeError) as e:
                        logger.error(f"Error parsing stats for {raw_name}: {e}")

        return constituency_stats

    def update_dynamodb(self, pk: str, stats: Dict[str, Any], dry_run: bool = False) -> bool:
        """Updates a single constituency record in DynamoDB.

        Args:
            pk: The Partition Key of the constituency.
            stats: The statistics to update.
            dry_run: If True, only log the action.

        Returns:
            True if successful, False otherwise.
        """
        if dry_run:
            logger.info(f"[DRY RUN] Would update {pk} ({stats['raw_name']}) with {stats}")
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
                # If the statistics map was JUST created, it might not be visible to a nested if_not_exists in the same transaction-less sequence
                # or if the path is invalid. Consistency in DynamoDB is eventually consistent for reads but atomic for updates.
                # However, if 'statistics' exists but '2016' doesn't, SET #stats.#yr = ... should work.
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

            # Step 3: Update specific fields individually
            self.table.update_item(
                Key={'PK': pk, 'SK': 'METADATA'},
                UpdateExpression="SET #stats.#yr.total_electors = :te, #stats.#yr.poll_percentage = :vp",
                ConditionExpression="attribute_exists(PK)",
                ExpressionAttributeNames={"#stats": "statistics", "#yr": self.year},
                ExpressionAttributeValues={
                    ":te": stats["total_electors"],
                    ":vp": stats["poll_percentage"]
                }
            )
            logger.info(f"Updated {pk} ({stats['raw_name']})")
            return True

        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.warning(f"Constituency {pk} not found in database. Skipping.")
            else:
                logger.error(f"Failed to update {pk}: {e}")
            return False

    def run_update(self, csv_path: str, dry_run: bool = False):
        """Orchestrates the update process.

        Args:
            csv_path: Path to the source CSV.
            dry_run: Whether to perform a dry run.
        """
        logger.info(f"Starting update from {csv_path} (Dry run: {dry_run})")
        stats_map = self.parse_csv(csv_path)
        logger.info(f"Found {len(stats_map)} unique constituencies in CSV.")

        success_count = 0
        for pk, stats in stats_map.items():
            if self.update_dynamodb(pk, stats, dry_run):
                success_count += 1

        logger.info(f"Completed. Updated {success_count} constituencies.")

def main():
    """Main entry point for the script."""
    # Default path relative to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_csv = os.path.join(script_dir, "assets", "OpenCity_TN_Assembly_Election_2016.csv")

    parser = argparse.ArgumentParser(description="Update constituency stats for 2016.")
    parser.add_argument("--csv", default=default_csv,
                        help=f"Path to the source CSV file (default: {default_csv})")
    parser.add_argument("--dryrun", action="store_true", help="Perform a dry run")
    
    args = parser.parse_args()
    
    updater = ConstituencyStatsUpdater()
    updater.run_update(args.csv, dry_run=args.dryrun)

if __name__ == "__main__":
    main()
