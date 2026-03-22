import pytest
from unittest.mock import MagicMock, patch, mock_open
from decimal import Decimal
from scraper.enrich_vote_stats import VoteStatsEnricher, clean_int, clean_percentage

def test_clean_int():
    assert clean_int("363,029") == 363029
    assert clean_int("40571") == 40571
    assert clean_int("") == 0
    assert clean_int(None) == 0

def test_clean_percentage():
    assert clean_percentage("65.0 %") == Decimal("65.0")
    assert clean_percentage("17.2%") == Decimal("17.2")
    assert clean_percentage("") == Decimal("0.0")
    assert clean_percentage(None) == Decimal("0.0")

@patch('boto3.resource')
def test_get_constituency_pk(mock_resource):
    mock_table = MagicMock()
    mock_resource.return_value.Table.return_value = mock_table
    
    enricher = VoteStatsEnricher()
    
    # Case 1: Match found
    mock_table.get_item.return_value = {
        'Item': {'PK': 'CONSTITUENCY#alandur', 'district_id': 'DISTRICT#kancheepuram'}
    }
    pk = enricher.get_constituency_pk("Alandur", "Kancheepuram")
    assert pk == "CONSTITUENCY#alandur"

@patch('boto3.resource')
def test_get_winner_pk(mock_resource):
    mock_table = MagicMock()
    mock_resource.return_value.Table.return_value = mock_table
    
    enricher = VoteStatsEnricher()
    
    # Case 1: Exact match via name similarity
    mock_table.query.return_value = {
        'Items': [
            {'PK': 'AFFIDAVIT#2021#123', 'candidate_name': 'T.M. Anbarasan', 'is_winner': True}
        ]
    }
    pk = enricher.get_winner_pk("CONSTITUENCY#ALANDUR", "T.M.Anbarasan", 2021)
    assert pk == "AFFIDAVIT#2021#123"

@patch('boto3.resource')
def test_update_constituency(mock_resource):
    mock_table = MagicMock()
    # Table names are set in __init__, so we need to handle both
    mock_resource.return_value.Table.side_effect = lambda name: mock_table
    
    enricher = VoteStatsEnricher()
    stats = {"total_electors": 100, "total_votes_polled": 80, "poll_percentage": Decimal("80.0")}
    
    # Dry run
    enricher.update_constituency("CONSTITUENCY#X", 2021, stats, dry_run=True)
    mock_table.update_item.assert_not_called()
    
    # Execute
    enricher.update_constituency("CONSTITUENCY#X", 2021, stats, dry_run=False)
    assert mock_table.update_item.call_count == 2 # One for initialization, one for update

@patch('boto3.resource')
def test_update_candidate(mock_resource):
    mock_table = MagicMock()
    mock_resource.return_value.Table.side_effect = lambda name: mock_table
    
    enricher = VoteStatsEnricher()
    stats = {"winning_margin": 1000, "margin_percentage": Decimal("5.0")}
    
    # Dry run
    enricher.update_candidate("AFFIDAVIT#2021#123", stats, dry_run=True)
    mock_table.update_item.assert_not_called()
    
    # Execute
    enricher.update_candidate("AFFIDAVIT#2021#123", stats, dry_run=False)
    mock_table.update_item.assert_called_once()

@patch('boto3.resource')
@patch('os.path.exists', return_value=True)
@patch('builtins.open', new_callable=mock_open, read_data="AC Name,District,Winning Candidate,Total Electors,Total Votes,Poll%,Margin,Margin %\nAlandur,Kancheepuram,T.M.Anbarasan,363029,235863,65.0 %,40571,17.2%\n")
def test_enrich_from_csv(mock_file, mock_exists, mock_resource):
    mock_table = MagicMock()
    mock_resource.return_value.Table.side_effect = lambda name: mock_table
    
    enricher = VoteStatsEnricher()
    
    # Mocking internal methods to isolation verification of loop
    with patch.object(enricher, 'get_constituency_pk', return_value="CONSTITUENCY#ALANDUR") as mock_get_cpk:
        with patch.object(enricher, 'get_winner_pk', return_value="AFFIDAVIT#2021#123") as mock_get_wpk:
            with patch.object(enricher, 'update_constituency') as mock_upd_c:
                with patch.object(enricher, 'update_candidate') as mock_upd_ca:
                    enricher.enrich_from_csv("dummy.csv", 2021, dry_run=False)
                    
                    mock_get_cpk.assert_called_once()
                    mock_get_wpk.assert_called_once()
                    mock_upd_c.assert_called_once()
                    mock_upd_ca.assert_called_once()
