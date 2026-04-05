import boto3
import json
import logging
from typing import Dict, Any, Optional
from decimal import Decimal

# AWS Configuration
REGION_NAME = "ap-south-2"
CANDIDATES_TABLE = "knowyourmla_candidates"

logger = logging.getLogger("asset_db_updater")

def convert_floats_to_decimals(obj: Any) -> Any:
    """Recursively convert float values to Decimal for DynamoDB."""
    if isinstance(obj, float):
        # Convert float to string first to avoid precision issues with Decimal(float)
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimals(i) for i in obj]
    return obj

class AssetDBUpdater:
    def __init__(self, region: str = REGION_NAME, table_name: str = CANDIDATES_TABLE):
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.table = self.dynamodb.Table(table_name)

    def update_assets(self, candidate_id: int, year: int, assets: Dict[str, Any], dry_run: bool = False) -> bool:
        """
        Updates the candidate affidavit record with gold, vehicle, and land asset details.
        
        Args:
            candidate_id: The MyNeta candidate ID.
            year: The election year.
            assets: Dictionary containing gold, vehicle, and land data.
            dry_run: If True, only log the update without performing it.
            
        Returns:
            True if successful, False otherwise.
        """
        pk = f"AFFIDAVIT#{year}#{candidate_id}"
        sk = "DETAILS"

        # Convert float to Decimal for DynamoDB compat
        decimal_assets = convert_floats_to_decimals(assets)
        
        # Prepare the update expression
        update_expr = "SET gold_assets = :gold, silver_assets = :silver, vehicle_assets = :veh, land_assets = :land"
        attr_values = {
            ":gold": decimal_assets.get("gold", {}),
            ":silver": decimal_assets.get("silver", {}),
            ":veh": decimal_assets.get("vehicle", {}),
            ":land": decimal_assets.get("land", {})
        }
        
        logger.info(f"{'[DRY RUN] ' if dry_run else ''}Updating assets for {pk}")
        
        if dry_run:
            logger.info(f"Update Expression: {update_expr}")
            logger.info(f"Attribute Values: {json.dumps(attr_values, indent=2, default=str)}")
            return True
            
        try:
            self.table.update_item(
                Key={"PK": pk, "SK": sk},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=attr_values,
                ConditionExpression="attribute_exists(PK)"  # Only update if record exists
            )
            logger.info(f"Successfully updated assets for {pk}")
            return True
        except self.dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
            logger.error(f"Candidate record {pk} not found in database. Update failed.")
            return False
        except Exception as e:
            logger.error(f"Error updating DynamoDB for {pk}: {e}")
            return False

    def list_candidates_by_year(self, year: int, skip_existing: bool = False) -> List[int]:
        """
        Retrieves all MyNeta candidate IDs for a specific election year by scanning the PK prefix.
        
        Args:
            year: The election year.
            skip_existing: If True, only returns candidates who do NOT have asset data already.
            
        Returns:
            List of candidate IDs (integers).
        """
        prefix = f"AFFIDAVIT#{year}#"
        candidate_ids = []
        
        # Prepare filter expression
        filter_expr = "begins_with(PK, :prefix) AND SK = :sk"
        attr_values = {
            ":prefix": prefix,
            ":sk": "DETAILS"
        }
        
        if skip_existing:
            # Skip if ALL of the detailed asset fields already exist
            # Logic: We want to process if at least one is missing (OR attribute_not_exists)
            # Or if the user meant "if ANY asset value is there, skip", then it's AND attribute_not_exists for all.
            # Usually, "if assets value already there" means the enrichment was already done.
            filter_expr += " AND attribute_not_exists(gold_assets) AND attribute_not_exists(silver_assets) AND attribute_not_exists(vehicle_assets) AND attribute_not_exists(land_assets)"
            logger.info(f"Scanning for candidates in {year} missing ALL asset data...")
        
        try:
            # Use scan with a FilterExpression to find all records for the year
            response = self.table.scan(
                FilterExpression=filter_expr,
                ExpressionAttributeValues=attr_values,
                ProjectionExpression="PK"
            )
            
            def extract_ids(items):
                ids = []
                for item in items:
                    pk = item.get("PK", "")
                    parts = pk.split("#")
                    if len(parts) == 3:
                        try:
                            ids.append(int(parts[2]))
                        except ValueError:
                            continue
                return ids

            candidate_ids.extend(extract_ids(response.get("Items", [])))
                        
            while 'LastEvaluatedKey' in response:
                response = self.table.scan(
                    FilterExpression=filter_expr,
                    ExpressionAttributeValues=attr_values,
                    ProjectionExpression="PK",
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                candidate_ids.extend(extract_ids(response.get("Items", [])))
                            
            logger.info(f"Found {len(candidate_ids)} candidates for year {year}")
            return candidate_ids
            
        except Exception as e:
            logger.error(f"Error scanning candidates for year {year}: {e}")
            return []

if __name__ == "__main__":
    # For standalone testing if needed
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate_id", type=int, required=True)
    parser.add_argument("--year", type=int, default=2021)
    parser.add_argument("--data_file", type=str, required=True, help="Path to JSON file with asset data")
    parser.add_argument("--dry_run", action="store_true")
    args = parser.parse_args()
    
    with open(args.data_file, 'r') as f:
        asset_data = json.load(f)
        
    updater = AssetDBUpdater()
    updater.update_assets(args.candidate_id, args.year, asset_data, dry_run=args.dry_run)
