import pytest
from unittest.mock import MagicMock, patch
from scraper.enrichment import EnrichmentPipeline, AffidavitData

@pytest.fixture
def pipeline():
    with patch('boto3.resource') as mock_resource:
        mock_db = MagicMock()
        mock_resource.return_value = mock_db
        p = EnrichmentPipeline()
        # Mock dependencies
        p.candidates_table = MagicMock()
        p.resolver = MagicMock()
        return p

def test_find_person_id_by_group_id_success(pipeline):
    # Setup
    group_id = "12345"
    current_slug = "tn2021"
    
    # Mock _discover_historical_links to return some historical candidates
    pipeline._discover_historical_links = MagicMock(return_value=[
        {"candidate_id": "101", "year_slug": "tn2016"},
        {"candidate_id": "102", "year_slug": "tn2011"}
    ])
    
    # Mock candidates_table.get_item to return a person_id for the first historical candidate
    def mock_get_item(Key, ProjectionExpression=None):
        if Key["PK"] == "AFFIDAVIT#2016#101":
            return {"Item": {"person_id": "PERSON#stalin"}}
        return {}
        
    pipeline.candidates_table.get_item.side_effect = mock_get_item
    
    # Execute
    result = pipeline._find_person_id_by_group_id(group_id, current_slug)
    
    # Assert
    assert result == "PERSON#stalin"
    pipeline.candidates_table.get_item.assert_called_with(
        Key={"PK": "AFFIDAVIT#2016#101", "SK": "DETAILS"},
        ProjectionExpression="person_id"
    )

def test_find_person_id_by_group_id_no_match(pipeline):
    # Setup
    group_id = "12345"
    current_slug = "tn2021"
    
    pipeline._discover_historical_links = MagicMock(return_value=[
        {"candidate_id": "101", "year_slug": "tn2016"}
    ])
    
    pipeline.candidates_table.get_item.return_value = {} # No item found
    
    # Execute
    result = pipeline._find_person_id_by_group_id(group_id, current_slug)
    
    # Assert
    assert result is None

def test_process_candidate_uses_group_lookup(pipeline):
    # Setup
    cid = 123
    year = "2021"
    slug = "tn2021"
    
    details = AffidavitData(group_id="555")
    pipeline._get_candidate_details = MagicMock(return_value=details)
    pipeline.candidates_table.get_item.return_value = {} # New candidate
    
    # Mock group lookup to succeed
    pipeline._find_person_id_by_group_id = MagicMock(return_value="PERSON#existing")
    
    # Mock resolver to just return what it gets as override
    pipeline.resolver.get_or_create_person = MagicMock(return_value="PERSON#existing")
    
    # Mock recursion and save methods to prevent actual DB calls
    pipeline._save_new_candidate = MagicMock()
    pipeline._discover_and_recurse = MagicMock()
    
    # Execute
    pipeline.process_candidate(cid, year, slug)
    
    # Assert
    pipeline._find_person_id_by_group_id.assert_called_once_with("555", slug)
    # Even though it was found, get_or_create_person should be called with it as override
    pipeline.resolver.get_or_create_person.assert_called_once_with(details, year, cid, person_id_override="PERSON#existing")
    pipeline._save_new_candidate.assert_called_once()
    args = pipeline._save_new_candidate.call_args[0]
    assert args[5] == "PERSON#existing" # person_id argument

def test_process_candidate_handles_none_details(pipeline):
    # Setup: details is None, but existing has group_id
    cid = 123
    year = "2021"
    slug = "tn2021"
    
    pipeline._get_candidate_details = MagicMock(return_value=None)
    pipeline.candidates_table.get_item.return_value = {
        "Item": {"PK": f"AFFIDAVIT#{year}#{cid}", "SK": "DETAILS", "group_id": "777", "person_id": "PERSON#old"}
    }
    
    # Mock person resolver to just return what it's given
    pipeline.resolver.get_or_create_person = MagicMock(return_value="PERSON#old")
    pipeline._update_candidate_history = MagicMock()
    pipeline._discover_and_recurse = MagicMock()
    
    # Execute
    pipeline.process_candidate(cid, year, slug)
    
    # Assert - should not crash, should use group_id from existing
    # Note: person_id is already "PERSON#old" from existing, so it won't call _find_person_id_by_group_id
    # but it would if person_id was missing.
    # The key is that it doesn't crash on line 189.
    pipeline.resolver.get_or_create_person.assert_not_called() # No details, so no call to ensure person (by my current logic)
    # Wait, in the new code:
    # if details: person_id = self.resolver.get_or_create_person(...)
    # So if details is None, it won't call it.
