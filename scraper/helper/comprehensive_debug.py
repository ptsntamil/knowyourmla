
import boto3
from boto3.dynamodb.conditions import Key, Attr
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug")

TABLE_NAME = "knowyourmla_candidates"
REGION_NAME = "ap-south-2"

def debug():
    # 1. Describe table
    client = boto3.client('dynamodb', region_name=REGION_NAME)
    desc = client.describe_table(TableName=TABLE_NAME)
    indices = desc['Table'].get('GlobalSecondaryIndexes', [])
    for idx in indices:
        logger.info("Index: %s | Keys: %s", idx['IndexName'], idx['KeySchema'])

    dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
    table = dynamodb.Table(TABLE_NAME)
    
    # 1. Search for the winner specifically (using the name from your JSON)
    # Note: DynamoDB contains is CASE-SENSITIVE
    winner_name_part = "PERIYAKARUPPAN" 
    logger.info(f"Searching for candidate containing: {winner_name_part}")
    resp = table.scan(
        FilterExpression=Attr('candidate_name').contains(winner_name_part)
    )
    items = resp.get('Items', [])
    logger.info("Found %d items total matching '%s'", len(items), winner_name_part)
    for item in items:
        logger.info("PK: %s | Name: %s | ID: %s | Year: %s", 
                    item.get('PK'), item.get('candidate_name'), 
                    item.get('constituency_id'), item.get('year'))

    # 2. Find ALL candidates for year 2021 to see where Alangudi ones are
    logger.info("Scanning for all 2021 candidates to identify tiruppathur ones...")
    # Using year as Decimal or string (trying both)
    all_2021 = []
    projection = "PK, candidate_name, constituency_id, #yr, constituency_id"
    expr_names = {"#yr": "year"}
    
    # Simple scan first
    resp = table.scan(
        FilterExpression=Attr('year').eq(2021) | Attr('year').eq('2021'),
        ProjectionExpression="PK, candidate_name, constituency_id, #yr, constituency",
        ExpressionAttributeNames=expr_names
    )
    all_2021.extend(resp.get('Items', []))
    while 'LastEvaluatedKey' in resp:
        resp = table.scan(
            FilterExpression=Attr('year').eq(2021) | Attr('year').eq('2021'),
            ProjectionExpression="PK, candidate_name, constituency_id, #yr, constituency",
            ExpressionAttributeNames=expr_names,
            ExclusiveStartKey=resp['LastEvaluatedKey']
        )
        all_2021.extend(resp.get('Items', []))
    
    logger.info("Total 2021 candidates found: %d", len(all_2021))
    
    alangudi_2021 = [i for i in all_2021 if i.get('constituency_id') and 'tiruppathur' in i.get('constituency_id', '').lower()]
    alangudi_name_match = [i for i in all_2021 if i.get('constituency') and 'tiruppathur' in i.get('constituency', '').lower()]
    
    combined = {i['PK']: i for i in (alangudi_2021 + alangudi_name_match)}.values()
    
    logger.info("tiruppathur 2021 candidates found: %d", len(combined))
    for item in combined:
        logger.info("Candidate: %s | ID: %s | Const: %s", 
                    item.get('candidate_name'), item.get('constituency_id'), item.get('constituency'))

if __name__ == "__main__":
    debug()
