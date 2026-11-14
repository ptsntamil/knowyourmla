import os
import csv
import pytest
from bs4 import BeautifulSoup
from unittest.mock import patch, mock_open

from scraper.extract_bye_election_results import (
    clean_int,
    clean_float,
    parse_election_date,
    extract_page_title_info,
    extract_table_results,
    calculate_metrics,
    calculate_margin,
    build_opencity_row,
    process_constituency_page,
    write_opencity_csv,
    load_constituency_metadata_fallback,
    load_candidate_demographics_fallback
)
from scraper.helper.opencity_constants import OPENCITY_HEADERS


SAMPLE_HTML_MADURANTAKAM = """
<!doctype html>
<html>
<body>
  <div class='page-title'>
    <h1><div>Bye Election to Assembly Constituencies: Results October-2026</div></h1>
    <h2>Assembly Constituency <span>35 - MADURANTAKAM<strong> (Tamil Nadu)</strong></span></h2>
  </div>
  <table>
    <tbody>
      <tr>
        <td>1</td>
        <td>K.MARAGATHAM KUMARAVEL</td>
        <td>Tamilaga Vettri Kazhagam</td>
        <td>73911</td>
        <td>137</td>
        <td>74048</td>
        <td>39.96</td>
      </tr>
      <tr>
        <td>2</td>
        <td>I.PARANTHAMEN</td>
        <td>Dravida Munnetra Kazhagam</td>
        <td>53650</td>
        <td>358</td>
        <td>54008</td>
        <td>29.15</td>
      </tr>
      <tr>
        <td>3</td>
        <td>NOTA</td>
        <td>None of the Above</td>
        <td>652</td>
        <td>0</td>
        <td>652</td>
        <td>0.35</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
"""


@pytest.mark.parametrize("input_val,expected", [
    ("74,048", 74048),
    ("137", 137),
    (100, 100),
    ("", 0),
    (None, 0),
    ("invalid", 0)
])
def test_clean_int(input_val, expected):
    assert clean_int(input_val) == expected


@pytest.mark.parametrize("input_val,expected", [
    ("39.96 %", 39.96),
    ("29.15", 29.15),
    ("1,234.56", 1234.56),
    ("", 0.0),
    (None, 0.0),
    ("invalid", 0.0)
])
def test_clean_float(input_val, expected):
    assert clean_float(input_val) == expected


@pytest.mark.parametrize("date_str,expected", [
    ("2026/10/6", (2026, 10, 6)),
    ("2026-10-06", (2026, 10, 6)),
    (" 2026/10/06 ", (2026, 10, 6))
])
def test_parse_election_date_valid(date_str, expected):
    assert parse_election_date(date_str) == expected


def test_parse_election_date_invalid():
    with pytest.raises(ValueError):
        parse_election_date("2026-10")


def test_extract_page_title_info():
    soup = BeautifulSoup(SAMPLE_HTML_MADURANTAKAM, "html.parser")
    info = extract_page_title_info(soup)
    assert info["constituency_no"] == 35
    assert info["constituency_name"] == "MADURANTAKAM"
    assert info["state_name"] == "Tamil_Nadu"
    assert info["raw_state"] == "Tamil Nadu"
    assert "Results October-2026" in info["election_title"]


def test_extract_page_title_info_missing():
    soup = BeautifulSoup("<div>Empty</div>", "html.parser")
    with pytest.raises(ValueError, match="Could not find .page-title"):
        extract_page_title_info(soup)


def test_extract_table_results():
    soup = BeautifulSoup(SAMPLE_HTML_MADURANTAKAM, "html.parser")
    candidates = extract_table_results(soup)
    assert len(candidates) == 3

    winner = candidates[0]
    assert winner["candidate"] == "K.MARAGATHAM KUMARAVEL"
    assert winner["party"] == "Tamilaga Vettri Kazhagam"
    assert winner["total_votes"] == 74048
    assert winner["vote_share"] == 39.96
    assert winner["is_nota"] is False

    nota = candidates[2]
    assert nota["candidate"] == "None Of The Above"
    assert nota["party"] == "None of the Above"
    assert nota["total_votes"] == 652
    assert nota["is_nota"] is True


def test_calculate_metrics():
    cands = [
        {"total_votes": 70000},
        {"total_votes": 30000}
    ]
    electors = 120000
    valid_votes, turnout_pct, enop = calculate_metrics(cands, electors)
    assert valid_votes == 100000
    assert turnout_pct == 83.33
    assert enop > 1.0


def test_calculate_margin():
    cands = [
        {"total_votes": 70000},
        {"total_votes": 30000},
        {"total_votes": 10000}
    ]
    # Pos 1: Winner margin is over runner-up (70000 - 30000 = 40000)
    assert calculate_margin(1, 70000, cands) == 40000
    # Pos 2: Runner-up margin over 3rd place (30000 - 10000 = 20000)
    assert calculate_margin(2, 30000, cands) == 20000
    # Pos 3: Last place margin is 3rd - 0 = 10000
    assert calculate_margin(3, 10000, cands) == 10000


def test_build_opencity_row():
    title_info = {
        "constituency_no": 35,
        "constituency_name": "MADURANTAKAM",
        "state_name": "Tamil_Nadu",
        "raw_state": "Tamil Nadu"
    }
    cand = {
        "candidate": "TEST CANDIDATE",
        "party": "TEST PARTY",
        "total_votes": 60000,
        "vote_share": 60.0
    }
    sorted_cands = [cand, {"total_votes": 40000}]
    const_meta = {"electors": 120000, "district": "CHENGALPATTU", "type": "SC"}
    demographics = {("testcandidate", "madurantakam"): {"age": 45, "sex": "Male"}}

    row = build_opencity_row(
        cand=cand,
        pos=1,
        sorted_cands=sorted_cands,
        title_info=title_info,
        valid_votes=100000,
        electors=120000,
        turnout_pct=83.33,
        enop=1.92,
        const_meta=const_meta,
        demographics=demographics,
        year=2026,
        month=10
    )

    assert row["Candidate"] == "TEST CANDIDATE"
    assert row["Votes"] == 60000
    assert row["Margin"] == 20000
    assert row["Constituency_Name"] == "MADURANTAKAM"
    assert row["Constituency_No"] == 35
    assert row["District_Name"] == "CHENGALPATTU"
    assert row["Age"] == 45
    assert row["Sex"] == "Male"
    assert row["Deposit_Lost"] == "no"
    assert set(row.keys()) == set(OPENCITY_HEADERS)


def test_process_constituency_page():
    meta_map = {"MADURANTAKAM": {"electors": 212639, "district": "CHENGALPATTU", "type": "SC"}}
    demo_map = {("kmaragathamkumaravel", "madurantakam"): {"age": 43, "sex": "Female"}}

    rows = process_constituency_page(
        html_content=SAMPLE_HTML_MADURANTAKAM,
        year=2026,
        month=10,
        metadata_map=meta_map,
        demographics_map=demo_map
    )

    assert len(rows) == 3
    assert rows[0]["Candidate"] == "K.MARAGATHAM KUMARAVEL"
    assert rows[0]["Position"] == 1
    assert rows[0]["Age"] == 43
    assert rows[0]["Sex"] == "Female"
    assert rows[0]["Margin"] == 74048 - 54008
    assert rows[2]["Candidate"] == "None Of The Above"


def test_write_opencity_csv(tmp_path):
    output_file = tmp_path / "test_output.csv"
    sample_row = {h: "" for h in OPENCITY_HEADERS}
    sample_row["Candidate"] = "WINNER"
    sample_row["Votes"] = 1000

    write_opencity_csv([sample_row], str(output_file))
    assert output_file.exists()

    with open(output_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        assert len(rows) == 1
        assert rows[0]["Candidate"] == "WINNER"
        assert rows[0]["Votes"] == "1000"


def test_load_fallbacks():
    meta = load_constituency_metadata_fallback()
    assert "MADURANTAKAM" in meta
    assert "DHARAPURAM" in meta
    assert meta["MADURANTAKAM"]["district"] == "CHENGALPATTU"

    demo = load_candidate_demographics_fallback()
    assert isinstance(demo, dict)


def test_integration_with_import_election_csv():
    from scraper.import_election_csv import ElectionCSVImporter
    from unittest.mock import MagicMock, patch

    meta_map = {"MADURANTAKAM": {"electors": 212639, "district": "CHENGALPATTU", "type": "SC"}}
    demo_map = {("kmaragathamkumaravel", "madurantakam"): {"age": 43, "sex": "Female"}}

    rows = process_constituency_page(
        html_content=SAMPLE_HTML_MADURANTAKAM,
        year=2026,
        month=10,
        metadata_map=meta_map,
        demographics_map=demo_map
    )

    with patch('boto3.resource') as mock_resource:
        importer = ElectionCSVImporter(region="ap-south-2")
        importer.candidates_table = MagicMock()
        importer.candidates_table.query.return_value = {'Items': []}
        importer.constituencies_table = MagicMock()
        importer.constituencies_table.get_item.return_value = {
            'Item': {'PK': 'CONSTITUENCY#madurantakam', 'SK': 'METADATA'}
        }
        importer.persons_table = MagicMock()
        importer.persons_table.get_item.return_value = {'Item': {}}
        importer.resolver = MagicMock()
        importer.resolver.get_or_create_constituency.return_value = "CONSTITUENCY#madurantakam"
        importer.resolver.resolve_party_id.return_value = "PARTY#tvk"
        importer.resolver.resolve_district_id.return_value = "DISTRICT#chengalpattu"
        importer.resolver.get_or_create_person.return_value = "PERSON_TEST"

        result = importer.process_row(rows[0], dry_run=True)
        assert result in ["created", "updated"]

