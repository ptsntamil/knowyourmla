import pytest
from unittest.mock import MagicMock, patch, mock_open
from decimal import Decimal
from scraper.update_constituency_stats_2016 import ConstituencyStatsUpdater

@pytest.fixture
def mock_updater():
    with patch('boto3.resource') as mock_boto:
        mock_table = MagicMock()
        mock_boto.return_value.Table.return_value = mock_table
        updater = ConstituencyStatsUpdater(table_name="test_table", region="test_region")
        return updater, mock_table

def test_parse_csv(mock_updater):
    updater, _ = mock_updater
    # Prime the alias cache using the same import path as the script
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from utils import get_all_aliases
    get_all_aliases()
    
    csv_content = (
        "Constituency_Name,Electors,Turnout_Percentage\n"
        "GUMMIDIPUNDI,260912,82.15\n"
        "PONNERI,250403,78.93\n"
        "GUMMIDIPUNDI,260912,82.15\n" # Duplicate constituency (different candidate row)
    )
    
    with patch("builtins.open", mock_open(read_data=csv_content)):
        with patch("os.path.exists", return_value=True):
            stats = updater.parse_csv("fake_path.csv")
            
    assert len(stats) == 2
    assert "CONSTITUENCY#gummidipoondi" in stats
    assert stats["CONSTITUENCY#gummidipoondi"]["total_electors"] == 260912
    assert stats["CONSTITUENCY#gummidipoondi"]["poll_percentage"] == Decimal("82.15")
    
    assert "CONSTITUENCY#ponneri" in stats
    assert stats["CONSTITUENCY#ponneri"]["total_electors"] == 250403
    assert stats["CONSTITUENCY#ponneri"]["poll_percentage"] == Decimal("78.93")

def test_update_dynamodb_success(mock_updater):
    updater, mock_table = mock_updater
    stats = {
        "total_electors": 100,
        "poll_percentage": Decimal("75.5"),
        "raw_name": "Test AC"
    }
    
    result = updater.update_dynamodb("CONSTITUENCY#test", stats)
    
    assert result is True
    # Now it makes 3 calls: Step 1 (stats map), Step 2 (year map), Step 3 (data fields)
    assert mock_table.update_item.call_count == 3
    
    # Verify third call (actual data update)
    _, kwargs = mock_table.update_item.call_args
    assert kwargs['Key'] == {'PK': 'CONSTITUENCY#test', 'SK': 'METADATA'}
    assert kwargs['UpdateExpression'] == "SET #stats.#yr.total_electors = :te, #stats.#yr.poll_percentage = :vp"
    assert kwargs['ExpressionAttributeValues'][':te'] == 100
    assert kwargs['ExpressionAttributeValues'][':vp'] == Decimal("75.5")

def test_update_dynamodb_dry_run(mock_updater):
    updater, mock_table = mock_updater
    stats = {
        "total_electors": 100,
        "poll_percentage": Decimal("75.5"),
        "raw_name": "Test AC"
    }
    
    result = updater.update_dynamodb("CONSTITUENCY#test", stats, dry_run=True)
    
    assert result is True
    assert mock_table.update_item.call_count == 0

def test_update_dynamodb_not_found(mock_updater):
    updater, mock_table = mock_updater
    from botocore.exceptions import ClientError
    
    error_response = {'Error': {'Code': 'ConditionalCheckFailedException'}}
    mock_table.update_item.side_effect = ClientError(error_response, 'UpdateItem')
    
    stats = {
        "total_electors": 100,
        "voter_turnout_percentage": Decimal("75.5"),
        "raw_name": "Test AC"
    }
    
    result = updater.update_dynamodb("CONSTITUENCY#test", stats)
    
    assert result is False
