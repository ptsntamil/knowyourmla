from typing import List, Dict, Any
from app.utils.dynamodb import DynamoDBClient
from boto3.dynamodb.conditions import Key

class CandidateRepository:
    def __init__(self, table_name: str = "knowyourmla_candidates", client: DynamoDBClient = None):
        if client:
            self.client = client
        else:
            self.client = DynamoDBClient(table_name=table_name)

    def get_person_history(self, person_id: str) -> List[Dict[str, Any]]:
        """
        Fetches candidate history using the PersonIndex GSI.
        Query: person_id = person_id
        """
        key_condition_expression = Key('person_id').eq(person_id)
        
        return self.client.query(
            IndexName='PersonIndex',
            KeyConditionExpression=key_condition_expression
        )
