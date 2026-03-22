from typing import Optional, Dict, Any, List
from app.utils.dynamodb import DynamoDBClient
from boto3.dynamodb.conditions import Key

class PersonRepository:
    def __init__(self, table_name: str = "knowyourmla_persons", client: DynamoDBClient = None):
        if client:
            self.client = client
        else:
            self.client = DynamoDBClient(table_name=table_name)

    def get_person_by_id(self, person_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches person metadata using their specific person_id (PK).
        Query: PK = person_id AND SK = METADATA
        """
        key_condition_expression = Key('PK').eq(person_id) & Key('SK').eq('METADATA')
        
        response = self.client.query(
            KeyConditionExpression=key_condition_expression
        )
        
        if response:
            return response[0]
        return None

    def get_person_by_normalized_name(self, normalized_name: str) -> Optional[Dict[str, Any]]:
        """
        Fetches person metadata using their normalized_name via NameIndex GSI.
        """
        key_condition_expression = Key('normalized_name').eq(normalized_name)
        
        response = self.client.query(
            IndexName='NameIndex',
            KeyConditionExpression=key_condition_expression
        )
        
        if response:
            # Filter for SK = METADATA if there are multiple candidate records with same name
            # though usually NameIndex on knowyourmla_persons should primarily have METADATA records.
            metadata_records = [r for r in response if r.get('SK') == 'METADATA']
            return metadata_records[0] if metadata_records else response[0]
        return None

    def get_persons_by_ids(self, person_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Batch fetches multiple person records by their IDs.
        """
        if not person_ids:
            return []
            
        keys = [{'PK': pid, 'SK': 'METADATA'} for pid in person_ids if pid]
        
        # DynamoDB batch_get_item has a limit of 100 items per request
        results = []
        for i in range(0, len(keys), 100):
            chunk = keys[i:i + 100]
            try:
                # Using the underlying table object via the client's resource
                response = self.client.resource.batch_get_item(
                    RequestItems={
                        self.client.table.table_name: {
                            'Keys': chunk
                        }
                    }
                )
                results.extend(response.get('Responses', {}).get(self.client.table.table_name, []))
                
                # Handle unprocessed keys
                unprocessed = response.get('UnprocessedKeys', {})
                while unprocessed and self.client.table.table_name in unprocessed:
                    response = self.client.resource.batch_get_item(RequestItems=unprocessed)
                    results.extend(response.get('Responses', {}).get(self.client.table.table_name, []))
                    unprocessed = response.get('UnprocessedKeys', {})
            except Exception as e:
                # Log or handle error appropriately
                print(f"Error in batch_get_item: {e}")
                
        return results
