import pytest
from unittest.mock import MagicMock
from app.services.constituency_service import ConstituencyService
from app.repositories.constituency_repository import ConstituencyRepository
from app.repositories.person_repository import PersonRepository
from app.models.constituency import WinnerHistoryRecord

def test_get_winner_history_with_slugs():
    # Mock Repositories
    mock_const_repo = MagicMock(spec=ConstituencyRepository)
    mock_person_repo = MagicMock(spec=PersonRepository)
    
    # Mock Constituency History
    mock_const_repo.get_winner_history.return_value = [
        {
            "year": 2021,
            "candidate_name": "STALIN M K",
            "party_id": "PARTY#dmk",
            "person_id": "PERSON#mkstalin",
            "winning_margin": "50,000",
            "profile_pic": "old_pic.jpg"
        }
    ]
    
    # Mock Person metadata
    mock_person_repo.get_persons_by_ids.return_value = [
        {
            "PK": "PERSON#mkstalin",
            "SK": "METADATA",
            "name": "M.K. STALIN",
            "image_url": "new_pic.jpg"
        }
    ]
    
    mock_const_repo.get_party_by_id.return_value = {"PK": "PARTY#dmk", "name": "DMK"}
    mock_const_repo.get_constituency_metadata.return_value = {"statistics": {}}
    
    service = ConstituencyService(repository=mock_const_repo, person_repo=mock_person_repo)
    response = service.get_winner_history("CONSTITUENCY#kolathur")
    
    assert response.constituency == "kolathur"
    assert len(response.history) == 1
    record = response.history[0]
    
    # Should use canonical name from Person record
    assert record.winner == "M.K. STALIN"
    # Should generate slug from canonical name
    assert record.slug == "mk-stalin"
    assert record.person_id == "PERSON#mkstalin"
    assert record.profile_pic == "new_pic.jpg"

def test_get_winner_history_fallback():
    # Verify fallback if person record is missing
    mock_const_repo = MagicMock(spec=ConstituencyRepository)
    mock_person_repo = MagicMock(spec=PersonRepository)
    
    mock_const_repo.get_winner_history.return_value = [
        {
            "year": 2021,
            "candidate_name": "CANDIDATE NAME",
            "party_id": "PARTY#ind",
            "person_id": "PERSON#unknown",
            "winning_margin": "100"
        }
    ]
    mock_person_repo.get_persons_by_ids.return_value = []
    mock_const_repo.get_party_by_id.return_value = {"PK": "PARTY#ind", "name": "Independent"}
    mock_const_repo.get_constituency_metadata.return_value = {"statistics": {}}
    
    service = ConstituencyService(repository=mock_const_repo, person_repo=mock_person_repo)
    response = service.get_winner_history("CONSTITUENCY#test")
    
    record = response.history[0]
    assert record.winner == "CANDIDATE NAME"
    assert record.slug == "candidate-name"

def test_get_winner_history_with_gender_stats():
    # Verify gender statistics are correctly populated
    mock_const_repo = MagicMock(spec=ConstituencyRepository)
    mock_person_repo = MagicMock(spec=PersonRepository)
    
    mock_const_repo.get_winner_history.return_value = []
    mock_person_repo.get_persons_by_ids.return_value = []
    
    mock_const_repo.get_constituency_metadata.return_value = {
        "statistics": {
            "2026": {
                "total_electors": 300000,
                "total_votes_polled": 250000,
                "poll_percentage": 83.33,
                "male": 145000,
                "female": 154950,
                "third_gender": 50
            },
            "2021": {
                "total_electors": 280000,
                "total_votes_polled": 210000,
                "poll_percentage": 75.0
            }
        }
    }
    
    service = ConstituencyService(repository=mock_const_repo, person_repo=mock_person_repo)
    response = service.get_winner_history("CONSTITUENCY#kolathur")
    
    assert len(response.stats) == 2
    # Stats should be sorted by year descending
    latest = response.stats[0]
    assert latest.year == 2026
    assert latest.total_electors == 300000
    assert latest.male == 145000
    assert latest.female == 154950
    assert latest.third_gender == 50
    
    prev = response.stats[1]
    assert prev.year == 2021
    assert prev.male is None
    assert prev.female is None
