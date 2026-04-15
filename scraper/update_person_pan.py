import boto3
import csv
import logging
import argparse
import os
from botocore.exceptions import ClientError
from typing import Dict, Any

# AWS Configuration
REGION_NAME = "ap-south-2"
PERSONS_TABLE = "knowyourmla_persons"

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("update_person_pan")

class PersonPanUpdater:
    """Updates the 'pan_number' attribute in the 'knowyourmla_persons' table."""

    def __init__(self, region: str = REGION_NAME, table_name: str = PERSONS_TABLE):
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.table = self.dynamodb.Table(table_name)

    def update_pan(self, person_id: str, pan_number: str, dry_run: bool = False) -> bool:
        """
        Updates the PAN number for a specific person.
        
        Args:
            person_id: The PK of the person (e.g., PERSON#<hash>).
            pan_number: The PAN number string to update.
            dry_run: If True, log the update without performing it.
            
        Returns:
            True if successful, False otherwise.
        """
        pk = person_id
        sk = "METADATA"

        if dry_run:
            logger.info(f"[DRY RUN] Would update PAN for {pk} to {pan_number}")
            return True

        try:
            self.table.update_item(
                Key={"PK": pk, "SK": sk},
                UpdateExpression="SET pan_number = :pan",
                ExpressionAttributeValues={":pan": pan_number},
                ConditionExpression="attribute_exists(PK)"
            )
            logger.info(f"Successfully updated PAN for {pk}")
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Person record {pk} not found in database.")
            else:
                logger.error(f"Error updating DynamoDB for {pk}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error for {pk}: {e}")
            return False

    def process_csv(self, csv_path: str, dry_run: bool = False):
        """Processes the CSV file and updates the database."""
        if not os.path.exists(csv_path):
            logger.error(f"CSV file not found: {csv_path}")
            return

        success_count = 0
        fail_count = 0
        total_count = 0

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_count += 1
                person_id = row.get('person_id')
                pan_number = row.get('pan_number')

                if not person_id or not pan_number:
                    logger.warning(f"Skipping malformed row: {row}")
                    fail_count += 1
                    continue

                if self.update_pan(person_id, pan_number, dry_run):
                    success_count += 1
                else:
                    fail_count += 1

        logger.info(f"Process complete. Total: {total_count}, Success: {success_count}, Failed: {fail_count}")

def main():
    parser = argparse.ArgumentParser(description="Update PAN numbers for persons in DynamoDB.")
    parser.add_argument("--csv", type=str, default="assets/person_pan_match.csv", help="Path to the CSV mapping file.")
    parser.add_argument("--dry_run", action="store_true", help="Perform a dry run without updating the database.")
    args = parser.parse_args()

    updater = PersonPanUpdater()
    updater.process_csv(args.csv, dry_run=args.dry_run)

if __name__ == "__main__":
    main()
