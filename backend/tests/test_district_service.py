import pytest
from unittest.mock import MagicMock
from app.services.district_service import DistrictService
from app.repositories.district_repository import DistrictRepository
from app.repositories.constituency_repository import ConstituencyRepository

def test_get_district_details_aggregation():
    # Mock Repositories
    mock_district_repo = MagicMock(spec=DistrictRepository)
    mock_constituency_repo = MagicMock(spec=ConstituencyRepository)
    
    mock_district_repo.get_district_by_id.return_value = {
        "PK": "DISTRICT#chennai",
        "name": "CHENNAI"
    }
    
    # Mock Constituencies with statistics
    mock_constituency_repo.get_constituencies_by_district.return_value = [
        {
            "PK": "CONSTITUENCY#kolathur",
            "statistics": {
                "2026": {
                    "total_electors": 1000,
                    "male": 500,
                    "female": 490,
                    "third_gender": 10
                }
            }
        },
        {
            "PK": "CONSTITUENCY#villivakkam",
            "statistics": {
                "2026": {
                    "total_electors": 2000,
                    "male": 1000,
                    "female": 995,
                    "third_gender": 5
                },
                "2021": {
                    "total_electors": 1800,
                    "total_votes_polled": 1500,
                    "poll_percentage": 83.3
                }
            }
        }
    ]
    
    service = DistrictService(repository=mock_district_repo, constituency_repo=mock_constituency_repo)
    response = service.get_district_details("DISTRICT#chennai")
    
    assert response.id == "DISTRICT#chennai"
    assert response.name == "CHENNAI"
    assert len(response.stats) == 2
    
    # 2026 aggregated stats
    stats_2026 = next(s for s in response.stats if s.year == 2026)
    assert stats_2026.total_electors == 3000
    assert stats_2026.male == 1500
    assert stats_2026.female == 1485
    assert stats_2026.third_gender == 15
    
    # 2021 aggregated stats (only 1 constituency has it)
    stats_2021 = next(s for s in response.stats if s.year == 2021)
    assert stats_2021.total_electors == 1800
    assert stats_2021.male is None
    assert stats_2021.female is None
