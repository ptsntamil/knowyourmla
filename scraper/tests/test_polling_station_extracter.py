"""Unit tests for polling station extraction helper and prompt formatting."""

import os
import sys
import json
from unittest.mock import MagicMock, patch
import pytest

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from helper.polling_station_extracter import (
    _calculate_chunk_size,
    _build_constituency_constraints,
    _format_extraction_prompt,
    _determine_next_range,
    _save_extraction_results,
    _load_resumed_state,
    is_data_valid,
    _has_completed_summary_and_postal,
    get_expected_candidate_count,
    is_station_candidate_count_valid,
    find_mismatched_candidate_stations,
    group_station_numbers_into_ranges,
    _format_rerun_prompt,
    _merge_new_candidates,
    _replace_or_append_station,
    _apply_rerun_chunk_results,
    _extract_rerun_range,
    _rerun_mismatched_ranges,
    _verify_and_rerun_mismatched_stations,
)


@pytest.mark.parametrize(
    "cand_count, candidates, expected_chunk",
    [
        (None, {"1": "A", "2": "B"}, 75),
        (None, {str(i): "A" for i in range(1, 22)}, 50),
        (None, {str(i): "A" for i in range(1, 35)}, 30),
        (16, {}, 75),
        (25, {}, 50),
        (35, {}, 30),
        (35, {"1": "A"}, 30),  # explicit cand_count takes precedence over len(cand)
    ],
)
def test_calculate_chunk_size(cand_count, candidates, expected_chunk):
    """Test chunk size calculation based on candidates count."""
    assert _calculate_chunk_size(cand_count, candidates) == expected_chunk


def test_build_constituency_constraints_both():
    """Test constraint text when both candidate count and station count are provided."""
    text = _build_constituency_constraints(candidates_count=16, station_count=248)
    assert "TOTAL CANDIDATES IN CONSTITUENCY: EXACTLY 16 candidates" in text
    assert "'1' through '16'" in text
    assert "TOTAL POLLING STATIONS IN CONSTITUENCY: EXACTLY 248 polling stations" in text
    assert "numbered 1 to 248" in text


def test_build_constituency_constraints_none():
    """Test constraint text when neither candidate count nor station count are provided."""
    text = _build_constituency_constraints(candidates_count=None, station_count=None)
    assert "TOTAL CANDIDATES IN CONSTITUENCY: Not specified" in text
    assert "TOTAL POLLING STATIONS IN CONSTITUENCY: Not specified" in text


def test_format_extraction_prompt():
    """Test formatting prompt template with counts and constraints."""
    template = (
        "Range: {{START_PS}} to {{END_PS}}\n"
        "Total Stations: {{STATION_COUNT}}\n"
        "Total Candidates: {{CANDIDATES_COUNT}}\n"
        "Expected: {{END_PS - START_PS + 1}}\n"
        "JSON: {\"total_stations\": {{TOTAL_STATIONS_JSON}}, \"total_candidates\": {{CANDIDATES_COUNT_JSON}}}\n"
        "Constraints:\n{{CONSTITUENCY_CONSTRAINTS}}"
    )
    res = _format_extraction_prompt(
        template, start=1, end=75, candidates_count=18, station_count=210
    )
    assert "Range: 1 to 75" in res
    assert "Total Stations: 210" in res
    assert "Total Candidates: 18" in res
    assert "Expected: 75" in res
    assert '"total_stations": 210' in res
    assert '"total_candidates": 18' in res
    assert "TOTAL CANDIDATES IN CONSTITUENCY: EXACTLY 18 candidates" in res
    assert "TOTAL POLLING STATIONS IN CONSTITUENCY: EXACTLY 210 polling stations" in res


def test_format_extraction_prompt_none_values():
    """Test formatting prompt template when counts are None."""
    template = (
        "Range: {{START_PS}} to {{END_PS}}\n"
        "JSON: {\"total_stations\": {{TOTAL_STATIONS_JSON}}, \"total_candidates\": {{CANDIDATES_COUNT_JSON}}}"
    )
    res = _format_extraction_prompt(
        template, start=1, end=50, candidates_count=None, station_count=None
    )
    assert "Range: 1 to 50" in res
    assert '"total_stations": null' in res
    assert '"total_candidates": null' in res


def test_determine_next_range_with_station_count_capped():
    """Test that next range stops or caps at station_count."""
    # Already reached station count
    next_s, next_e, ce = _determine_next_range(
        data={"stations": [{"ps": 200}]},
        start_ps=151,
        end_ps=200,
        candidates={},
        new_found=50,
        consecutive_empty=0,
        station_count=200,
    )
    assert next_s is None
    assert next_e is None

    # Next chunk exceeds station count -> capped at station_count
    next_s, next_e, ce = _determine_next_range(
        data={"stations": [{"ps": 100}]},
        start_ps=51,
        end_ps=100,
        candidates={},
        new_found=50,
        consecutive_empty=0,
        station_count=130,
        candidates_count=10,
    )
    assert next_s == 101
    assert next_e == 130  # capped at 130 instead of 101 + 75 - 1


def test_determine_next_range_from_next_range_field():
    """Test parsing next_range dictionary returned by Gemini."""
    next_s, next_e, ce = _determine_next_range(
        data={"next_range": {"start": 76, "end": 150}},
        start_ps=1,
        end_ps=75,
        candidates={},
        new_found=75,
        consecutive_empty=0,
        station_count=120,
    )
    assert next_s == 76
    assert next_e == 120  # capped at station_count


def test_save_extraction_results(tmp_path):
    """Test saving extraction results with validation metadata."""
    out_file = str(tmp_path / "128.json")
    meta = {"ac_no": 128, "ac_name": "Oddanchatram"}
    cand = {"1": {"name": "Candidate A"}}
    stations = [{"ps": 1, "v": {"1": 100}}]
    state = {"postal_data": {"v": {"1": 10}}, "summary_data": {"valid": 110}}

    res = _save_extraction_results(
        out_file, meta, cand, stations, state, candidates_count=1, station_count=1
    )
    assert res["meta"]["total_stations"] == 1
    assert res["meta"]["total_candidates"] == 1
    assert res["validation"]["actual_station_count"] == 1
    assert res["validation"]["expected_station_count"] == 1
    assert res["validation"]["station_count_matches"] is True
    assert res["validation"]["expected_candidate_count"] == 1
    assert res["validation"]["candidate_count_matches"] is True

    assert os.path.exists(out_file)
    with open(out_file, "r") as f:
        saved = json.load(f)
    assert saved["meta"]["ac_no"] == 128


def test_load_resumed_state_with_station_count(tmp_path):
    """Test loading resumed state when station_count is specified."""
    out_file = str(tmp_path / "050.json")
    with open(out_file, "w") as f:
        json.dump({"stations": [{"ps": 1}, {"ps": 50}], "candidates": {"1": "A"}}, f)

    all_st, cand, meta, state, start, end = _load_resumed_state(
        out_file, ac_id=50, candidates_count=10, station_count=80
    )
    assert len(all_st) == 2
    assert start == 51
    assert end == 80  # 51 + 75 - 1 = 125, capped at 80


def test_is_data_valid_and_has_completed_summary():
    """Test data validation helper methods."""
    assert is_data_valid(None) is False
    assert is_data_valid({}) is False
    assert is_data_valid({"v": {}}) is False
    assert is_data_valid({"v": {"1": 100}}) is True
    assert is_data_valid({"v": {}, "valid": 200}) is True

    valid_state = {
        "postal_data": {"v": {"1": 10}, "valid": 10},
        "summary_data": {"v": {"1": 100}, "valid": 100},
    }
    assert _has_completed_summary_and_postal(valid_state) is True

    incomplete_state = {"postal_data": None, "summary_data": {"valid": 100}}
    assert _has_completed_summary_and_postal(incomplete_state) is False


def test_download_pdf_skips_existing(tmp_path, monkeypatch):
    """Test that download_pdf skips downloading if file already exists with size > 0."""
    from helper import polling_station_extracter

    pdf_dir = tmp_path / "pdf"
    pdf_dir.mkdir()
    existing_file = pdf_dir / "AC128.pdf"
    existing_file.write_bytes(b"existing pdf content")

    monkeypatch.setattr(polling_station_extracter, "PDF_DIR", str(pdf_dir))

    mock_requests_get = MagicMock()
    monkeypatch.setattr("requests.get", mock_requests_get)

    # 1. Default (force=False) -> should skip download and NOT call requests.get
    path = polling_station_extracter.download_pdf("http://fake.url/AC128.pdf", 128, force=False)
    assert path == str(existing_file)
    mock_requests_get.assert_not_called()

    # 2. force=True -> should call requests.get and overwrite
    mock_response = MagicMock()
    mock_response.iter_content.return_value = [b"new content"]
    mock_requests_get.return_value = mock_response

    path2 = polling_station_extracter.download_pdf("http://fake.url/AC128.pdf", 128, force=True)
    assert path2 == str(existing_file)
    mock_requests_get.assert_called_once()
    assert existing_file.read_bytes() == b"new content"


def test_get_pdf_path_skips_web_link_when_file_exists(tmp_path, monkeypatch):
    """Test that get_pdf_path avoids calling get_pdf_link when file exists locally."""
    from helper import polling_station_extracter

    pdf_dir = tmp_path / "pdf"
    pdf_dir.mkdir()
    existing_file = pdf_dir / "AC005.pdf"
    existing_file.write_bytes(b"pdf data")

    monkeypatch.setattr(polling_station_extracter, "PDF_DIR", str(pdf_dir))

    mock_get_pdf_link = MagicMock()
    monkeypatch.setattr(polling_station_extracter, "get_pdf_link", mock_get_pdf_link)

    path = polling_station_extracter.get_pdf_path(5, force=False)
    assert path == str(existing_file)
    mock_get_pdf_link.assert_not_called()


def test_get_expected_candidate_count():
    """Test determining expected candidate count from arguments or dictionary."""
    assert get_expected_candidate_count(25, {"1": "A"}) == 25
    assert get_expected_candidate_count(None, {"1": "A", "2": "B"}) == 2
    assert get_expected_candidate_count(0, {"1": "A"}) == 1
    assert get_expected_candidate_count(None, {}) == 0


def test_is_station_candidate_count_valid():
    """Test candidate count validation for individual polling stations."""
    # Expected <= 0 or not dict -> returns True or False safely
    assert is_station_candidate_count_valid({"ps": 1}, expected_candidates=0) is True
    assert is_station_candidate_count_valid("invalid", expected_candidates=5) is False

    # Missing or invalid v
    assert is_station_candidate_count_valid({"ps": 1}, expected_candidates=2) is False
    assert is_station_candidate_count_valid({"ps": 1, "v": None}, expected_candidates=2) is False

    # Count mismatches
    assert is_station_candidate_count_valid({"ps": 1, "v": {"1": 10}}, expected_candidates=2) is False
    assert (
        is_station_candidate_count_valid(
            {"ps": 1, "v": {"1": 10, "2": 20, "3": 0}}, expected_candidates=2
        )
        is False
    )

    # Valid count
    assert (
        is_station_candidate_count_valid(
            {"ps": 1, "v": {"1": 10, "2": 20}}, expected_candidates=2
        )
        is True
    )

    # Key validation
    cand_dict = {"1": "Alice", "2": "Bob"}
    # Correct keys
    assert (
        is_station_candidate_count_valid(
            {"ps": 1, "v": {"1": 10, "2": 20}},
            expected_candidates=2,
            candidates=cand_dict,
        )
        is True
    )
    # Incorrect keys (has '3' instead of '2')
    assert (
        is_station_candidate_count_valid(
            {"ps": 1, "v": {"1": 10, "3": 20}},
            expected_candidates=2,
            candidates=cand_dict,
        )
        is False
    )


def test_find_mismatched_candidate_stations():
    """Test finding all station numbers with mismatched candidate counts."""
    stations = [
        {"ps": 1, "v": {"1": 10, "2": 20}},
        {"ps": 2, "v": {"1": 15}},  # 1 vote instead of 2
        {"ps": 3, "v": {"1": 5, "2": 0}},
        {"ps": 4, "v": None},  # missing v
        {"ps": "invalid", "v": {"1": 10}},  # non-numeric ps
        {"non_station": True},  # missing ps
    ]
    cand = {"1": "A", "2": "B"}
    assert find_mismatched_candidate_stations(stations, expected_candidates=0) == []
    mismatched = find_mismatched_candidate_stations(stations, expected_candidates=2, candidates=cand)
    assert mismatched == [2, 4]


def test_group_station_numbers_into_ranges():
    """Test grouping station numbers into continuous (start, end) ranges."""
    assert group_station_numbers_into_ranges([]) == []
    assert group_station_numbers_into_ranges([214]) == [(214, 214)]
    assert group_station_numbers_into_ranges([1, 2, 3]) == [(1, 3)]
    assert group_station_numbers_into_ranges([1, 2, 5, 8, 9]) == [(1, 2), (5, 5), (8, 9)]

    # Test chunk size cap
    ranges = group_station_numbers_into_ranges([1, 2, 3, 4], max_chunk_size=2)
    assert ranges == [(1, 2), (3, 4)]


def test_format_rerun_prompt():
    """Test formatting targeted rerun prompt with candidate mapping."""
    template = "Extract range {{START_PS}} to {{END_PS}}."
    cand = {"1": "First Candidate", "2": "Second Candidate"}
    prompt = _format_rerun_prompt(
        prompt_template=template,
        start=214,
        end=214,
        candidates_count=2,
        station_count=234,
        candidates=cand,
    )
    assert "Extract range 214 to 214" in prompt
    assert "## CRITICAL RERUN INSTRUCTION" in prompt
    assert "Polling station(s) 214 to 214 had missing or incomplete candidate votes" in prompt
    assert "Candidate ID mapping:" in prompt
    assert "1: First Candidate" in prompt
    assert "2: Second Candidate" in prompt


def test_merge_new_candidates():
    """Test merging newly discovered candidates without overwriting existing entries."""
    candidates = {"1": "Existing Alice"}
    _merge_new_candidates(candidates, {"1": "New Alice", "2": "Bob", "3": ""})
    assert candidates["1"] == "Existing Alice"
    assert candidates["2"] == "Bob"
    assert "3" not in candidates


def test_replace_or_append_station():
    """Test replacing an existing station or appending if not present."""
    stations = [{"ps": 1, "v": {"1": 10}}, {"ps": 2, "v": {"1": 20}}]

    # Replace existing ps 1
    _replace_or_append_station(stations, {"ps": 1, "v": {"1": 15, "2": 5}})
    assert len(stations) == 2
    assert stations[0]["v"] == {"1": 15, "2": 5}

    # Append new ps 3
    _replace_or_append_station(stations, {"ps": 3, "v": {"1": 30, "2": 10}})
    assert len(stations) == 3
    assert stations[2]["ps"] == 3


def test_apply_rerun_chunk_results():
    """Test applying rerun extraction results to master station list."""
    all_stations = [{"ps": 10, "v": {"1": 5}}]  # only 1 candidate, expected 2
    candidates = {"1": "Alice"}

    # Invalid / empty data returns 0
    assert _apply_rerun_chunk_results(None, all_stations, candidates, 2) == 0
    assert _apply_rerun_chunk_results({}, all_stations, candidates, 2) == 0

    # Data with valid station for ps 10 and invalid for ps 11
    data = {
        "candidates": {"2": "Bob"},
        "stations": [
            {"ps": 10, "v": {"1": 100, "2": 50}},  # valid 2 candidates
            {"ps": 11, "v": {"1": 20}},  # invalid (only 1 candidate)
        ],
    }
    corrected = _apply_rerun_chunk_results(data, all_stations, candidates, 2)
    assert corrected == 1
    assert candidates["2"] == "Bob"
    assert all_stations[0]["v"] == {"1": 100, "2": 50}
    assert len(all_stations) == 1  # invalid ps 11 was not added


def test_extract_rerun_range():
    """Test _extract_rerun_range with mocked Gemini chunk extraction."""
    mock_chat = MagicMock()
    mock_file = MagicMock()

    with patch("helper.polling_station_extracter._try_extract_chunk") as mock_try:
        # Success case
        mock_try.return_value = ({"stations": []}, False)
        data, chat, file_up, ki = _extract_rerun_range(
            mock_chat, mock_file, ["key1"], 0, "dummy.pdf", "prompt"
        )
        assert data == {"stations": []}
        assert ki == 0

        # Key exhausted case: key 0 exhausted, key 1 succeeds
        mock_try.side_effect = [(None, True), ({"stations": [{"ps": 5}]}, False)]
        with patch("helper.polling_station_extracter._init_gemini_chat") as mock_init:
            mock_new_client = MagicMock()
            mock_new_chat = MagicMock()
            mock_new_file = MagicMock()
            mock_init.return_value = (mock_new_client, mock_new_file, mock_new_chat)

            data, chat, file_up, ki = _extract_rerun_range(
                mock_chat, mock_file, ["key1", "key2"], 0, "dummy.pdf", "prompt"
            )
            assert data == {"stations": [{"ps": 5}]}
            assert ki == 1


def test_rerun_mismatched_ranges():
    """Test rerunning multiple mismatched station ranges."""
    stations = [{"ps": 5, "v": {"1": 10}}, {"ps": 8, "v": {"1": 20}}]
    candidates = {"1": "A", "2": "B"}

    with patch("helper.polling_station_extracter._extract_rerun_range") as mock_extract:
        mock_extract.side_effect = [
            ({"stations": [{"ps": 5, "v": {"1": 10, "2": 5}}]}, MagicMock(), MagicMock(), 0),
            ({"stations": [{"ps": 8, "v": {"1": 20, "2": 15}}]}, MagicMock(), MagicMock(), 0),
        ]
        chat, file_up, ki = _rerun_mismatched_ranges(
            mismatched_ps=[5, 8],
            chat=MagicMock(),
            file_upload=MagicMock(),
            keys=["k1"],
            key_index=0,
            pdf_path="test.pdf",
            prompt_template="template",
            all_stations=stations,
            candidates=candidates,
            expected_candidates=2,
            station_count=10,
        )
        assert stations[0]["v"] == {"1": 10, "2": 5}
        assert stations[1]["v"] == {"1": 20, "2": 15}


def test_verify_and_rerun_mismatched_stations():
    """Test overall verification and rerun workflow."""
    # 1. When candidates count is 0 / unknown, returns immediately without rerunning
    stations = [{"ps": 1, "v": {}}]
    chat, file_up, ki = _verify_and_rerun_mismatched_stations(
        chat=None,
        file_upload=None,
        keys=["k1"],
        key_index=0,
        pdf_path="test.pdf",
        prompt_template="template",
        all_stations=stations,
        candidates={},
        candidates_count=None,
        station_count=1,
    )
    assert ki == 0

    # 2. When all stations are already valid, skips rerun
    valid_stations = [
        {"ps": 2, "v": {"1": 10, "2": 20}},
        {"ps": 1, "v": {"1": 5, "2": 15}},
    ]
    with patch("helper.polling_station_extracter._rerun_mismatched_ranges") as mock_rerun:
        chat, file_up, ki = _verify_and_rerun_mismatched_stations(
            chat=None,
            file_upload=None,
            keys=["k1"],
            key_index=0,
            pdf_path="test.pdf",
            prompt_template="template",
            all_stations=valid_stations,
            candidates={"1": "A", "2": "B"},
            candidates_count=2,
            station_count=2,
        )
        mock_rerun.assert_not_called()
        # Stations should be sorted by ps
        assert valid_stations[0]["ps"] == 1
        assert valid_stations[1]["ps"] == 2

    # 3. When a station is mismatched, triggers rerun and corrects it
    faulty_stations = [
        {"ps": 1, "v": {"1": 10, "2": 20}},
        {"ps": 2, "v": {"1": 5}},  # missing candidate 2
    ]
    with patch("helper.polling_station_extracter._rerun_mismatched_ranges") as mock_rerun:
        def side_effect(mismatched, c, f, k, ki, p, t, all_st, cand, exp, st_cnt):
            # simulate correcting station 2
            all_st[1] = {"ps": 2, "v": {"1": 5, "2": 25}}
            return c, f, ki

        mock_rerun.side_effect = side_effect
        chat, file_up, ki = _verify_and_rerun_mismatched_stations(
            chat=None,
            file_upload=None,
            keys=["k1"],
            key_index=0,
            pdf_path="test.pdf",
            prompt_template="template",
            all_stations=faulty_stations,
            candidates={"1": "A", "2": "B"},
            candidates_count=2,
            station_count=2,
        )
        mock_rerun.assert_called_once()
        assert faulty_stations[1]["v"] == {"1": 5, "2": 25}


def test_save_extraction_results_with_candidate_verification(tmp_path):
    """Test that _save_extraction_results records candidate verification status."""
    out_file = str(tmp_path / "099.json")
    meta = {"ac_no": 99}
    cand = {"1": "A", "2": "B"}
    # One station valid, one station invalid
    stations = [
        {"ps": 1, "v": {"1": 10, "2": 20}},
        {"ps": 2, "v": {"1": 15}},  # 1 candidate instead of 2
    ]
    state = {"postal_data": None, "summary_data": None}

    res = _save_extraction_results(
        out_file, meta, cand, stations, state, candidates_count=2, station_count=2
    )
    val = res["validation"]
    assert val["mismatched_candidate_stations_count"] == 1
    assert val["candidate_count_per_station_matches"] is False
    assert val["mismatched_stations"] == [2]

