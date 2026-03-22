from typing import List, Dict, Any, Optional
from app.utils.dynamodb import DynamoDBClient
from boto3.dynamodb.conditions import Key

class ConstituencyRepository:
    def __init__(
            self, 
            constituency_table: str = "knowyourmla_constituencies", 
            party_table: str = "knowyourmla_political_parties",
            candidate_table: str = "knowyourmla_candidates",
            client_constituency: DynamoDBClient = None,
            client_candidates: DynamoDBClient = None,
            client_parties: DynamoDBClient = None
        ):
        if client_constituency:
            self.client_constituency = client_constituency
        else:
            self.client_constituency = DynamoDBClient(table_name=constituency_table)
            
        if client_candidates:
            self.client_candidates = client_candidates
        else:
            self.client_candidates = DynamoDBClient(table_name=candidate_table)

        if client_parties:
            self.client_parties = client_parties
        else:
            self.client_parties = DynamoDBClient(table_name=party_table)

    def get_all_constituencies(self) -> List[Dict[str, Any]]:
        """
        Fetches all constituencies from knowyourmla_constituencies where SK = METADATA.
        """
        filter_expression = "SK = :sk"
        expression_attribute_values = {":sk": "METADATA"}
        return self.client_constituency.scan(
            FilterExpression=filter_expression,
            ExpressionAttributeValues=expression_attribute_values
        )

    def get_constituencies_by_district(self, district_id: str) -> List[Dict[str, Any]]:
        """
        Fetches constituencies from knowyourmla_constituencies filtered by district_id.
        Since SK is always METADATA for these records, we scan with a filter.
        """
        filter_expression = "SK = :sk AND district_id = :district_id"
        expression_attribute_values = {
            ":sk": "METADATA",
            ":district_id": district_id
        }
        return self.client_constituency.scan(
            FilterExpression=filter_expression,
            ExpressionAttributeValues=expression_attribute_values
        )

    def get_winner_history(self, constituency_id: str) -> List[Dict[str, Any]]:
        """
        Fetches winner history for a given constituency from knowyourmla_candidates.
        IndexName = ConstituencyIndex, const_id matches, Filter is_winner = True
        """
        key_condition_expression = Key('constituency_id').eq(constituency_id)
        filter_expression = "is_winner = :is_winner"
        expression_attribute_values = {":is_winner": True}
        
        return self.client_candidates.query(
            IndexName='ConstituencyIndex',
            KeyConditionExpression=key_condition_expression,
            FilterExpression=filter_expression,
            ExpressionAttributeValues=expression_attribute_values
        )

    def get_party_by_id(self, party_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches political party metadata from knowyourmla_political_parties.
        """
        try:
            return self.client_parties.get_item(
                Key={"PK": party_id, "SK": "METADATA"}
            )
        except Exception:
            return None

    def get_constituency_metadata(self, constituency_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches constituency metadata from knowyourmla_constituencies.
        """
        try:
            return self.client_constituency.get_item(
                Key={"PK": constituency_id, "SK": "METADATA"}
            )
        except Exception:
            return None
