import os
import sys
from unittest.mock import MagicMock, patch
import pytest

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from check_imported_polling_data import (
    PollingImportChecker,
    _matches_ac,
    _print_section,
    print_cli_report,
)


@pytest.fixture
def mock_dynamodb_table():
    """Fixture providing a mock DynamoDB table."""
    table = MagicMock()
    return table


@pytest.fixture
def checker(mock_dynamodb_table):
    """Fixture providing a PollingImportChecker with mock table."""
    chk = PollingImportChecker(table_name="knowyourmla_polling_results", region="ap-south-2")
    chk.table = mock_dynamodb_table
    return chk


def test_fetch_imported_summaries(checker, mock_dynamodb_table):
    """Test fetching AC summaries with pagination handling."""
    mock_dynamodb_table.scan.side_effect = [
        {
            "Items": [
                {
                    "PK": "CONSTITUENCY#oddanchatram#YEAR#2026",
                    "SK": "AC_SUMMARY",
                    "constituency_id": "CONSTITUENCY#oddanchatram",
                    "year": 2026,
                    "total_valid_votes": 198412,
                    "poll_percentage": 90.76,
                }
            ],
            "LastEvaluatedKey": {"PK": "dummy"},
        },
        {
            "Items": [
                {
                    "PK": "CONSTITUENCY#gummidipoondi#YEAR#2026",
                    "SK": "AC_SUMMARY",
                    "constituency_id": "CONSTITUENCY#gummidipoondi",
                    "year": 2026,
                    "total_valid_votes": 232522,
                    "poll_percentage": 91.5,
                }
            ]
        },
    ]

    summaries = checker.fetch_imported_summaries(year=2026)
    assert len(summaries) == 2
    assert "oddanchatram" in summaries
    assert "gummidipoondi" in summaries
    assert summaries["oddanchatram"]["total_valid_votes"] == 198412


def test_fetch_station_counts(checker, mock_dynamodb_table):
    """Test counting polling stations per constituency."""
    mock_dynamodb_table.scan.return_value = {
        "Items": [
            {"constituency_id": "CONSTITUENCY#oddanchatram"},
            {"constituency_id": "CONSTITUENCY#oddanchatram"},
            {"constituency_id": "CONSTITUENCY#gummidipoondi"},
        ]
    }

    counts = checker.fetch_station_counts(year=2026)
    assert counts.get("oddanchatram") == 2
    assert counts.get("gummidipoondi") == 1


def test_load_master_constituencies_file_not_found(checker, tmp_path):
    """Test loading master constituencies when CSV is missing."""
    res = checker.load_master_constituencies(csv_path=str(tmp_path / "nonexistent.csv"))
    assert res == {}


def test_load_master_constituencies_valid(checker, tmp_path):
    """Test loading master constituencies from CSV."""
    csv_file = tmp_path / "test_election.csv"
    csv_file.write_text(
        "Constituency_No,Constituency_Name,District_Name\n"
        "1,GUMMIDIPOONDI,THIRUVALLUR\n"
        "2,PONNERI,THIRUVALLUR\n"
    )
    res = checker.load_master_constituencies(csv_path=str(csv_file))
    assert len(res) == 2
    assert res[1]["name"] == "GUMMIDIPOONDI"
    assert res[2]["district"] == "THIRUVALLUR"


def test_load_local_json_files(checker, tmp_path):
    """Test finding local extracted Form 20 JSON files."""
    (tmp_path / "001.json").write_text("{}")
    (tmp_path / "002.json").write_text("{}")
    (tmp_path / "ignore_me.txt").write_text("text")

    res = checker.load_local_json_files(polling_dir=str(tmp_path))
    assert len(res) == 2
    assert 1 in res
    assert 2 in res


def test_analyze_status(checker, monkeypatch):
    """Test analyze_status categorization."""
    monkeypatch.setattr(
        checker,
        "load_master_constituencies",
        lambda: {
            1: {"name": "GUMMIDIPOONDI", "district": "THIRUVALLUR", "canonical_id": "gummidipoondi"},
            2: {"name": "PONNERI", "district": "THIRUVALLUR", "canonical_id": "ponneri"},
            3: {"name": "TIRUTTANI", "district": "THIRUVALLUR", "canonical_id": "tiruttani"},
        },
    )
    monkeypatch.setattr(checker, "load_local_json_files", lambda: {1: "path/001.json", 2: "path/002.json"})
    monkeypatch.setattr(
        checker,
        "fetch_imported_summaries",
        lambda year: {
            "gummidipoondi": {"poll_percentage": 91.5, "total_valid_votes": 232522}
        },
    )
    monkeypatch.setattr(checker, "fetch_station_counts", lambda year: {"gummidipoondi": 250})

    status = checker.analyze_status(year=2026, count_stations=True)
    assert status["total_constituencies"] == 3
    assert status["imported_count"] == 1
    assert status["pending_import_count"] == 1
    assert status["missing_count"] == 1

    imported_ac = status["imported"][0]
    assert imported_ac["name"] == "GUMMIDIPOONDI"
    assert imported_ac["station_count"] == 250

    pending_ac = status["pending_import"][0]
    assert pending_ac["name"] == "PONNERI"

    missing_ac = status["missing"][0]
    assert missing_ac["name"] == "TIRUTTANI"


@pytest.mark.parametrize(
    "query, expected",
    [
        (None, True),
        ("", True),
        ("1", True),
        ("2", False),
        ("gummi", True),
        ("ponneri", False),
    ],
)
def test_matches_ac(query, expected):
    """Test AC matching logic."""
    row = {"ac_no": 1, "name": "GUMMIDIPOONDI", "canonical_id": "gummidipoondi"}
    assert _matches_ac(row, query) is expected


def test_cli_printing(capsys):
    """Test CLI formatting output without throwing exceptions."""
    report = {
        "year": 2026,
        "total_constituencies": 3,
        "imported_count": 1,
        "pending_import_count": 1,
        "missing_count": 1,
        "imported": [
            {
                "ac_no": 1,
                "name": "GUMMIDIPOONDI",
                "district": "THIRUVALLUR",
                "canonical_id": "gummidipoondi",
                "turnout_pct": 91.5,
                "valid_votes": 232522,
                "station_count": 250,
            }
        ],
        "pending_import": [
            {
                "ac_no": 2,
                "name": "PONNERI",
                "district": "THIRUVALLUR",
                "canonical_id": "ponneri",
                "local_file": "002.json",
            }
        ],
        "missing": [
            {
                "ac_no": 3,
                "name": "TIRUTTANI",
                "district": "THIRUVALLUR",
                "canonical_id": "tiruttani",
            }
        ],
    }

    print_cli_report(report)
    captured = capsys.readouterr()
    assert "KNOWYOURMLA POLLING DATA IMPORT STATUS" in captured.out
    assert "GUMMIDIPOONDI" in captured.out
    assert "PONNERI" in captured.out
    assert "TIRUTTANI" in captured.out
