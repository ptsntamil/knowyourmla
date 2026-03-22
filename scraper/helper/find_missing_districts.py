#!//Users/ideas2it/Projects/personal/knowyourmla/venv/bin/python3

import os
import sys
import boto3
from typing import List, Dict, Any
from boto3.dynamodb.conditions import Attr

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from config import logger
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    logging.basicConfig(level=logging.INFO)

CANDIDATES_TABLE = "knowyourmla_candidates"
DISTRICTS_TABLE = "knowyourmla_districts"
REGION_NAME = "ap-south-2"
FAILURE_LOG = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs", "failed_candidates.txt")

class DistrictDiscovery:
    """Helper to find candidates missing or having invalid district_id."""

    def __init__(self, table_name: str = CANDIDATES_TABLE, region: str = REGION_NAME):
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.table = self.dynamodb.Table(table_name)
        self.districts_table = self.dynamodb.Table(DISTRICTS_TABLE)
        self.failure_log = FAILURE_LOG
        self.valid_district_ids = self.get_valid_district_ids()

    def get_valid_district_ids(self) -> Set[str]:
        """Fetches all valid district PKs from the districts table."""
        logger.info(f"Fetching valid district IDs from {DISTRICTS_TABLE}...")
        valid_ids = set()
        try:
            response = self.districts_table.scan(ProjectionExpression="PK")
            valid_ids.update([item["PK"] for item in response.get("Items", []) if "PK" in item])
            
            while "LastEvaluatedKey" in response:
                response = self.districts_table.scan(
                    ProjectionExpression="PK",
                    ExclusiveStartKey=response["LastEvaluatedKey"]
                )
                valid_ids.update([item["PK"] for item in response.get("Items", []) if "PK" in item])
        except Exception as e:
            logger.error(f"Error fetching district IDs: {e}")
        
        logger.info(f"Loaded {len(valid_ids)} valid district IDs.")
        return valid_ids

    def find_missing_districts(self) -> List[str]:
        """
        Scans the table for candidates missing or having invalid district_id.
        Returns a list of PKs.
        """
        logger.info(f"Scanning {CANDIDATES_TABLE} for missing or invalid district_id...")
        
        missing_pks = []
        
        # Initial scan to find items with missing/null/empty district_id
        # We also need to check for invalid IDs, but DynamoDB doesn't support 'NOT IN <set>' for sets larger than a few items.
        # So we'll scan and filter in memory for invalid ones.
        
        try:
            # We project PK and district_id to check validity in memory
            response = self.table.scan(
                ProjectionExpression="PK, district_id"
            )
            
            items = response.get("Items", [])
            for item in items:
                pk = item.get("PK")
                dist_id = item.get("district_id")
                
                # Check if district_id is missing, empty, null, or invalid
                if not dist_id or dist_id not in self.valid_district_ids:
                    if pk:
                        missing_pks.append(pk)
            
            while "LastEvaluatedKey" in response:
                response = self.table.scan(
                    ProjectionExpression="PK, district_id",
                    ExclusiveStartKey=response["LastEvaluatedKey"]
                )
                items = response.get("Items", [])
                for item in items:
                    pk = item.get("PK")
                    dist_id = item.get("district_id")
                    if not dist_id or dist_id not in self.valid_district_ids:
                        if pk:
                            missing_pks.append(pk)
                
        except Exception as e:
            logger.error(f"Error scanning table: {e}")
            
        logger.info(f"Found {len(missing_pks)} candidates with missing or invalid district_id.")
        return missing_pks

    def log_failed_candidates(self, pks: List[str]):
        """Logs the found PKs to the failed_candidates.txt file."""
        if not pks:
            logger.info("No candidates to log.")
            return

        os.makedirs(os.path.dirname(self.failure_log), exist_ok=True)
        
        try:
            with open(self.failure_log, "w") as f:
                for pk in pks:
                    f.write(f"{pk}\n")
            logger.info(f"Successfully logged {len(pks)} candidates to {self.failure_log}")
        except Exception as e:
            logger.error(f"Error writing to log file: {e}")

def main():
    discovery = DistrictDiscovery()
    missing_pks = discovery.find_missing_districts()
    discovery.log_failed_candidates(missing_pks)

if __name__ == "__main__":
    main()
