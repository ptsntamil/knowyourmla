from typing import List, Dict, Any, Optional
from app.utils.dynamodb import DynamoDBClient

class ElectionRepository:
    """Repository for accessing election data in DynamoDB."""

    def __init__(self, table_name: str = "knowyourmla_elections", client: DynamoDBClient = None):
        if client:
            self.client = client
        else:
            self.client = DynamoDBClient(table_name=table_name)

    def get_all_elections(self) -> List[Dict[str, Any]]:
        """
        Fetches all election records from the database.
        Returns a list of election items where SK = METADATA.
        """
        filter_expression = "SK = :sk"
        expression_attribute_values = {":sk": "METADATA"}
        return self.client.scan(
            FilterExpression=filter_expression,
            ExpressionAttributeValues=expression_attribute_values
        )

    def get_election_by_id(self, election_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches a specific election record by its partition key.
        """
        try:
            return self.client.get_item(
                Key={"PK": election_id, "SK": "METADATA"}
            )
        except Exception:
            return None
