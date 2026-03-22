import pytest
from unittest.mock import MagicMock
from app.services.mla_service import MLAService
from app.repositories.person_repository import PersonRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.mla_repository import MLARepository
from app.repositories.constituency_repository import ConstituencyRepository
from app.repositories.party_repository import PartyRepository

def test_mla_profile_history_sorting():
    # Mock Repositories
    mock_person_repo = MagicMock(spec=PersonRepository)
    mock_candidate_repo = MagicMock(spec=CandidateRepository)
    mock_mla_repo = MagicMock(spec=MLARepository)
    mock_const_repo = MagicMock(spec=ConstituencyRepository)
    mock_party_repo = MagicMock(spec=PartyRepository)

    # Mock Person Data
    mock_person_repo.get_person_by_id.return_value = None
    mock_person_repo.get_person_by_normalized_name.return_value = {
        "PK": "PERSON#ramachandrankkssr",
        "name": "K.K.S.S.R. RAMACHANDRAN",
        "normalized_name": "kkssrramachandran"
    }

    # Mock Candidate History (Unsorted)
    mock_candidate_repo.get_person_history.return_value = [
        {
            "year": 2006,
            "constituency_id": "CONSTITUENCY#sattur",
            "party_id": "PARTY#dmk",
            "is_winner": False,
            "total_assets": 1000000
        },
        {
            "year": 2021,
            "constituency_id": "CONSTITUENCY#aruppukottai",
            "party_id": "PARTY#dmk",
            "is_winner": True,
            "winning_margin": 39034,
            "total_assets": 5000000
        },
        {
            "year": 2016,
            "constituency_id": "CONSTITUENCY#aruppukottai",
            "party_id": "PARTY#dmk",
            "is_winner": True,
            "winning_margin": 18054,
            "total_assets": 3000000
        }
    ]

    # Mock Party Data
    mock_party_repo.get_all_parties.return_value = [
        {"PK": "PARTY#dmk", "short_name": "DMK", "logo_url": "http://example.com/dmk.png"}
    ]

    service = MLAService(
        person_repo=mock_person_repo,
        party_repo=mock_party_repo,
        candidate_repo=mock_candidate_repo,
        mla_repo=mock_mla_repo,
        constituency_repo=mock_const_repo
    )

    response = service.get_mla_profile("kkssrramachandran")

    # Verify History Sorting (Year Descending)
    assert response.history[0].year == 2021
    assert response.history[0].constituency == "Aruppukottai"
    assert response.history[0].party_logo_url == "http://example.com/dmk.png"
    assert response.history[1].year == 2016
    assert response.history[2].year == 2006
    assert response.history[2].constituency == "Sattur"

    # Verify Analytics (Year Ascending for growth calculations)
    assert response.analytics.asset_growth[0].year == 2006
    assert response.analytics.asset_growth[2].year == 2021

def test_mla_profile_hex_id_lookup():
    # Mock Repositories
    mock_person_repo = MagicMock(spec=PersonRepository)
    mock_candidate_repo = MagicMock(spec=CandidateRepository)
    mock_mla_repo = MagicMock(spec=MLARepository)
    mock_const_repo = MagicMock(spec=ConstituencyRepository)
    mock_party_repo = MagicMock(spec=PartyRepository)

    hex_id = "f752a88769d3921219292797f6cf833e"
    full_id = f"PERSON#{hex_id}"

    # Mock Person Data
    mock_person_repo.get_person_by_id.return_value = {
        "PK": full_id,
        "name": "TEST MLA",
        "normalized_name": "testmla"
    }

    mock_party_repo.get_all_parties.return_value = []
    
    service = MLAService(
        person_repo=mock_person_repo,
        party_repo=mock_party_repo,
        candidate_repo=mock_candidate_repo,
        mla_repo=mock_mla_repo,
        constituency_repo=mock_const_repo
    )

    # Fetch using raw hex ID
    response = service.get_mla_profile(hex_id)

    # Verify repository was called with the prefixed ID
    mock_person_repo.get_person_by_id.assert_called_with(full_id)
    assert response.person.name == "TEST MLA"
    assert response.person.person_id == full_id

def test_mla_profile_margin_filtering():
    # Mock Repositories
    mock_person_repo = MagicMock(spec=PersonRepository)
    mock_candidate_repo = MagicMock(spec=CandidateRepository)
    mock_mla_repo = MagicMock(spec=MLARepository)
    mock_const_repo = MagicMock(spec=ConstituencyRepository)
    mock_party_repo = MagicMock(spec=PartyRepository)

    # Mock Person Data
    mock_person_repo.get_person_by_id.return_value = None
    mock_person_repo.get_person_by_normalized_name.return_value = {
        "PK": "PERSON#lostcandidate",
        "name": "LOST CANDIDATE",
        "normalized_name": "lostcandidate"
    }

    # Mock Candidate History (One Win, One Loss)
    # Even if "winning_margin" is present in the record for a loss, it should be filtered out
    mock_candidate_repo.get_person_history.return_value = [
        {
            "year": 2016,
            "constituency_id": "CONSTITUENCY#test1",
            "party_id": "PARTY#bjp",
            "is_winner": False,
            "winning_margin": 5000,
            "margin_percentage": 2.5
        },
        {
            "year": 2021,
            "constituency_id": "CONSTITUENCY#test2",
            "party_id": "PARTY#bjp",
            "is_winner": True,
            "winning_margin": 10000,
            "margin_percentage": 5.0
        }
    ]

    # Mock Party Data
    mock_party_repo.get_all_parties.return_value = [
        {"PK": "PARTY#BJP", "short_name": "BJP", "logo_url": "http://example.com/bjp.png"}
    ]

    service = MLAService(
        person_repo=mock_person_repo,
        candidate_repo=mock_candidate_repo,
        mla_repo=mock_mla_repo,
        constituency_repo=mock_const_repo,
        party_repo=mock_party_repo
    )

    response = service.get_mla_profile("lostcandidate")

    # Verify History (Year Descending)
    # 2021 was a WIN
    assert response.history[0].year == 2021
    assert response.history[0].winner is True
    assert response.history[0].margin == 10000
    assert response.history[0].margin_percent == 5.0
    assert response.history[0].party_logo_url == "http://example.com/bjp.png"

    # 2016 was a LOSS - margin should be None
    assert response.history[1].year == 2016
    assert response.history[1].winner is False
    assert response.history[1].margin is None
    assert response.history[1].margin_percent is None

    # Verify Margin Trend (Year Ascending)
    # Only 2021 should be present in margin_trend
    assert len(response.analytics.margin_trend) == 1
    assert response.analytics.margin_trend[0].year == 2021
    assert response.analytics.margin_trend[0].margin == 10000
