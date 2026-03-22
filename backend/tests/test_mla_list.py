import pytest
from unittest.mock import MagicMock
from app.services.mla_service import MLAService
from app.repositories.mla_repository import MLARepository
from app.repositories.constituency_repository import ConstituencyRepository
from app.repositories.party_repository import PartyRepository
from app.models.mla import MLAListResponse

def test_get_current_mlas_with_slugs():
    # Mock Repositories
    mock_mla_repo = MagicMock(spec=MLARepository)
    mock_const_repo = MagicMock(spec=ConstituencyRepository)
    from app.repositories.person_repository import PersonRepository
    mock_person_repo = MagicMock(spec=PersonRepository)
    mock_party_repo = MagicMock(spec=PartyRepository)
    
    mock_const_repo.get_all_constituencies.return_value = [
        {"PK": "CONSTITUENCY#kolathur", "name": "Kolathur", "SK": "METADATA"}
    ]
    
    # Candidate record has old/different name
    mock_mla_repo.get_winners_by_year.return_value = [
        {
            "PK": "AFFIDAVIT#2021#T#1",
            "candidate_name": "STALIN M K",
            "party_id": "PARTY#DMK",
            "constituency_id": "CONSTITUENCY#kolathur",
            "person_id": "PERSON#mkstalin",
            "year": 2021,
            "is_winner": True
        }
    ]

    # Person record has the canonical name we want
    mock_person_repo.get_persons_by_ids.return_value = [
        {
            "PK": "PERSON#mkstalin",
            "SK": "METADATA",
            "name": "M.K. STALIN"
        }
    ]
    
    # Mock Party data
    mock_party_repo.get_all_parties.return_value = [
        {"PK": "PARTY#DMK", "short_name": "DMK", "logo_url": "http://example.com/dmk.png"}
    ]
    
    service = MLAService(mla_repo=mock_mla_repo, constituency_repo=mock_const_repo, person_repo=mock_person_repo, party_repo=mock_party_repo)
    response = service.get_current_mlas(year=2021)
    
    assert response.total == 1
    # Should use the name from the person record
    assert response.mlas[0].slug == "mk-stalin"
    assert response.mlas[0].name == "M.K. STALIN"
    assert response.mlas[0].party_logo_url == "http://example.com/dmk.png"

def test_get_current_mlas_fallback():
    # Verify fallback if person record is missing
    mock_mla_repo = MagicMock(spec=MLARepository)
    mock_const_repo = MagicMock(spec=ConstituencyRepository)
    from app.repositories.person_repository import PersonRepository
    mock_person_repo = MagicMock(spec=PersonRepository)
    
    mock_const_repo.get_all_constituencies.return_value = [
        {"PK": "CONSTITUENCY#test", "name": "Test", "SK": "METADATA"}
    ]
    mock_mla_repo.get_winners_by_year.return_value = [
        {
            "candidate_name": "CANDIDATE NAME",
            "constituency_id": "CONSTITUENCY#test",
            "person_id": "PERSON#unknown",
            "is_winner": True
        }
    ]
    mock_person_repo.get_persons_by_ids.return_value = []
    mock_party_repo = MagicMock(spec=PartyRepository)
    mock_party_repo.get_all_parties.return_value = []
    
    service = MLAService(mla_repo=mock_mla_repo, constituency_repo=mock_const_repo, person_repo=mock_person_repo, party_repo=mock_party_repo)
    response = service.get_current_mlas(year=2021)
    
    assert response.mlas[0].name == "CANDIDATE NAME"
    assert response.mlas[0].slug == "candidate-name"
    
def test_slugify():
    service = MLAService()
    assert service._slugify("M.K. STALIN") == "mk-stalin"
    assert service._slugify("O. Panneerselvam") == "o-panneerselvam"
    assert service._slugify("Dr. Anbumani Ramadoss") == "dr-anbumani-ramadoss"
    assert service._slugify("") == ""

def test_get_current_mlas_bye_election():
    # Mock Repositories
    mock_mla_repo = MagicMock(spec=MLARepository)
    mock_const_repo = MagicMock(spec=ConstituencyRepository)
    from app.repositories.person_repository import PersonRepository
    mock_person_repo = MagicMock(spec=PersonRepository)
    mock_party_repo = MagicMock(spec=PartyRepository)
    
    mock_const_repo.get_all_constituencies.return_value = [
        {"PK": "CONSTITUENCY#erode-east", "name": "Erode East", "SK": "METADATA"}
    ]
    
    # Simulate two winners: 2021 and 2025 bye-election
    mock_mla_repo.get_winners_by_year_range.return_value = [
        {
            "candidate_name": "Original Winner",
            "party_id": "PARTY#INC",
            "constituency_id": "CONSTITUENCY#erode-east",
            "person_id": "PERSON#original",
            "year": 2021,
            "is_winner": True
        },
        {
            "candidate_name": "Bye-Election Winner",
            "party_id": "PARTY#DMK",
            "constituency_id": "CONSTITUENCY#erode-east",
            "person_id": "PERSON#bye-election",
            "year": 2025,
            "is_winner": True
        }
    ]

    mock_person_repo.get_persons_by_ids.return_value = [
        {"PK": "PERSON#original", "name": "Original Winner"},
        {"PK": "PERSON#bye-election", "name": "Bye-Election Winner"}
    ]
    
    mock_party_repo.get_all_parties.return_value = []
    
    service = MLAService(mla_repo=mock_mla_repo, constituency_repo=mock_const_repo, person_repo=mock_person_repo, party_repo=mock_party_repo)
    response = service.get_current_mlas(year=2021)
    
    assert response.total == 1
    # Should pick the 2025 winner
    assert response.mlas[0].name == "Bye-Election Winner"
    assert response.mlas[0].person_id == "PERSON#bye-election"
