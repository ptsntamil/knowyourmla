
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
    
    # Search for Winner by Name Part
    search_term = "Meyyanathan"
    logger.info(f"Searching for candidate containing: {search_term}")
    resp = table.scan(
        FilterExpression=Attr('candidate_name').contains(search_term)
    )
    items = resp.get('Items', [])
    logger.info("Found %d items total matching '%s'", len(items), search_term)
    
    for item in items:
        logger.info("PK: %s | Name: %s | ID: %s | Const: %s | Year: %s | is_winner: %s", 
                    item.get('PK'),
                    item.get('candidate_name'), 
                    item.get('constituency_id'),
                    item.get('constituency'),
                    item.get('year'),
                    item.get('is_winner'))

if __name__ == "__main__":
    debug()
