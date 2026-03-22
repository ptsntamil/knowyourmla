#!/usr/bin/env python3

import os
import sys
import boto3
import argparse
from typing import List, Tuple

# Add parent directory to path to import config and utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from config import logger
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    logging.basicConfig(level=logging.INFO)

CANDIDATES_TABLE = "knowyourmla_candidates"
REGION_NAME = "ap-south-2"
FAILURE_LOG = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs", "failed_candidates.txt")

class CandidateErrorMarker:
    """Marks candidates in DynamoDB as having errors based on a log file.
    
    Attributes:
        dry_run (bool): If True, no changes are committed to DynamoDB.
        table (boto3.resources.factory.dynamodb.Table): DynamoDB table resource.
    """

    def __init__(self, dry_run: bool = True):
        """Initializes the marker with DynamoDB resources.
        
        Args:
            dry_run (bool): Whether to run in dry-run mode. Defaults to True.
        """
        self.dry_run = dry_run
        self.dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
        self.table = self.dynamodb.Table(CANDIDATES_TABLE)
        logger.info(f"Initialized CandidateErrorMarker (dry_run={self.dry_run})")

    def read_failed_pks(self, file_path: str) -> List[str]:
        """Reads primary keys from the failure log file.
        
        Args:
            file_path (str): Path to the log file containing candidate PKs.
            
        Returns:
            List[str]: A list of primary keys.
        """
        if not os.path.exists(file_path):
            logger.warning(f"Failure log file not found: {file_path}")
            return []
            
        with open(file_path, "r") as f:
            pks = [line.strip() for line in f if line.strip()]
        
        logger.info(f"Read {len(pks)} PKs from {file_path}")
        return pks

    def mark_candidate_as_error(self, pk: str, message: str) -> bool:
        """Updates a single candidate record with error status and message.
        
        Args:
            pk (str): The primary key (PK) of the candidate.
            message (str): The error message to be stored.
            
        Returns:
            bool: True if the update was successful (or skipped in dry-run), False otherwise.
        """
        logger.info(f"Marking {pk} as error: {message}")
        
        if self.dry_run:
            logger.info(f"  [Dry Run] Would update {pk} with error=True, message='{message}'")
            return True
            
        try:
            self.table.update_item(
                Key={"PK": pk, "SK": "DETAILS"},
                UpdateExpression="SET #err = :err, #msg = :msg",
                ExpressionAttributeNames={
                    "#err": "error",
                    "#msg": "message"
                },
                ExpressionAttributeValues={
                    ":err": True,
                    ":msg": message
                }
            )
            return True
        except Exception as e:
            logger.error(f"  Error updating {pk}: {e}")
            return False

    def process_all(self, file_path: str, message: str) -> Tuple[int, int]:
        """Processes all PKs from the log file and marks them as errors.
        
        Args:
            file_path (str): Path to the log file.
            message (str): Error message to apply.
            
        Returns:
            Tuple[int, int]: (success_count, failure_count)
        """
        pks = self.read_failed_pks(file_path)
        if not pks:
            return 0, 0
            
        success = 0
        failed = 0
        
        for pk in pks:
            if self.mark_candidate_as_error(pk, message):
                success += 1
            else:
                failed += 1
                
        logger.info(f"Completed processing. Success: {success}, Failed: {failed}")
        return success, failed

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description="Mark failed candidates in DynamoDB as errors.")
    parser.add_argument("--execute", action="store_true", help="Set to True to commit changes to DynamoDB.")
    parser.add_argument("--log-file", default=FAILURE_LOG, help="Path to the failure log file.")
    parser.add_argument("--message", default="loksabha election url mismatch", help="Error message to set.")
    
    args = parser.parse_args()
    
    marker = CandidateErrorMarker(dry_run=not args.execute)
    marker.process_all(args.log_file, args.message)

if __name__ == "__main__":
    main()
