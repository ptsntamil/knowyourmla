import json
import os
import pytest
from unittest.mock import patch, mock_open
from scraper.scripts.update_affidavit_paths import load_csv_mapping, update_candidates_json


def test_load_csv_mapping():
    """Tests loading CSV mapping from a mock CSV content."""
    csv_content = (
        "db_candidate_pk,db_person_id,birth_year,name,File Location\n"
        "PK_1,P_1,1980,Name 1,path/to/file1.pdf\n"
        "PK_2,P_2,1985,Name 2,path/to/file2.pdf\n"
    )

    with patch("builtins.open", mock_open(read_data=csv_content)):
        with patch("os.path.exists", return_value=True):
            mapping = load_csv_mapping("dummy.csv")

    assert mapping == {
        "PK_1": "path/to/file1.pdf",
        "PK_2": "path/to/file2.pdf"
    }


def test_update_candidates_json_logic():
    """Tests updating candidates JSON data with mapping."""
    candidates_json = [
        {
            "db_candidate_pk": "PK_1",
            "name": "Candidate 1",
            "affidavite_file_location": ""
        },
        {
            "db_candidate_pk": "PK_2",
            "name": "Candidate 2",
            "affidavite_file_location": "existing/path.pdf"
        },
        {
            "db_candidate_pk": "PK_3",
            "name": "Candidate 3",
            "affidavite_file_location": None
        }
    ]
    mapping = {
        "PK_1": "new/path_1.pdf",
        "PK_2": "new/path_2.pdf",
        "PK_3": "new/path_3.pdf"
    }

    with patch("builtins.open", mock_open(read_data=json.dumps(candidates_json))):
        with patch("os.path.exists", return_value=True):
            updated = update_candidates_json("dummy.json", mapping)

    # PK_1 was empty, should be updated
    assert updated[0]["affidavite_file_location"] == "new/path_1.pdf"
    # PK_2 had an existing path, should NOT be updated
    assert updated[1]["affidavite_file_location"] == "existing/path.pdf"
    # PK_3 was None, should be updated
    assert updated[2]["affidavite_file_location"] == "new/path_3.pdf"


@pytest.mark.parametrize("csv_data,expected", [
    ("", {}),
    ("db_candidate_pk,File Location\nPK_1,", {}),
    ("db_candidate_pk,File Location\n,path/to/file1.pdf", {}),
])
def test_load_csv_mapping_edge_cases(csv_data, expected):
    """Tests edge cases for CSV loading."""
    with patch("builtins.open", mock_open(read_data=csv_data)):
        with patch("os.path.exists", return_value=True):
            mapping = load_csv_mapping("dummy.csv")
    assert mapping == expected
