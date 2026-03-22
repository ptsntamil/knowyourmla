#!/usr/bin/env python3

"""
Update Constituency Statistics (2026)
=====================================

This script scrapes electoral statistics (Male, Female, Third Gender, Total) 
for all Tamil Nadu assembly constituencies from the official election website 
and updates the `knowyourmla_constituencies` DynamoDB table.

URL: https://elections.tn.gov.in/ACwise_Gendercount_23022026.aspx

Usage:
    python3 scraper/update_constituency_stats_2026.py [--dryrun]
"""

import os
import sys
import argparse
import logging
from typing import Dict, Any, List, Optional

import httpx
from bs4 import BeautifulSoup
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
SOURCE_URL = "https://elections.tn.gov.in/ACwise_Gendercount_23022026.aspx"

class ConstituencyStatsUpdater2026:
    """Scrapes 2026 electoral statistics and updates DynamoDB."""

    def __init__(self, table_name: str = CONSTITUENCIES_TABLE_NAME, region: str = REGION_NAME):
        """Initializes the updater with DynamoDB resources.

        Args:
            table_name: The name of the DynamoDB table.
            region: The AWS region.
        """
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.table = self.dynamodb.Table(table_name)
        self.year = "2026"

    def fetch_data(self) -> List[Dict[str, Any]]:
        """Fetches and parses electoral data from the official website.

        Returns:
            A list of dictionaries containing constituency stats.
        """
        logger.info(f"Fetching data from {SOURCE_URL}")
        try:
            response = httpx.get(SOURCE_URL, verify=False, timeout=30.0) # verify=False because government sites often have SSL issues
            response.raise_for_status()
        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch data: {e}")
            return []

        soup = BeautifulSoup(response.text, 'lxml')
        table = soup.find('table') # Usually the main data table
        if not table:
            logger.error("Could not find data table in HTML content")
            return []

        stats_list = []
        rows = table.find_all('tr')
        
        # Identify headers to be sure about column indices
        # Based on exploration:
        # District No, District Name, AC No., Name of Assembly Constituency, Male, Female, Third Gender, Total
        
        for row in rows[1:]: # Skip header row
            cols = row.find_all('td')
            
            # Handle rowspans: First row of a district has 8 columns, others have 6
            if len(cols) == 8:
                ac_no = cols[2].text.strip()
                raw_name = cols[3].text.strip()
                male_text = cols[4].text.strip()
                female_text = cols[5].text.strip()
                third_gender_text = cols[6].text.strip()
                total_text = cols[7].text.strip()
            elif len(cols) == 6:
                ac_no = cols[0].text.strip()
                raw_name = cols[1].text.strip()
                male_text = cols[2].text.strip()
                female_text = cols[3].text.strip()
                third_gender_text = cols[4].text.strip()
                total_text = cols[5].text.strip()
            else:
                continue
            
            try:
                male = clean_currency_to_int(male_text)
                female = clean_currency_to_int(female_text)
                third_gender = clean_currency_to_int(third_gender_text)
                total = clean_currency_to_int(total_text)
                
                if not raw_name or raw_name.lower() == "total":
                    continue

                stats_list.append({
                    "ac_no": ac_no,
                    "raw_name": raw_name,
                    "male": male,
                    "female": female,
                    "third_gender": third_gender,
                    "total_electors": total
                })
            except (ValueError, IndexError) as e:
                logger.warning(f"Error parsing row: {e}")
                continue

        logger.info(f"Successfully scraped {len(stats_list)} constituencies")
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
            update_data = {
                "total_electors": stats["total_electors"],
                "male": stats["male"],
                "female": stats["female"],
                "third_gender": stats["third_gender"]
            }

            self.table.update_item(
                Key={'PK': pk, 'SK': 'METADATA'},
                UpdateExpression="SET #stats.#yr = :stats_data",
                ConditionExpression="attribute_exists(PK)",
                ExpressionAttributeNames={"#stats": "statistics", "#yr": self.year},
                ExpressionAttributeValues={":stats_data": update_data}
            )
            logger.debug(f"Updated {pk} ({raw_name})")
            return True

        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.warning(f"Constituency {pk} ({raw_name}) not found in database. Skipping.")
            else:
                logger.error(f"Failed to update {pk}: {e}")
            return False

    def run(self, dry_run: bool = False):
        """Orchestrates the scraping and update process.

        Args:
            dry_run: Whether to perform a dry run.
        """
        logger.info(f"Starting 2026 stats update (Dry run: {dry_run})")
        scraped_data = self.fetch_data()
        
        if not scraped_data:
            logger.error("No data scraped. Aborting.")
            return

        success_count = 0
        for entry in scraped_data:
            if self.update_dynamodb(entry, dry_run):
                success_count += 1

        logger.info(f"Completed. Successfully processed {success_count}/{len(scraped_data)} constituencies.")

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description="Scrape and update constituency stats for 2026.")
    parser.add_argument("--dryrun", action="store_true", help="Perform a dry run")
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    updater = ConstituencyStatsUpdater2026()
    updater.run(dry_run=args.dryrun)

if __name__ == "__main__":
    main()
