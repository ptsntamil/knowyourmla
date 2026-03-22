from typing import List, Dict, Any
from app.utils.dynamodb import DynamoDBClient

class DistrictRepository:
    def __init__(self, table_name: str = "knowyourmla_districts", client: DynamoDBClient = None):
        if client:
            self.client = client
        else:
            self.client = DynamoDBClient(table_name=table_name)

    def get_all_districts(self) -> List[Dict[str, Any]]:
        """
        Fetches all districts from knowyourmla_districts where SK = METADATA.
        """
        filter_expression = "SK = :sk"
        expression_attribute_values = {":sk": "METADATA"}
        return self.client.scan(
            FilterExpression=filter_expression,
            ExpressionAttributeValues=expression_attribute_values
        )

    def get_district_by_id(self, district_id: str) -> Dict[str, Any]:
        """
        Fetches district metadata from knowyourmla_districts.
        """
        try:
            return self.client.get_item(
                Key={"PK": district_id, "SK": "METADATA"}
            )
        except Exception:
            return None
