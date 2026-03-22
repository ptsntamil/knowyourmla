import json
import boto3
from botocore.exceptions import ClientError
import os
import sys

# Configuration
REGION_NAME = "ap-south-2"
TABLE_NAME = "knowyourmla_political_parties"
# The script is in backend/scripts, assets are in scraper/assets
JSON_FILE_PATH = os.path.join(os.path.dirname(__file__), "../../scraper/assets/political_parties.json")

def update_party_metadata():
    """Updates the political parties table with metadata from the JSON file."""
    # Use environment variables if available, otherwise default to config
    region = os.getenv("AWS_REGION", REGION_NAME)
    
    try:
        dynamodb = boto3.resource("dynamodb", region_name=region)
        table = dynamodb.Table(TABLE_NAME)
    except Exception as e:
        print(f"Error connecting to DynamoDB: {e}")
        sys.exit(1)

    # Normalize path
    json_abs_path = os.path.abspath(JSON_FILE_PATH)
    if not os.path.exists(json_abs_path):
        print(f"Error: JSON file not found at {json_abs_path}")
        sys.exit(1)

    with open(json_abs_path, "r") as f:
        try:
            parties = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            sys.exit(1)

    print(f"Updating metadata for {len(parties)} parties in {TABLE_NAME}...")

    updated_count = 0
    failed_count = 0

    for party in parties:
        pk = party.get("PK")
        sk = party.get("SK", "METADATA")
        
        if not pk:
            continue

        # Prepare update expression and attribute values
        update_parts = []
        attr_names = {}
        attr_values = {}

        # Fields to update
        fields = {
            "name": party.get("name"),
            "short_name": party.get("short_name"),
            "normalized_name": party.get("normalized_name"),
            "logo_url": party.get("logo_url"),
            "color_bg": party.get("color_bg"),
            "color_text": party.get("color_text"),
            "color_border": party.get("color_border"),
            "myneta_url": party.get("myneta_url")
        }

        for field, value in fields.items():
            if value is not None:
                placeholder_name = f"#{field}"
                placeholder_value = f":{field}"
                update_parts.append(f"{placeholder_name} = {placeholder_value}")
                attr_names[placeholder_name] = field
                attr_values[placeholder_value] = value

        if not update_parts:
            continue

        update_expr = "SET " + ", ".join(update_parts)

        try:
            table.update_item(
                Key={"PK": pk, "SK": sk},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=attr_names,
                ExpressionAttributeValues=attr_values
            )
            print(f"Successfully updated: {pk}")
            updated_count += 1
        except ClientError as e:
            print(f"Failed to update {pk}: {e.response['Error']['Message']}")
            failed_count += 1
        except Exception as e:
            print(f"Unexpected error updating {pk}: {e}")
            failed_count += 1

    print(f"\nMigration Status:")
    print(f"Total parties processed: {len(parties)}")
    print(f"Successfully updated: {updated_count}")
    print(f"Failed: {failed_count}")

if __name__ == "__main__":
    update_party_metadata()
