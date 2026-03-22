from typing import List, Dict, Any, Optional
from app.utils.dynamodb import DynamoDBClient
from boto3.dynamodb.conditions import Key

class PartyRepository:
    def __init__(self, table_name: str = "knowyourmla_political_parties", client: DynamoDBClient = None):
        if client:
            self.client = client
        else:
            self.client = DynamoDBClient(table_name=table_name)

    def get_all_parties(self) -> List[Dict[str, Any]]:
        """
        Fetches all party metadata from knowyourmla_political_parties.
        Uses scan to get all items.
        """
        return self.client.scan()

    def get_party_by_id(self, party_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches party metadata by its PK (e.g., PARTY#dravidamunnetrakazhagam).
        """
        if not party_id.startswith("PARTY#"):
            party_id = f"PARTY#{party_id}"
            
        return self.client.get_item(Key={'PK': party_id, 'SK': 'METADATA'})
