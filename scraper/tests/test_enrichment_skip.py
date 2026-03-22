import pytest
from unittest.mock import MagicMock, patch
from scraper.enrichment import EnrichmentPipeline

@pytest.fixture
def mock_pipeline():
    """Fixture to mock EnrichmentPipeline dependencies."""
    with patch('boto3.resource') as mock_resource:
        pipeline = EnrichmentPipeline()
        # Mock tables
        pipeline.candidates_table = MagicMock()
        pipeline.winners_table = MagicMock()
        pipeline.parser.extract_affidavit_details = MagicMock()
        yield pipeline

def test_process_candidate_skips_on_error(mock_pipeline):
    """Tests that process_candidate returns early if candidate has error=True."""
    cid = 123
    year = "2021"
    year_slug = "TamilNadu2021"
    
    # Mock DynamoDB response with error=True
    mock_pipeline.candidates_table.get_item.return_value = {
        "Item": {
            "PK": f"AFFIDAVIT#{year}#{cid}",
            "SK": "DETAILS",
            "error": True,
            "message": "loksabha election url mismatch"
        }
    }
    
    # Run process_candidate
    mock_pipeline.process_candidate(cid, year, year_slug)
    
    # Verify extract_affidavit_details was NOT called
    mock_pipeline.parser.extract_affidavit_details.assert_not_called()
    # Verify get_item was called
    mock_pipeline.candidates_table.get_item.assert_called_once()

def test_process_candidate_continues_on_no_error(mock_pipeline):
    """Tests that process_candidate continues if candidate has no error or error=False."""
    cid = 456
    year = "2021"
    year_slug = "TamilNadu2021"
    
    # Case 1: Item exists but error is False
    mock_pipeline.candidates_table.get_item.return_value = {
        "Item": {
            "PK": f"AFFIDAVIT#{year}#{cid}",
            "SK": "DETAILS",
            "error": False,
            "person_id": "PERSON#1",
            "other_elections_summary": [{"candidate_id": "1", "year_slug": "2"}, {"candidate_id": "3", "year_slug": "4"}],
            "group_id": "GRP1"
        }
    }
    
    mock_pipeline.process_candidate(cid, year, year_slug)
    
    # Should NOT extract since history/group_id exists, but should NOT return early either
    mock_pipeline.parser.extract_affidavit_details.assert_not_called()

def test_process_candidate_continues_on_missing_item(mock_pipeline):
    """Tests that process_candidate continues if candidate is not in DB yet."""
    cid = 789
    year = "2021"
    year_slug = "TamilNadu2021"
    
    # Mock DynamoDB response: Item not found
    mock_pipeline.candidates_table.get_item.return_value = {}
    
    # Mock extract_affidavit_details to return None to avoid further logic
    mock_pipeline.parser.extract_affidavit_details.return_value = None
    
    mock_pipeline.process_candidate(cid, year, year_slug)
    
    # extract_affidavit_details SHOULD be called
    mock_pipeline.parser.extract_affidavit_details.assert_called_once()
