
import boto3
import json
from decimal import Decimal

def default_decimal(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def inspect():
    session = boto3.Session(region_name="ap-south-2")
    dynamodb = session.resource('dynamodb')
    table = dynamodb.Table('knowyourmla_candidates')
    
    print("Scanning for items with election_expenses...")
    response = table.scan(
        Limit=100,
        FilterExpression='attribute_exists(election_expenses)'
    )
    
    items = response.get('Items', [])
    print(f"Found {len(items)} items in sample.")
    
    for item in items[:10]:
        pk = item.get('PK')
        val = item.get('election_expenses')
        print(f"PK: {pk} | Type: {type(val)} | Value: {val}")

if __name__ == "__main__":
    inspect()
