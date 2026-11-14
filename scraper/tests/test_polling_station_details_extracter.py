"""Unit tests for polling station details extractor and normalization logic."""

import os
import sys
import json
from unittest.mock import MagicMock, patch
import pytest

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from helper.polling_station_details_extracter import (
    get_api_keys,
    get_pdf_path,
    parse_json_response,
    format_prompt,
    clean_tokens,
    build_filter_metadata,
    normalize_station_record,
    merge_extracted_stations,
    find_missing_stations,
    group_numbers_into_ranges,
    load_resumed_state,
    save_extracted_results,
    build_dynamodb_items,
    build_bundle_json,
    print_performance_summary,
    _extract_chunk_step,
    _recover_missing_stations,
    _get_candidate_models,
    _is_retryable_model_error,
    _handle_exhausted_key,
    _auto_import_if_requested,
    ensure_api_keys,
    execute_chunk_request,
    resolve_model_name,
    detect_total_stations_from_pdf,
    verify_station_count,
    _build_recovery_prompt,
    main,
)


def test_get_api_keys_with_env(monkeypatch):
    """Test get_api_keys returns token from environment."""
    monkeypatch.setenv("GOOGLE_GEMINI_API_KEY", "test_gemini_key")
    keys = get_api_keys()
    assert keys == ["test_gemini_key"]


def test_get_api_keys_empty(monkeypatch):
    """Test get_api_keys when no key is set."""
    monkeypatch.delenv("GOOGLE_GEMINI_API_KEY", raising=False)
    assert get_api_keys() == []


def test_get_pdf_path_explicit(tmp_path):
    """Test get_pdf_path with explicit path."""
    pdf = tmp_path / "custom.pdf"
    pdf.write_bytes(b"content")
    assert get_pdf_path(ac_id=1, pdf_path=str(pdf)) == str(pdf.resolve())


def test_get_pdf_path_default(monkeypatch, tmp_path):
    """Test get_pdf_path using standard directory lookup."""
    pdf_dir = tmp_path / "pdf"
    pdf_dir.mkdir()
    target_pdf = pdf_dir / "AC002.pdf"
    target_pdf.write_bytes(b"pdf data")
    monkeypatch.setattr("helper.polling_station_details_extracter.DEFAULT_PDF_DIR", str(pdf_dir))

    assert get_pdf_path(ac_id=2) == str(target_pdf.resolve())

    with pytest.raises(FileNotFoundError):
        get_pdf_path(ac_id=999)


@pytest.mark.parametrize(
    "raw_input, expected_key",
    [
        ('{"stations": [{"ps_no": 1}]}', "stations"),
        ('```json\n{"stations": [{"ps_no": 2}]}\n```', "stations"),
        ('{stations: [{"ps_no": 3}]}', "stations"),  # unquoted json repair
        ("", None),
        ("Invalid non-json text", None),
    ],
)
def test_parse_json_response(raw_input, expected_key):
    """Test JSON parsing with clean, markdown-wrapped, and malformed responses."""
    result = parse_json_response(raw_input)
    if expected_key:
        assert expected_key in result
    else:
        assert result == {}


def test_format_prompt():
    """Test format_prompt string substitutions."""
    template = "START={{START_PS}}, END={{END_PS}}, TOTAL={{TOTAL_STATIONS_JSON}}, COUNT={{END_PS - START_PS + 1}}"
    res = format_prompt(template, start_ps=1, end_ps=25, total_stations=344)
    assert res == "START=1, END=25, TOTAL=344, COUNT=25"


def test_clean_tokens():
    """Test token cleaning and deduplication."""
    tokens = ["Egumadurai", "egumadurai", "601201", "A!", "Primary School "]
    cleaned = clean_tokens(tokens)
    assert "egumadurai" in cleaned
    assert "601201" in cleaned
    assert "primary school" in cleaned
    assert "a" not in cleaned  # length < 2


def test_build_filter_metadata():
    """Test building filter metadata from a station dictionary."""
    station = {
        "ps_no": 1,
        "station_type": "ALL VOTERS",
        "building": {
            "name": "Panchayat Union Primary School",
            "category": "Primary School",
            "location": "Egumadurai",
            "raw_text": "Panchayat Union Primary School, Egumadurai -601201",
        },
        "polling_areas": [
            {
                "area_no": 1,
                "local_body_name": "Egumadurai",
                "locality_or_street": "Egumadurai village",
                "ward_no": "1",
            },
            {
                "area_no": 2,
                "local_body_name": "Egumadurai",
                "locality_or_street": "Irular Colony",
                "ward_no": "1",
            },
        ],
    }
    meta = build_filter_metadata(station)
    assert meta["pincode"] == "601201"
    assert meta["station_type"] == "ALL VOTERS"
    assert meta["building_category"] == "Primary School"
    assert meta["wards"] == ["1"]
    assert "Egumadurai" in meta["local_bodies"]
    assert "Irular Colony" in meta["localities"]
    assert "egumadurai" in meta["search_keywords"]
    assert "601201" in meta["search_keywords"]


def test_normalize_station_record_valid():
    """Test normalizer with valid data."""
    station = {
        "ps_no": "1",
        "sl_no": "1",
        "building": {
            "name": "Panchayat Union Primary School",
            "wing_portion": "North Building",
            "facing": "South Facing",
            "location": "Egumadurai",
            "pincode": "601201",
        },
        "polling_areas": [
            {
                "area_no": 999,
                "raw_text": "[999] -OVERSEAS ELECTORS",
            }
        ],
    }
    record = normalize_station_record(station)
    assert record is not None
    assert record["ps_no"] == 1
    assert record["sl_no"] == 1
    assert record["has_overseas_electors"] is True
    assert record["building"]["facing"] in ("SOUTH", "South Facing")


def test_normalize_station_record_null_fields():
    """Test normalizer handles explicit null/None fields without throwing AttributeError."""
    station = {
        "ps_no": 2,
        "sl_no": 2,
        "station_type": None,
        "building": {
            "name": None,
            "category": None,
            "wing_portion": None,
            "facing": None,  # This caused AttributeError previously
            "location": None,
            "pincode": None,
            "raw_text": None,
        },
        "polling_areas": [
            {
                "area_no": 1,
                "raw_text": None,
                "local_body_name": None,
                "locality_or_street": None,
                "ward_no": None,
                "door_no_range": None,
            }
        ],
    }
    record = normalize_station_record(station)
    assert record is not None
    assert record["ps_no"] == 2
    assert record["building"]["facing"] is None
    assert record["building"]["pincode"] is None
    assert record["station_type"] == "ALL VOTERS"
    assert record["building"]["category"] == "OTHER"


def test_normalize_station_record_invalid():
    """Test normalizer returns None for missing station numbers."""
    assert normalize_station_record({}) is None
    assert normalize_station_record({"ps_no": "invalid"}) is None


def test_merge_extracted_stations():
    """Test station merging and in-place updating."""
    all_stations = [
        {"ps_no": 1, "station_type": "ALL VOTERS", "building": {}, "polling_areas": []}
    ]
    new_stations = [
        {"ps_no": 1, "station_type": "MEN ONLY", "building": {}, "polling_areas": []},
        {"ps_no": 2, "station_type": "ALL VOTERS", "building": {}, "polling_areas": []},
    ]
    added = merge_extracted_stations(all_stations, new_stations)
    assert added == 1
    assert len(all_stations) == 2
    assert all_stations[0]["ps_no"] == 1
    assert all_stations[0]["station_type"] == "MEN ONLY"
    assert all_stations[1]["ps_no"] == 2


def test_find_missing_stations():
    """Test identification of missing station numbers."""
    stations = [{"ps_no": 1}, {"ps_no": 3}, {"ps_no": 4}]
    missing = find_missing_stations(stations, total=5)
    assert missing == [2, 5]


def test_group_numbers_into_ranges():
    """Test grouping numbers into chunk intervals."""
    nums = [1, 2, 3, 7, 8, 12]
    ranges = group_numbers_into_ranges(nums, max_chunk=10)
    assert ranges == [(1, 3), (7, 8), (12, 12)]
    assert group_numbers_into_ranges([]) == []


def test_load_resumed_state(tmp_path):
    """Test state resumption from disk."""
    ac_folder = tmp_path / "AC001"
    stations, meta, next_start = load_resumed_state(str(ac_folder))
    assert stations == []
    assert next_start == 1

    # Write dummy saved state inside AC folder
    ac_folder.mkdir(parents=True, exist_ok=True)
    out_file = str(ac_folder / "07_final_stations.json")
    data = {
        "meta": {"ac_no": 1},
        "stations": [{"ps_no": 1}, {"ps_no": 2}],
    }
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(data, f)

    stations, meta, next_start = load_resumed_state(str(ac_folder))
    assert len(stations) == 2
    assert meta["ac_no"] == 1
    assert next_start == 3


def test_save_extracted_results(tmp_path):
    """Test saving results across all target formats (07_final, 08_dynamo, bundle)."""
    ac_folder = tmp_path / "AC001"
    meta = {"ac_no": 1, "ac_name": "Gummidipoondi"}
    stations = [
        {
            "ps_no": 1,
            "station_type": "ALL VOTERS",
            "building": {"name": "School", "pincode": "601201", "location": "Village"},
            "areas": [
                {
                    "local_body_id": "village",
                    "local_body_canonical": "Village",
                    "local_body_type": "P",
                    "ward_nos": ["1"],
                    "is_revenue_village": True,
                }
            ],
            "filters": {
                "pincodes": ["601201"],
                "local_body_ids": ["village"],
                "rv_ids": ["village"],
                "ward_keys": ["village#1"],
                "locality_ids": [],
            },
        },
        {
            "ps_no": 2,
            "station_type": "ALL VOTERS",
            "building": {"name": "School 2", "pincode": "601201", "location": "Village"},
            "areas": [],
            "filters": {"pincodes": ["601201"]},
        },
    ]
    res = save_extracted_results(str(ac_folder), meta, stations, total_stations=3)
    assert res["total_stations"] == 2
    assert res["validation"]["missing_stations"] == [3]

    # Check that 07_final, 08_dynamo, and bundle were generated ONLY in AC001 folder
    assert (ac_folder / "07_final_stations.json").exists()
    assert (ac_folder / "08_dynamodb_items.json").exists()
    assert (ac_folder / "08_dynamodb_items.ndjson").exists()
    assert (ac_folder / "AC001.json").exists()

    # Ensure no duplicate file was written to the parent directory
    assert not (tmp_path / "AC001_polling_stations.json").exists()

    # Verify content of 08_dynamodb_items.json
    with open(ac_folder / "08_dynamodb_items.json", "r", encoding="utf-8") as f:
        dynamo_items = json.load(f)
    entities = {item["entity"] for item in dynamo_items}
    assert "STATION" in entities
    assert "INDEX" in entities
    assert "LOCAL_BODY" in entities
    assert "PINCODE" in entities
    assert "AC_META" in entities


def test_save_extracted_results_sanitizes_year_ac_no(tmp_path):
    """Test that hallucinated year (e.g. 2026) in meta is rejected and path AC is enforced."""
    target_dir = tmp_path / "AC080"
    meta = {
        "ac_no": 2026,  # Hallucinated year from PDF header
        "ac_name": "Kallakurichi District 80 - Kallakurichi",
    }
    stations = [{"ps_no": 1, "station_type": "ALL VOTERS", "building": {}, "areas": []}]

    res = save_extracted_results(str(target_dir), meta, stations)
    assert res["meta"]["ac_no"] == 80
    assert res["meta"]["ac_name"] == "Kallakurichi"
    assert (target_dir / "07_final_stations.json").exists()
    assert (target_dir / "AC080.json").exists()
    # AC2026 must NEVER be created
    assert not (tmp_path / "AC2026").exists()
    assert not (tmp_path / "AC080_polling_stations.json").exists()


def test_build_dynamodb_items():
    """Test generating DynamoDB items with STATION, INDEX, and lookup records."""
    meta = {"ac_no": 2, "ac_name": "Ponneri (Sc)", "pc_no": 1, "pc_name": "Thiruvallur"}
    stations = [
        {
            "ps_no": 1,
            "ps_no_suffix": None,
            "sl_no": 1,
            "station_type": "ALL VOTERS",
            "has_overseas_electors": False,
            "building": {
                "name": "Panchayath Union School",
                "category": "PRIMARY_SCHOOL",
                "location": "Pothiyarankulam",
                "pincode": "601201",
            },
            "areas": [
                {
                    "local_body_id": "poongulam",
                    "local_body_canonical": "Poongulam",
                    "local_body_type": "P",
                    "ward_nos": ["1", "2"],
                    "is_revenue_village": False,
                }
            ],
            "filters": {
                "pincodes": ["601201"],
                "local_body_ids": ["poongulam"],
                "rv_ids": [],
                "ward_nos": ["1", "2"],
                "ward_keys": ["poongulam#1", "poongulam#2"],
                "locality_ids": ["poongulam#village"],
                "building_category": "PRIMARY_SCHOOL",
            },
            "search_text": "601201 poongulam",
            "needs_review": False,
            "review": {"status": "ok", "reasons": []},
        }
    ]
    items = build_dynamodb_items(meta, stations)
    assert len(items) > 1

    entities_map = {}
    index_items = []
    for it in items:
        ent = it.get("entity")
        if ent:
            entities_map[ent] = it
        if ent == "INDEX":
            index_items.append(it)

    station_item = entities_map["STATION"]
    assert (
        station_item["PK"] == "AC#TN#002"
        and station_item["SK"] == "PS#0001"
        and station_item["ac_no"] == 2
        and station_item["ac_name"] == "Ponneri (Sc)"
        and station_item["pincode"] == "601201"
        and station_item["polling_station_no"] == "1"
    )

    assert len(index_items) >= 4
    pin_item = next((it for it in index_items if it.get("kind") == "PIN"), None)
    assert pin_item and pin_item["value"] == "601201" and pin_item["GSI1PK"] == "AC#TN#002#PIN#601201"

    meta_item = entities_map["AC_META"]
    assert meta_item["total_stations"] == 1 and "601201" in meta_item["pincodes"]


def test_build_bundle_json():
    """Test constituency bundle creation matching step 9."""
    meta = {"ac_no": 3, "ac_name": "Tiruttani", "pc_no": 2, "pc_name": "Arakkonam"}
    summary = {"total_stations": 1, "needs_review": 0}
    stations = [
        {
            "ps_no": 1,
            "ps_no_suffix": None,
            "sl_no": 1,
            "station_type": "ALL VOTERS",
            "has_overseas_electors": True,
            "building": {"name": "High School", "category": "HIGH_SCHOOL", "pincode": "631207"},
            "areas": [
                {
                    "local_body_id": "veliyagaram",
                    "local_body_canonical": "Veliyagaram",
                    "local_body_type": "P",
                    "ward_nos": ["1"],
                    "is_revenue_village": True,
                }
            ],
            "filters": {
                "ward_keys": ["veliyagaram#1"],
                "locality_ids": ["veliyagaram#mainroad"],
            },
        }
    ]
    bundle = build_bundle_json(meta, stations, summary)
    assert bundle["schema_version"] == "1.0"
    assert bundle["meta"]["ac_no"] == 3
    assert bundle["lookups"]["overseas_station_nos"] == [1]
    assert "631207" in bundle["lookups"]["pincodes"]
    assert "HIGH_SCHOOL" in bundle["lookups"]["building_categories"]


def test_extract_chunk_step_success(tmp_path):
    """Test successful single chunk step."""
    chat = MagicMock()
    file_upload = MagicMock()
    output_path = str(tmp_path / "chunk_out.json")
    stations = []
    meta = {}

    with patch("helper.polling_station_details_extracter.execute_chunk_request") as mock_exec:
        mock_exec.return_value = (
            {
                "meta": {"ac_name": "Gummidipoondi"},
                "stations": [
                    {
                        "ps_no": 1,
                        "building": {"name": "School"},
                        "polling_areas": [],
                    }
                ],
            },
            False,
        )
        updated_meta, is_exhausted, has_data = _extract_chunk_step(
            chat,
            file_upload,
            "template",
            output_path,
            meta,
            stations,
            curr_start=1,
            curr_end=10,
            total_stations=344,
        )
        assert is_exhausted is False
        assert has_data is True
        assert len(stations) == 1
        assert updated_meta.get("ac_name") == "Gummidipoondi"


def test_recover_missing_stations(tmp_path):
    """Test recovery pass for missing stations."""
    chat = MagicMock()
    file_upload = MagicMock()
    output_path = str(tmp_path / "recover_out.json")
    stations = [
        {"ps_no": 1, "station_type": "ALL VOTERS", "building": {}, "polling_areas": []}
    ]
    meta = {"ac_no": 1}

    with patch("helper.polling_station_details_extracter.execute_chunk_request") as mock_exec:
        mock_exec.return_value = (
            {
                "stations": [
                    {
                        "ps_no": 2,
                        "building": {"name": "School 2"},
                        "polling_areas": [],
                    }
                ]
            },
            False,
        )
        _recover_missing_stations(
            chat,
            file_upload,
            "template",
            output_path,
            meta,
            stations,
            total_stations=2,
        )
        assert len(stations) == 2
        assert stations[1]["ps_no"] == 2


def test_get_candidate_models():
    """Test candidate models building with fallback priorities."""
    chat = MagicMock()
    chat._model = "custom-gemini-model"
    models = _get_candidate_models(chat)
    assert models[0] == "custom-gemini-model"
    assert "gemini-3.1-flash-lite" in models or "gemini-3.8-flash" in models


def test_is_retryable_model_error():
    """Test detection of transient errors and not-found model errors."""
    assert _is_retryable_model_error("503 UNAVAILABLE: High demand") is True
    assert _is_retryable_model_error("404 NOT_FOUND: model is no longer available") is True
    assert _is_retryable_model_error("504 DEADLINE_EXCEEDED") is True
    assert _is_retryable_model_error("Invalid argument syntax error") is False


def test_handle_exhausted_key():
    """Test API key exhaustion and rotation."""
    keys = ["key1", "key2"]
    with patch("helper.polling_station_details_extracter.init_gemini_session") as mock_init:
        mock_init.return_value = (MagicMock(), MagicMock(), MagicMock())
        next_idx, client, fup, chat = _handle_exhausted_key(keys, 0, "path.pdf", model="test-model")
        assert next_idx == 1
        assert client is not None

        # Exceeding all keys
        next_idx, client, fup, chat = _handle_exhausted_key(keys, 1, "path.pdf", model="test-model")
        assert next_idx == 2
        assert client is None


def test_auto_import_if_requested():
    """Test auto-import triggering."""
    with patch("import_polling_stations.PollingStationImporter") as mock_importer_cls:
        mock_instance = MagicMock()
        mock_importer_cls.return_value = mock_instance
        _auto_import_if_requested(True, 1, "file.json")
        mock_instance.import_single_file.assert_called_once_with("file.json")

    with patch("import_polling_stations.PollingStationImporter") as mock_importer_cls:
        _auto_import_if_requested(False, 1, "file.json")
        mock_importer_cls.assert_not_called()


def test_ensure_api_keys(monkeypatch):
    """Test ensure_api_keys behavior when key is available."""
    monkeypatch.setenv("GOOGLE_GEMINI_API_KEY", "valid_key")
    assert ensure_api_keys() == ["valid_key"]


def test_execute_chunk_request_fallback():
    """Test execute_chunk_request falls back to next model on 503/404."""
    chat = MagicMock()
    chat._model = "gemini-3.1-flash-lite"
    file_upload = MagicMock()

    call_count = 0

    def mock_send_message(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise Exception("503 UNAVAILABLE: high demand")
        resp = MagicMock()
        resp.text = '{"stations": [{"ps_no": 1}]}'
        return resp

    chat.send_message.side_effect = mock_send_message
    result, is_exhausted = execute_chunk_request(chat, file_upload, "prompt")

    assert is_exhausted is False
    assert result == {"stations": [{"ps_no": 1}]}
    assert chat._model == "gemini-3.8-flash"


def test_print_performance_summary(capsys):
    """Test printing performance breakdown table."""
    import time
    metrics = {
        "start_time": time.time() - 10.0,
        "chunk_count": 2,
        "api_time": 7.5,
        "parse_time": 0.5,
        "norm_time": 0.2,
        "save_time": 1.0,
    }
    print_performance_summary(metrics)
    captured = capsys.readouterr()
    assert "EXTRACTION PERFORMANCE BREAKDOWN" in captured.out
    assert "Gemini API" in captured.out
    assert "7.50s" in captured.out


@pytest.mark.parametrize(
    "model_arg,is_lite,is_latest,expected",
    [
        (None, False, False, "gemini-3.1-flash-lite"),
        ("", False, False, "gemini-3.1-flash-lite"),
        (None, True, False, "gemini-3.1-flash-lite"),
        (None, False, True, "gemini-3.8-flash"),
        ("latest", False, False, "gemini-3.8-flash"),
        ("3.8", False, False, "gemini-3.8-flash"),
        ("3.8-flash", False, False, "gemini-3.8-flash"),
        ("lite", False, False, "gemini-3.1-flash-lite"),
        ("light", False, False, "gemini-3.1-flash-lite"),
        ("3.1-lite", False, False, "gemini-3.1-flash-lite"),
        ("3.1 light", False, False, "gemini-3.1-flash-lite"),
        ("flash", False, False, "gemini-3.8-flash"),
        ("custom-model-test", False, False, "custom-model-test"),
    ],
)
def test_resolve_model_name(model_arg, is_lite, is_latest, expected):
    """Test model alias resolution for CLI and programmatic calls."""
    resolved = resolve_model_name(model_arg=model_arg, is_lite=is_lite, is_latest=is_latest)
    assert resolved == expected


@pytest.mark.parametrize(
    "cli_args,expected_model",
    [
        (["prog", "1", "--lite"], "gemini-3.1-flash-lite"),
        (["prog", "1", "--light"], "gemini-3.1-flash-lite"),
        (["prog", "1", "--latest"], "gemini-3.8-flash"),
        (["prog", "1", "--model", "latest"], "gemini-3.8-flash"),
        (["prog", "1", "-m", "3.1-lite"], "gemini-3.1-flash-lite"),
        (["prog", "1", "-m", "3.1 light"], "gemini-3.1-flash-lite"),
        (["prog", "1"], "gemini-3.1-flash-lite"),
    ],
)
def test_main_cli_model_selection(monkeypatch, cli_args, expected_model):
    """Test main() correctly passes resolved model to extraction pipeline."""
    with patch("sys.argv", cli_args), patch(
        "helper.polling_station_details_extracter.extract_polling_station_details"
    ) as mock_extract:
        main()
        mock_extract.assert_called_once()
        _, kwargs = mock_extract.call_args
        assert kwargs["model"] == expected_model


def test_verify_station_count_complete(capsys):
    """Test verify_station_count when all stations are present."""
    stations = [{"ps_no": i} for i in range(1, 6)]
    res = verify_station_count(stations, total_stations=5, verbose=True)

    assert res["is_complete"] is True
    assert res["expected"] == 5
    assert res["unique_count"] == 5
    assert res["missing"] == []
    assert res["missing_count"] == 0
    assert res["duplicates"] == []
    assert res["coverage_pct"] == 100.0

    captured = capsys.readouterr()
    assert "POLLING STATION COUNT VERIFIED (100% COMPLETE)" in captured.out


def test_verify_station_count_missing_and_duplicates(capsys):
    """Test verify_station_count with missing stations and duplicates."""
    stations = [{"ps_no": 1}, {"ps_no": 2}, {"ps_no": 4}, {"ps_no": 4}, {"polling_station_no": "5"}]
    res = verify_station_count(stations, total_stations=5, verbose=True)

    assert res["is_complete"] is False
    assert res["expected"] == 5
    assert res["unique_count"] == 4
    assert res["missing"] == [3]
    assert res["missing_count"] == 1
    assert res["duplicates"] == [4]
    assert res["coverage_pct"] == 80.0

    captured = capsys.readouterr()
    assert "POLLING STATION COUNT MISMATCH" in captured.out
    assert "Missing Station Numbers" in captured.out


def test_verify_station_count_inferred_total():
    """Test verify_station_count infers total from max station when None."""
    stations = [{"ps_no": 1}, {"ps_no": 2}, {"ps_no": 3}]
    res = verify_station_count(stations, total_stations=None, verbose=False)

    assert res["expected"] == 3
    assert res["is_complete"] is True
    assert res["missing"] == []


def test_detect_total_stations_from_pdf(tmp_path):
    """Test detect_total_stations_from_pdf with mock pdfplumber."""
    dummy_pdf = tmp_path / "dummy.pdf"
    dummy_pdf.write_bytes(b"%PDF-1.4 mock")

    with patch("pdfplumber.open") as mock_open:
        mock_pdf = MagicMock()
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Row 1\n343 343 Building A\n344 344 Building B\nPage 44"
        mock_pdf.pages = [mock_page]
        mock_open.return_value.__enter__.return_value = mock_pdf

        detected = detect_total_stations_from_pdf(str(dummy_pdf))
        assert detected == 344


def test_build_recovery_prompt():
    """Test recovery prompt adds directive with station bounds."""
    template = "Extract stations START_PS={{START_PS}} END_PS={{END_PS}} TOTAL={{STATION_COUNT}}"
    prompt = _build_recovery_prompt(template, 42, 45, 100)

    assert "START_PS=42" in prompt
    assert "END_PS=45" in prompt
    assert "PRIORITY RECOVERY DIRECTIVE" in prompt
    assert "42 to 45" in prompt


def test_recover_missing_stations_multi_pass(tmp_path):
    """Test _recover_missing_stations recovers missing stations."""
    chat = MagicMock()
    file_upload = MagicMock()
    template = "Extract {{START_PS}}-{{END_PS}}"
    out_file = str(tmp_path / "test_out.json")
    stations = [
        {"ps_no": 1, "station_type": "ALL VOTERS", "building": {}, "polling_areas": []},
        {"ps_no": 3, "station_type": "ALL VOTERS", "building": {}, "polling_areas": []},
    ]

    with patch(
        "helper.polling_station_details_extracter.execute_chunk_request"
    ) as mock_chunk:
        mock_chunk.return_value = (
            {"stations": [{"ps_no": 2, "station_type": "ALL VOTERS", "building": {}, "polling_areas": []}]},
            False,
        )
        still_missing = _recover_missing_stations(
            chat=chat,
            file_upload=file_upload,
            prompt_template=template,
            output_path=out_file,
            meta={"ac_no": 1},
            stations=stations,
            total_stations=3,
            max_retries=1,
        )

        assert still_missing == []
        station_nos = sorted([s["ps_no"] for s in stations])
        assert station_nos == [1, 2, 3]


@pytest.mark.parametrize(
    "cli_args,expected_total,expected_retries",
    [
        (["prog", "1", "--total", "344"], 344, 2),
        (["prog", "1", "-t", "150"], 150, 2),
        (["prog", "1", "--total-stations", "200", "--max-retries", "3"], 200, 3),
        (["prog", "1"], None, 2),
    ],
)
def test_main_cli_total_stations_param(cli_args, expected_total, expected_retries):
    """Test main() parses --total, -t, and --total-stations correctly."""
    with patch("sys.argv", cli_args), patch(
        "helper.polling_station_details_extracter.extract_polling_station_details"
    ) as mock_extract:
        main()
        mock_extract.assert_called_once()
        _, kwargs = mock_extract.call_args
        assert kwargs["total_stations"] == expected_total
        assert kwargs["max_recovery_retries"] == expected_retries



