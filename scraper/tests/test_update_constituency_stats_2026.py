import pytest
import httpx
from unittest.mock import MagicMock, patch
from botocore.exceptions import ClientError
from scraper.update_constituency_stats_2026 import ConstituencyStatsUpdater2026

@pytest.fixture
def mock_updater():
    with patch('boto3.resource') as mock_boto:
        mock_table = MagicMock()
        mock_boto.return_value.Table.return_value = mock_table
        updater = ConstituencyStatsUpdater2026(table_name="test_table", region="test_region")
        return updater, mock_table

def test_fetch_data_success(mock_updater):
    updater, _ = mock_updater
    
    mock_html = """
    <html>
        <body>
            <table>
                <tr>
                    <th>District No.</th><th>District Name</th><th>AC No.</th><th>Name of Assembly Constituency</th><th>Male</th><th>Female</th><th>Third Gender</th><th>Total</th>
                </tr>
                <tr>
                    <td>1</td><td>District 1</td><td>1</td><td>GUMMIDIPUNDI</td><td>122,195</td><td>129,372</td><td>36</td><td>251,603</td>
                </tr>
                <tr>
                    <td>1</td><td>District 1</td><td>2</td><td>PONNERI</td><td>121,221</td><td>127,662</td><td>34</td><td>248,917</td>
                </tr>
                <tr>
                    <td></td><td></td><td></td><td>TOTAL</td><td>243,416</td><td>257,034</td><td>70</td><td>500,520</td>
                </tr>
            </table>
        </body>
    </html>
    """
    
    with patch("httpx.get") as mock_get:
        mock_response = MagicMock()
        mock_response.text = mock_html
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        stats = updater.fetch_data()
        
    assert len(stats) == 2
    assert stats[0]["raw_name"] == "GUMMIDIPUNDI"
    assert stats[0]["male"] == 122195
    assert stats[0]["female"] == 129372
    assert stats[0]["third_gender"] == 36
    assert stats[0]["total_electors"] == 251603
    
    assert stats[1]["raw_name"] == "PONNERI"
    assert stats[1]["total_electors"] == 248917

def test_update_dynamodb_success(mock_updater):
    updater, mock_table = mock_updater
    stats = {
        "raw_name": "GUMMIDIPUNDI",
        "male": 122195,
        "female": 129372,
        "third_gender": 36,
        "total_electors": 251603
    }
    
    # Mock canonicalize_constituency to avoid complex logic in unit test
    with patch("scraper.update_constituency_stats_2026.canonicalize_constituency", return_value="gummidipoondi"):
        result = updater.update_dynamodb(stats)
    
    assert result is True
    # Step 1: stats map, Step 2: year map, Step 3: data update
    assert mock_table.update_item.call_count == 3
    
    # Verify the final update call
    _, kwargs = mock_table.update_item.call_args
    assert kwargs['Key'] == {'PK': 'CONSTITUENCY#gummidipoondi', 'SK': 'METADATA'}
    assert kwargs['UpdateExpression'] == "SET #stats.#yr = :stats_data"
    assert kwargs['ExpressionAttributeValues'][':stats_data'] == {
        "total_electors": 251603,
        "male": 122195,
        "female": 129372,
        "third_gender": 36
    }

def test_update_dynamodb_not_found(mock_updater):
    updater, mock_table = mock_updater
    
    error_response = {'Error': {'Code': 'ConditionalCheckFailedException'}}
    mock_table.update_item.side_effect = ClientError(error_response, 'UpdateItem')
    
    stats = {
        "raw_name": "NON_EXISTENT",
        "male": 0, "female": 0, "third_gender": 0, "total_electors": 0
    }
    
    with patch("scraper.update_constituency_stats_2026.canonicalize_constituency", return_value="nonexistent"):
        result = updater.update_dynamodb(stats)
    
    assert result is False

def test_fetch_data_http_error(mock_updater):
    updater, _ = mock_updater
    
    with patch("httpx.get") as mock_get:
        mock_get.side_effect = httpx.HTTPError("Connection failed")
        stats = updater.fetch_data()
        
    assert stats == []
