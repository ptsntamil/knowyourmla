import pytest
from unittest.mock import MagicMock
from app.services.election_service import ElectionService
from app.repositories.election_repository import ElectionRepository

def test_list_elections():
    # Mock Repository
    mock_repo = MagicMock(spec=ElectionRepository)
    
    # Mock Election Data
    mock_repo.get_all_elections.return_value = [
        {
            "PK": "ELECTION#2021#ASSEMBLY#GENERAL",
            "SK": "METADATA",
            "year": 2021,
            "type": "Assembly",
            "category": "General"
        },
        {
            "PK": "ELECTION#2019#LOKSABHA#GENERAL",
            "SK": "METADATA",
            "year": 2019,
            "type": "Lok Sabha",
            "category": "General"
        }
    ]
    
    service = ElectionService(repository=mock_repo)
    response = service.list_elections()
    
    assert len(response) == 2
    # Should be sorted by year descending
    assert response[0].year == 2021
    assert response[0].type == "Assembly"
    assert response[1].year == 2019
    assert response[1].type == "Lok Sabha"

def test_get_election():
    # Mock Repository
    mock_repo = MagicMock(spec=ElectionRepository)
    
    # Mock Election Data
    mock_repo.get_election_by_id.return_value = {
        "PK": "ELECTION#2021#ASSEMBLY#GENERAL",
        "SK": "METADATA",
        "year": 2021,
        "type": "Assembly",
        "category": "General"
    }
    
    service = ElectionService(repository=mock_repo)
    response = service.get_election("ELECTION#2021#ASSEMBLY#GENERAL")
    
    assert response is not None
    assert response.year == 2021
    assert response.type == "Assembly"
    assert response.category == "General"

def test_get_election_not_found():
    # Mock Repository
    mock_repo = MagicMock(spec=ElectionRepository)
    mock_repo.get_election_by_id.return_value = None
    
    service = ElectionService(repository=mock_repo)
    response = service.get_election("NON_EXISTENT")
    
    assert response is None
