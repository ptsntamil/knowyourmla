import boto3
import os
from botocore.exceptions import ClientError

REGION_NAME = os.getenv("AWS_REGION", "ap-south-2")

def create_election_table():
    dynamodb = boto3.resource("dynamodb", region_name=REGION_NAME)
    table_name = "knowyourmla_elections"

    try:
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"}
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"}
            ],
            ProvisionedThroughput={
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            }
        )
        print(f"Creating table {table_name}...")
        table.wait_until_exists()
        print(f"Table {table_name} created successfully!")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"Table {table_name} already exists.")
        else:
            print(f"Error creating table: {e}")

if __name__ == "__main__":
    create_election_table()
