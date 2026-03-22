from typing import List, Dict, Any
from app.utils.dynamodb import DynamoDBClient
from boto3.dynamodb.conditions import Key

class MLARepository:
    def __init__(self, table_name: str = "knowyourmla_candidates", client: DynamoDBClient = None):
        if client:
            self.client = client
        else:
            self.client = DynamoDBClient(table_name=table_name)

    def get_winners_by_year(self, year: int) -> List[Dict[str, Any]]:
        """
        Fetches all winners for a specific year from knowyourmla_candidates.
        Uses scan with filter on year and is_winner.
        """
        from boto3.dynamodb.conditions import Attr
        filter_expression = Attr('year').eq(year) & Attr('is_winner').eq(True)
        
        return self.client.scan(
            FilterExpression=filter_expression
        )

    def get_winners_by_year_range(self, start_year: int, end_year: int) -> List[Dict[str, Any]]:
        """
        Fetches all winners between start_year and end_year (inclusive).
        Uses scan with filter on year range and is_winner.
        """
        from boto3.dynamodb.conditions import Attr
        filter_expression = Attr('year').between(start_year, end_year) & Attr('is_winner').eq(True)

        return self.client.scan(
            FilterExpression=filter_expression
        )
