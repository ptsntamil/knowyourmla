import boto3
from botocore.exceptions import ClientError
from typing import Any, Dict, List, Optional
import os

REGION_NAME = os.getenv("AWS_REGION", "ap-south-2")

def get_dynamodb_resource():
    """
    Returns a configured boto3 DynamoDB resource.
    We return a new instance or a cached one based on requirements.
    For simplicity, returning a new instance here.
    """
    return boto3.resource("dynamodb", region_name=REGION_NAME)

class DynamoDBClient:
    """Helper client for common DynamoDB operations."""
    
    def __init__(self, table_name: str, resource=None):
        self.resource = resource or get_dynamodb_resource()
        self.table = self.resource.Table(table_name)
        
    def query(self, **kwargs) -> List[Dict[str, Any]]:
        """Wraps DynamoDB Query operation with pagination handling."""
        items = []
        try:
            response = self.table.query(**kwargs)
            items.extend(response.get('Items', []))
            while 'LastEvaluatedKey' in response:
                kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
                response = self.table.query(**kwargs)
                items.extend(response.get('Items', []))
        except ClientError as e:
            # Re-raise or handle specific errors here
            raise e
        return items

    def scan(self, **kwargs) -> List[Dict[str, Any]]:
        """Wraps DynamoDB Scan operation with pagination handling."""
        items = []
        try:
            response = self.table.scan(**kwargs)
            items.extend(response.get('Items', []))
            while 'LastEvaluatedKey' in response:
                kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
                response = self.table.scan(**kwargs)
                items.extend(response.get('Items', []))
        except ClientError as e:
            raise e
        return items

    def get_item(self, **kwargs) -> Optional[Dict[str, Any]]:
        """Wraps DynamoDB GetItem operation."""
        try:
            response = self.table.get_item(**kwargs)
            return response.get('Item')
        except ClientError as e:
            raise e
