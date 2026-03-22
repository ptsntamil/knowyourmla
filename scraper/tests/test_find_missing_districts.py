import pytest
from unittest.mock import MagicMock, patch
from scraper.helper.find_missing_districts import DistrictDiscovery

@pytest.fixture
def mock_dynamodb():
    """Fixture for mocked DynamoDB tables."""
    with patch('boto3.resource') as mock_resource:
        mock_candidates = MagicMock()
        mock_districts = MagicMock()
        
        def get_table(name):
            if name == "knowyourmla_candidates":
                return mock_candidates
            return mock_districts
            
        mock_resource.return_value.Table.side_effect = get_table
        yield mock_candidates, mock_districts

def test_find_missing_districts_filtering(mock_dynamodb):
    """Test that find_missing_districts correctly filters for missing or invalid district_id."""
    mock_candidates, mock_districts = mock_dynamodb
    
    # Setup districts mock
    mock_districts.scan.return_value = {
        "Items": [{"PK": "DISTRICT#chennai"}, {"PK": "DISTRICT#madurai"}]
    }
    
    # Setup candidates mock
    mock_candidates.scan.side_effect = [
        {
            "Items": [
                {"PK": "AFFIDAVIT#2021#1", "district_id": "DISTRICT#chennai"}, # Valid
                {"PK": "AFFIDAVIT#2021#2", "district_id": "DISTRICT#invalid"}, # Invalid
                {"PK": "AFFIDAVIT#2021#3"} # Missing
            ],
            "LastEvaluatedKey": "some-key"
        },
        {
            "Items": [
                {"PK": "AFFIDAVIT#2021#4", "district_id": ""}, # Empty
                {"PK": "AFFIDAVIT#2021#5", "district_id": None} # None
            ]
        }
    ]
    
    discovery = DistrictDiscovery()
    missing_pks = discovery.find_missing_districts()
    
    # Invalid: 2 (invalid), 3 (missing), 4 (empty), 5 (None)
    assert len(missing_pks) == 4
    assert "AFFIDAVIT#2021#2" in missing_pks
    assert "AFFIDAVIT#2021#3" in missing_pks
    assert "AFFIDAVIT#2021#4" in missing_pks
    assert "AFFIDAVIT#2021#5" in missing_pks
    assert "AFFIDAVIT#2021#1" not in missing_pks
    
    # Verify scan was called twice for candidates and once for districts
    assert mock_candidates.scan.call_count == 2
    assert mock_districts.scan.call_count == 1

def test_log_failed_candidates(tmp_path):
    """Test logging PKs to a file."""
    log_file = tmp_path / "failed_candidates.txt"
    discovery = DistrictDiscovery()
    discovery.failure_log = str(log_file)
    
    pks = ["PK1", "PK2"]
    discovery.log_failed_candidates(pks)
    
    assert log_file.exists()
    content = log_file.read_text()
    assert "PK1\nPK2\n" == content

def test_find_missing_districts_empty(mock_dynamodb):
    """Test when no candidates are missing district_id."""
    mock_candidates, mock_districts = mock_dynamodb
    mock_districts.scan.return_value = {"Items": []}
    mock_candidates.scan.return_value = {"Items": []}
    
    discovery = DistrictDiscovery()
    missing_pks = discovery.find_missing_districts()
    
    assert len(missing_pks) == 0
    assert mock_candidates.scan.called

def test_find_missing_districts_error(mock_dynamodb):
    """Test error handling during scan."""
    mock_candidates, mock_districts = mock_dynamodb
    mock_districts.scan.return_value = {"Items": []}
    mock_candidates.scan.side_effect = Exception("DynamoDB Error")
    
    discovery = DistrictDiscovery()
    missing_pks = discovery.find_missing_districts()
    
    assert len(missing_pks) == 0
