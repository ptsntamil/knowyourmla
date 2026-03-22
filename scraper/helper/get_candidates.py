
import boto3
from boto3.dynamodb.conditions import Key, Attr
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug")

TABLE_NAME = "knowyourmla_candidates"
REGION_NAME = "ap-south-2"

def debug():
    dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
    table = dynamodb.Table(TABLE_NAME)
    
    # 1. Describe table
    client = boto3.client('dynamodb', region_name=REGION_NAME)
    desc = client.describe_table(TableName=TABLE_NAME)
    logger.info("GSIs: %s", [gsi['IndexName'] for gsi in desc['Table'].get('GlobalSecondaryIndexes', [])])
    
    # 2. Search for Winner by Name
    winner_name = "Kr.Periyakaruppan"
    logger.info(f"Searching for candidate: {winner_name}")
    resp = table.scan(
        FilterExpression=Attr('candidate_name').contains('Periyakaruppan')
    )
    items = resp.get('Items', [])
    logger.info("Found %d items total matching 'Periyakaruppan'", len(items))
    
    for item in items:
        logger.info("PK: %s | Name: %s | ID: %s | Const: %s | Year: %s | is_winner: %s", 
                    item.get('PK'),
                    item.get('candidate_name'), 
                    item.get('constituency_id'),
                    item.get('constituency'),
                    item.get('year'),
                    item.get('is_winner'))

    # 3. List some items to see schema
    logger.info("Listing 5 random items to see schema")
    resp = table.scan(Limit=5)
    for item in resp.get('Items', []):
        logger.info("Item keys: %s", list(item.keys()))

if __name__ == "__main__":
    debug()
