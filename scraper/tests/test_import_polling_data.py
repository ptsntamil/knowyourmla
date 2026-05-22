import os
import sys
from unittest.mock import MagicMock, patch
import pytest

# Set up local imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from import_polling_data import PollingDataImporter

@pytest.fixture
def mock_importer():
    """Fixture that creates a PollingDataImporter with mocked DynamoDB tables.

    Returns:
        A PollingDataImporter instance with mock table attributes.
    """
    with patch('boto3.resource'):
        importer = PollingDataImporter(region="ap-south-2")
        importer.polling_table = MagicMock()
        importer.candidates_table = MagicMock()
        importer.constituencies_table = MagicMock()
        return importer

def test_build_station_item_standard(mock_importer):
    """Tests building a station item with valid ps_name and electors.

    Args:
        mock_importer: The mocked PollingDataImporter instance.
    """
    ps_data = {
        "ps": "1",
        "v": {"cand_1": 100, "cand_2": 200},
        "valid": 300,
        "total": 310,
        "nota": 10,
        "rej": 0,
        "ps_name": "Government Elementary School, Room 1",
        "electors": 500
    }
    id_map = {"cand_1": "CANDIDATE#1", "cand_2": "CANDIDATE#2"}
    candidate_totals = {"cand_1": 1000, "cand_2": 2000}

    item = mock_importer._build_station_item(
        ps_data, "PONNERI", "CONSTITUENCY#PONNERI", 2026, id_map, candidate_totals
    )

    assert item is not None

    # Compare subset without dynamic created_at field
    item_subset = {k: v for k, v in item.items() if k != "created_at"}
    expected_subset = {
        "PK": "CONSTITUENCY#PONNERI#YEAR#2026#PS#1",
        "SK": "METADATA",
        "constituency_id": "CONSTITUENCY#PONNERI",
        "polling_station_no": "1",
        "year": 2026,
        "valid_votes": 300,
        "rejected_votes": 0,
        "nota_votes": 10,
        "total_votes_polled": 310,
        "ps_name": "Government Elementary School, Room 1",
        "polling_station_name": "Government Elementary School, Room 1",
        "electors": 500,
        "total_electors": 500,
        "results": {
            "CANDIDATE#1": {
                "votes": 100,
                "vote_share_percentage": 33.33,
                "candidate_contribution_percentage": 10.0
            },
            "CANDIDATE#2": {
                "votes": 200,
                "vote_share_percentage": 66.67,
                "candidate_contribution_percentage": 10.0
            },
            "NOTA": {
                "votes": 10,
                "vote_share_percentage": 3.33
            }
        }
    }
    assert item_subset == expected_subset

@pytest.mark.parametrize(
    "ps_val",
    ["TOTAL_POLLING", "TOTAL", "SUMMARY", "   ", ""]
)
def test_build_station_item_skips(mock_importer, ps_val):
    """Tests that build_station_item returns None for summary/invalid station values.

    Args:
        mock_importer: The mocked PollingDataImporter instance.
        ps_val: The value for the "ps" key in station dictionary.
    """
    ps_data = {"ps": ps_val, "v": {}, "valid": 0, "total": 0, "nota": 0, "rej": 0}
    item = mock_importer._build_station_item(
        ps_data, "PONNERI", "CONSTITUENCY#PONNERI", 2026, {}, {}
    )
    assert item is None

@pytest.mark.parametrize(
    "ps_name_input, expected_name",
    [
        ("  School Name  ", "School Name"),
        (12345, "12345"),
        ("", ""),
        (None, None),
    ]
)
def test_build_station_item_ps_name(mock_importer, ps_name_input, expected_name):
    """Tests build_station_item with various formats of ps_name.

    Args:
        mock_importer: The mocked PollingDataImporter instance.
        ps_name_input: Input value for ps_name.
        expected_name: Expected normalized output for ps_name.
    """
    ps_data = {"ps": "1", "v": {}, "valid": 0, "total": 0, "nota": 0, "rej": 0}
    if ps_name_input is not None:
        ps_data["ps_name"] = ps_name_input

    item = mock_importer._build_station_item(
        ps_data, "PONNERI", "CONSTITUENCY#PONNERI", 2026, {}, {}
    )
    assert item is not None
    if ps_name_input is None:
        assert "ps_name" not in item
        assert "polling_station_name" not in item
    else:
        assert item["ps_name"] == expected_name
        assert item["polling_station_name"] == expected_name

@pytest.mark.parametrize(
    "electors_input, expected_electors, is_valid",
    [
        (500, 500, True),
        (" 600 ", 600, True),
        ("invalid", None, False),
        (None, None, False),
    ]
)
def test_build_station_item_electors(mock_importer, electors_input, expected_electors, is_valid):
    """Tests build_station_item with various formats of electors.

    Args:
        mock_importer: The mocked PollingDataImporter instance.
        electors_input: Input value for electors.
        expected_electors: Expected parsed integer value.
        is_valid: Boolean indicating if the electors input should be parsed successfully.
    """
    ps_data = {"ps": "1", "v": {}, "valid": 0, "total": 0, "nota": 0, "rej": 0}
    if electors_input is not None:
        ps_data["electors"] = electors_input

    item = mock_importer._build_station_item(
        ps_data, "PONNERI", "CONSTITUENCY#PONNERI", 2026, {}, {}
    )
    assert item is not None
    if is_valid:
        assert item["electors"] == expected_electors
        assert item["total_electors"] == expected_electors
    else:
        assert "electors" not in item
        assert "total_electors" not in item
