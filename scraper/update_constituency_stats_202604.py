#!/usr/bin/env python3

"""
Update Constituency Statistics (April 2026)
===========================================

This script scrapes electoral statistics (Male, Female, Third Gender, Total) 
for all Tamil Nadu assembly constituencies from the official election website 
as on 07/04/2026 and updates the `knowyourmla_constituencies` DynamoDB table.

Data Source: https://www.elections.tn.gov.in/ACwise_Gendercount_07042026.aspx
Entry Key: 202604

Usage:
    python3 scraper/update_constituency_stats_202604.py [--dryrun]
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
logger = logging.getLogger("constituency_stats_updater_202604")

# DynamoDB Configuration
REGION_NAME = "ap-south-2"
CONSTITUENCIES_TABLE_NAME = "knowyourmla_constituencies"
SOURCE_URL = "https://www.elections.tn.gov.in/ACwise_Gendercount_07042026.aspx"

class ConstituencyStatsUpdater202604:
    """Scrapes April 2026 electoral statistics and updates DynamoDB.
    
    This class handles the fetching, parsing, and database insertion of 
    constituency-wise gender-based elector counts.
    """

    def __init__(self, table_name: str = CONSTITUENCIES_TABLE_NAME, region: str = REGION_NAME):
        """Initializes the updater with DynamoDB resources.

        Args:
            table_name (str): The name of the DynamoDB table.
            region (str): The AWS region.
        """
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.table = self.dynamodb.Table(table_name)
        self.year_key = "202604"

    def fetch_data(self) -> List[Dict[str, Any]]:
        """Fetches and parses electoral data from the official website.

        Returns:
            List[Dict[str, Any]]: A list of dictionaries containing constituency stats.
        """
        logger.info(f"Fetching data from {SOURCE_URL}")
        try:
            # verify=False because government sites often have SSL issues
            # Using a browser-like User-Agent to avoid potential blocks
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = httpx.get(SOURCE_URL, verify=False, timeout=60.0, headers=headers)
            response.raise_for_status()
        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch data: {e}")
            return []

        soup = BeautifulSoup(response.text, 'lxml')
        table = soup.find('table')
        if not table:
            logger.error("Could not find data table in HTML content")
            return []

        stats_list = []
        rows = table.find_all('tr')
        
        # Grid columns based on structure:
        # 0: Sl No.
        # 1: District No
        # 2: Name of District
        # 3: AC No.
        # 4: Name of Assembly Constituency
        # 5: Male
        # 6: Female
        # 7: Third Gender
        # 8: Total

        for row in rows:
            cols = row.find_all(['td', 'th'])
            if not cols:
                continue
            
            # Skip header rows - usually contain "Sl No" or similar
            if "Sl No" in cols[0].text or "Male" in row.text:
                continue
                
            # Handle row structure (district name row has more columns if it uses rowspans, 
            # but BeautifulSoup find_all handles them as flat cells per row usually)
            # If the site uses rowspans, standard rows will have fewer columns.
            
            text_values = [c.text.strip() for c in cols]
            
            # Based on the structure observed in the browser:
            # A standard constituency row usually has 9 columns.
            # If a row has fewer (e.g. 7 or 8), it might be missing district info due to rowspan.
            
            if len(text_values) >= 9:
                # Full row
                ac_no = text_values[3]
                raw_name = text_values[4]
                male_text = text_values[5]
                female_text = text_values[6]
                third_gender_text = text_values[7]
                total_text = text_values[8]
            elif len(text_values) >= 6:
                # Likely a row within a district (rowspan missing first few columns)
                # Usually: [AC No., Name, Male, Female, Third, Total]
                ac_no = text_values[0]
                raw_name = text_values[1]
                male_text = text_values[2]
                female_text = text_values[3]
                third_gender_text = text_values[4]
                total_text = text_values[5]
            else:
                continue

            # Basic Validation
            if not ac_no.isdigit() and "total" not in raw_name.lower():
                # Might be a header or sub-header
                continue

            if "total" in raw_name.lower() or not raw_name:
                continue

            try:
                male = clean_currency_to_int(male_text)
                female = clean_currency_to_int(female_text)
                third_gender = clean_currency_to_int(third_gender_text)
                total = clean_currency_to_int(total_text)

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
            stats (Dict[str, Any]): The statistics to update.
            dry_run (bool): If True, only log the action.

        Returns:
            bool: True if successful, False otherwise.
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

            # Step 2: Ensure the specific entry map exists within statistics
            try:
                self.table.update_item(
                    Key={'PK': pk, 'SK': 'METADATA'},
                    UpdateExpression="SET #stats.#yr = if_not_exists(#stats.#yr, :empty_map)",
                    ConditionExpression="attribute_exists(PK)",
                    ExpressionAttributeNames={"#stats": "statistics", "#yr": self.year_key},
                    ExpressionAttributeValues={":empty_map": {}}
                )
            except ClientError as e:
                if e.response['Error']['Code'] == 'ValidationException':
                    # Fallback for older AWS SDKs or specific path issues
                     self.table.update_item(
                        Key={'PK': pk, 'SK': 'METADATA'},
                        UpdateExpression="SET #stats.#yr = :empty_map",
                        ConditionExpression="attribute_exists(PK) AND attribute_not_exists(#stats.#yr)",
                        ExpressionAttributeNames={"#stats": "statistics", "#yr": self.year_key},
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
                ExpressionAttributeNames={"#stats": "statistics", "#yr": self.year_key},
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
            dry_run (bool): Whether to perform a dry run.
        """
        logger.info(f"Starting April 2026 stats update (Dry run: {dry_run})")
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
    parser = argparse.ArgumentParser(description="Scrape and update constituency stats for April 2026.")
    parser.add_argument("--dryrun", action="store_true", help="Perform a dry run")
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    updater = ConstituencyStatsUpdater202604()
    updater.run(dry_run=args.dryrun)

if __name__ == "__main__":
    main()
