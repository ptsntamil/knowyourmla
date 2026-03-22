import pytest
import os
from unittest.mock import MagicMock, patch
from scraper.helper.mark_failed_candidates import CandidateErrorMarker

@pytest.fixture
def mock_dynamodb():
    """Fixture to mock DynamoDB table resource."""
    with patch('boto3.resource') as mock_resource:
        mock_table = MagicMock()
        mock_resource.return_value.Table.return_value = mock_table
        yield mock_table

def test_read_failed_pks(tmp_path):
    """Tests reading PKs from a file."""
    log_file = tmp_path / "failed_candidates.txt"
    log_file.write_text("PK#1\nPK#2\n\nPK#3  \n")
    
    marker = CandidateErrorMarker(dry_run=True)
    pks = marker.read_failed_pks(str(log_file))
    
    assert pks == ["PK#1", "PK#2", "PK#3"]

def test_mark_candidate_as_error_dry_run(mock_dynamodb):
    """Tests that dry-run does not call update_item."""
    marker = CandidateErrorMarker(dry_run=True)
    success = marker.mark_candidate_as_error("PK#1", "Test error")
    
    assert success is True
    assert mock_dynamodb.update_item.call_count == 0

def test_mark_candidate_as_error_execute(mock_dynamodb):
    """Tests that execute mode calls update_item with correct args."""
    marker = CandidateErrorMarker(dry_run=False)
    success = marker.mark_candidate_as_error("PK#1", "Test error")
    
    assert success is True
    mock_dynamodb.update_item.assert_called_once_with(
        Key={"PK": "PK#1", "SK": "DETAILS"},
        UpdateExpression="SET #err = :err, #msg = :msg",
        ExpressionAttributeNames={"#err": "error", "#msg": "message"},
        ExpressionAttributeValues={":err": True, ":msg": "Test error"}
    )

def test_process_all_execute(mock_dynamodb, tmp_path):
    """Tests the full processing flow."""
    log_file = tmp_path / "failed_candidates.txt"
    log_file.write_text("PK#1\nPK#2\n")
    
    marker = CandidateErrorMarker(dry_run=False)
    success_count, failed_count = marker.process_all(str(log_file), "Batch message")
    
    assert success_count == 2
    assert failed_count == 0
    assert mock_dynamodb.update_item.call_count == 2

def test_process_all_with_error(mock_dynamodb, tmp_path):
    """Tests failure handling during processing."""
    log_file = tmp_path / "failed_candidates.txt"
    log_file.write_text("PK#1\n")
    
    mock_dynamodb.update_item.side_effect = Exception("DynamoDB error")
    
    marker = CandidateErrorMarker(dry_run=False)
    success_count, failed_count = marker.process_all(str(log_file), "Fail message")
    
    assert success_count == 0
    assert failed_count == 1
