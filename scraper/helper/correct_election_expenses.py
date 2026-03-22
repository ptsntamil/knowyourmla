#!/usr/bin/env python3

import os
import sys
import argparse
import boto3
from typing import List, Dict, Any
from decimal import Decimal
from botocore.exceptions import ClientError

# Add parent directory to path to import config/logger if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mocking logger if not available
try:
    from config import logger
except ImportError:
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("correct_expenses")

CANDIDATES_TABLE = "knowyourmla_candidates"
REGION_NAME = "ap-south-2"

class ExpenseCorrector:
    def __init__(self, dry_run: bool = True):
        self.dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
        self.table = self.dynamodb.Table(CANDIDATES_TABLE)
        self.dry_run = dry_run

    def should_correct(self, amount: int) -> bool:
        """
        Check if the amount needs correction based on the first and last 2 digits matching.
        Example: 211582821 -> First 2: 21, Last 2: 21. Match!
        """
        s = str(amount)
        if len(s) < 4:
            return False
        
        first_two = s[:2]
        last_two = s[-2:]
        
        return first_two == last_two

    def correct_value(self, amount: int) -> int:
        """Remove the last 2 digits."""
        s = str(amount)
        return int(s[:-2])

    def run(self):
        logger.info(f"Starting expense correction scan on {CANDIDATES_TABLE}...")
        if self.dry_run:
            logger.info("[DRY RUN] No updates will be performed.")

        count = 0
        corrected_count = 0
        
        try:
            response = self.table.scan(
                ProjectionExpression="PK, SK, election_expenses"
            )
            items = response.get("Items", [])
            
            while True:
                for item in items:
                    count += 1
                    pk = item.get("PK")
                    sk = item.get("SK")
                    expenses = item.get("election_expenses")
                    
                    if expenses is not None:
                        try:
                            # Convert to int, handling Decimal/string/float
                            expenses_int = int(float(str(expenses)))
                            
                            s = str(expenses_int)
                            if count % 500 == 0:
                                first_2 = s[:2] if len(s) >= 2 else "N/A"
                                last_2 = s[-2:] if len(s) >= 2 else "N/A"
                                logger.info(f"Checking item {count}: PK={pk}, Value={s}, Headers={first_2}, Footers={last_2}")
                                
                            if self.should_correct(expenses_int):
                                new_value = self.correct_value(expenses_int)
                                logger.info(f"!!! MATCH FOUND !!!: {pk} | Old: {expenses_int} -> New: {new_value}")
                                
                                if not self.dry_run:
                                    try:
                                        self.table.update_item(
                                            Key={"PK": pk, "SK": sk},
                                            UpdateExpression="SET election_expenses = :val",
                                            ExpressionAttributeValues={":val": new_value}
                                        )
                                        logger.info(f"SUCCESS: Updated {pk}")
                                        corrected_count += 1
                                    except ClientError as e:
                                        logger.error(f"Failed to update {pk}: {e}")
                                else:
                                    corrected_count += 1
                        except (ValueError, TypeError):
                            continue
                                
                if "LastEvaluatedKey" in response:
                    response = self.table.scan(
                        ProjectionExpression="PK, SK, election_expenses",
                        ExclusiveStartKey=response["LastEvaluatedKey"]
                    )
                    items = response.get("Items", [])
                else:
                    break
                    
        except ClientError as e:
            logger.error(f"Error scanning table: {e}")
            
        logger.info(f"Scan complete. Processed: {count} | Corrected: {corrected_count}")

def main():
    parser = argparse.ArgumentParser(description="Correct election expenses in DynamoDB.")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Don't perform actual updates.")
    parser.add_argument("--execute", action="store_true", default=False, help="Perform actual updates (required if not dry-run).")
    
    args = parser.parse_args()
    
    # Require explicit --execute if --dry-run is not set to true
    dry_run = not args.execute
    
    corrector = ExpenseCorrector(dry_run=dry_run)
    corrector.run()

if __name__ == "__main__":
    main()
