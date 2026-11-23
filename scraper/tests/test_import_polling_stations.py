"""Unit tests for polling station DynamoDB importer."""

import os
import sys
import json
from unittest.mock import MagicMock, patch
import pytest

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from import_polling_stations import (
    build_dynamodb_item,
    normalize_station_for_import,
    PollingStationImporter,
    is_station_missing_details,
    is_entity_missing_details,
    merge_station_item,
)


def test_build_dynamodb_item_valid():
    """Test converting JSON station dictionary to DynamoDB item."""
    meta = {
        "ac_no": 1,
        "ac_name": "Gummidipoondi",
        "pc_no": 1,
        "pc_name": "Thiruvallur",
        "pc_category": "SC",
    }
    station = {
        "ps_no": 1,
        "sl_no": 1,
        "station_type": "ALL VOTERS",
        "has_overseas_electors": False,
        "building": {
            "name": "Panchayat Union Primary School",
            "category": "Primary School",
            "wing_portion": "North Building",
            "facing": "South Facing",
            "location": "Egumadurai",
            "pincode": "601201",
        },
        "polling_areas": [
            {
                "area_no": 1,
                "local_body_name": "Egumadurai",
                "local_body_types": ["R.V", "P"],
                "locality_or_street": "Egumadurai village",
                "ward_no": "1",
                "door_no_range": None,
            }
        ],
        "filter_metadata": {
            "pincode": "601201",
            "wards": ["1"],
            "local_bodies": ["Egumadurai"],
            "localities": ["Egumadurai village"],
            "search_keywords": ["egumadurai", "601201"],
        },
    }

    # Standard multi-entity primary keys
    item = build_dynamodb_item(station, meta)
    assert item is not None
    assert item["PK"] == "AC#TN#001"
    assert item["SK"] == "PS#0001"
    assert item["entity"] == "STATION"
    assert item["entity_type"] == "POLLING_STATION"
    assert item["constituency_id"] == "CONSTITUENCY#gummidipoondi"
    assert item["pincode"] == "601201"
    assert item["wards"] == ["1"]
    assert item["local_bodies"] == ["Egumadurai"]
    assert len(item["polling_areas"]) == 1

    # Legacy primary key mode
    legacy_item = build_dynamodb_item(station, meta, legacy_pk=True)
    assert legacy_item is not None
    assert legacy_item["PK"] == "CONSTITUENCY#gummidipoondi"
    assert legacy_item["SK"] == "PS#1"


def test_build_dynamodb_item_invalid():
    """Test handling invalid station or meta."""
    assert build_dynamodb_item({}, {"ac_name": "Gummidipoondi"}) is None
    assert build_dynamodb_item({"ps_no": 1}, {"ac_name": ""}) is None


def test_normalize_station_for_import():
    """Test normalizing station dictionary with mixed or legacy keys."""
    raw = {
        "ps_no": "16",
        "station_type": "ALL VOTERS",
        "has_overseas_electors": True,
        "building": {
            "name": "Middle School",
            "pincode": "601202",
        },
        "polling_areas": [
            {
                "area_no": 1,
                "local_body_name": "Kannampakkam",
                "local_body_types": ["P", "R.V"],
                "locality_or_street": "Kannapakkam",
                "ward_no": "1",
            }
        ],
        "filter_metadata": {
            "pincode": "601202",
            "local_bodies": ["kannampakkam"],
            "wards": ["1", "2"],
            "building_category": "MIDDLE_SCHOOL",
        },
    }
    norm = normalize_station_for_import(raw)
    assert norm["ps_no"] == 16
    assert norm["has_overseas_electors"] is True
    assert norm["filters"]["building_category"] == "MIDDLE_SCHOOL"
    assert "kannampakkam#1" in norm["filters"]["ward_keys"]
    assert norm["areas"][0]["is_revenue_village"] is True


def test_import_single_file_dictionary(tmp_path):
    """Test importing a single station bundle JSON file into DynamoDB."""
    fpath = tmp_path / "AC001_polling_stations.json"
    data = {
        "meta": {"ac_no": 1, "ac_name": "Gummidipoondi"},
        "stations": [
            {
                "ps_no": 1,
                "building": {"name": "School", "pincode": "601201", "category": "Primary School"},
                "filter_metadata": {
                    "pincode": "601201",
                    "local_bodies": ["egumadurai"],
                    "wards": ["1"],
                },
                "polling_areas": [
                    {
                        "area_no": 1,
                        "local_body_name": "Egumadurai",
                        "locality_or_street": "Main Road",
                        "ward_no": "1",
                    }
                ],
            }
        ],
    }
    fpath.write_text(json.dumps(data))

    mock_table = MagicMock()
    mock_batch = MagicMock()
    mock_table.batch_writer.return_value.__enter__.return_value = mock_batch

    with patch("boto3.resource") as mock_boto:
        mock_dynamo = MagicMock()
        mock_dynamo.Table.return_value = mock_table
        mock_boto.return_value = mock_dynamo

        importer = PollingStationImporter(table_name="knowyourmla_polling_stations")
        count = importer.import_single_file(str(fpath))

        # Station produces STATION, INDEX items (PIN, LB, WARD, CAT), LOCAL_BODY, PINCODE, AC_META
        assert count >= 5
        assert mock_batch.put_item.call_count == count

        written_items = [call[1]["Item"] for call in mock_batch.put_item.call_args_list]
        entities = {it.get("entity") for it in written_items}
        assert "STATION" in entities
        assert "INDEX" in entities
        assert "PINCODE" in entities
        assert "AC_META" in entities

        index_items = [it for it in written_items if it.get("entity") == "INDEX"]
        for idx in index_items:
            assert "GSI1PK" in idx
            assert "GSI1SK" in idx


def test_import_single_file_json_list(tmp_path):
    """Test importing a pre-compiled JSON list file (08_dynamodb_items.json)."""
    fpath = tmp_path / "08_dynamodb_items.json"
    items = [
        {"PK": "AC#TN#001", "SK": "META", "entity": "AC_META", "total_stations": 1},
        {"PK": "AC#TN#001", "SK": "PS#0001", "entity": "STATION", "ps_no": 1},
    ]
    fpath.write_text(json.dumps(items))

    mock_table = MagicMock()
    mock_batch = MagicMock()
    mock_table.batch_writer.return_value.__enter__.return_value = mock_batch

    with patch("boto3.resource") as mock_boto:
        mock_dynamo = MagicMock()
        mock_dynamo.Table.return_value = mock_table
        mock_boto.return_value = mock_dynamo

        importer = PollingStationImporter()
        count = importer.import_single_file(str(fpath))
        assert count == 2
        assert mock_batch.put_item.call_count == 2


def test_import_single_file_ndjson(tmp_path):
    """Test importing a streaming NDJSON file (08_dynamodb_items.ndjson)."""
    fpath = tmp_path / "08_dynamodb_items.ndjson"
    lines = [
        json.dumps({"PK": "AC#TN#001", "SK": "META", "entity": "AC_META"}),
        json.dumps({"PK": "AC#TN#001", "SK": "PS#0001", "entity": "STATION", "ps_no": 1}),
        json.dumps({
            "PK": "AC#TN#001",
            "SK": "IDX#PIN#601201#PS#0001",
            "entity": "INDEX",
            "GSI1PK": "AC#TN#001#PIN#601201",
            "GSI1SK": "PS#0001",
        }),
    ]
    fpath.write_text("\n".join(lines))

    mock_table = MagicMock()
    mock_batch = MagicMock()
    mock_table.batch_writer.return_value.__enter__.return_value = mock_batch

    with patch("boto3.resource") as mock_boto:
        mock_dynamo = MagicMock()
        mock_dynamo.Table.return_value = mock_table
        mock_boto.return_value = mock_dynamo

        importer = PollingStationImporter()
        count = importer.import_single_file(str(fpath))
        assert count == 3
        assert mock_batch.put_item.call_count == 3


def test_sanitize_null_pincode_in_ndjson(tmp_path):
    """Test that items with null pincode in NDJSON are sanitized so pincode is omitted."""
    fpath = tmp_path / "08_dynamodb_items.ndjson"
    lines = [
        json.dumps({
            "PK": "AC#TN#001",
            "SK": "IDX#LB#elavoor#PS#0029",
            "entity": "INDEX",
            "pincode": None,  # Must be stripped to avoid DynamoDB ValidationException on PincodeIndex
            "building_name": "Anganwadi Centre",
        }),
    ]
    fpath.write_text("\n".join(lines))

    mock_table = MagicMock()
    mock_batch = MagicMock()
    mock_table.batch_writer.return_value.__enter__.return_value = mock_batch

    with patch("boto3.resource") as mock_boto:
        mock_dynamo = MagicMock()
        mock_dynamo.Table.return_value = mock_table
        mock_boto.return_value = mock_dynamo

        importer = PollingStationImporter()
        count = importer.import_single_file(str(fpath))
        assert count == 1
        written_item = mock_batch.put_item.call_args[1]["Item"]
        assert "pincode" not in written_item
        assert written_item["building_name"] == "Anganwadi Centre"


def test_import_with_reload(tmp_path):
    """Test reloading constituency with clean purge of existing records."""
    fpath = tmp_path / "08_dynamodb_items.ndjson"
    fpath.write_text(json.dumps({"PK": "AC#TN#001", "SK": "META", "entity": "AC_META"}))

    mock_table = MagicMock()
    mock_batch = MagicMock()
    mock_table.batch_writer.return_value.__enter__.return_value = mock_batch

    # Mock query returning 2 existing items to delete
    mock_table.query.return_value = {
        "Items": [
            {"PK": "AC#TN#001", "SK": "META"},
            {"PK": "AC#TN#001", "SK": "PS#0001"},
        ]
    }

    with patch("boto3.resource") as mock_boto:
        mock_dynamo = MagicMock()
        mock_dynamo.Table.return_value = mock_table
        mock_boto.return_value = mock_dynamo

        importer = PollingStationImporter()
        count = importer.import_single_file(str(fpath), reload=True)
        assert count == 1
        assert mock_batch.delete_item.call_count == 2
        assert mock_batch.put_item.call_count == 1


def test_import_directory(tmp_path):
    """Test importing all JSON/NDJSON files from a directory."""
    f1 = tmp_path / "AC001_polling_stations.json"
    f2 = tmp_path / "AC002_polling_stations.ndjson"
    f1.write_text(json.dumps({"meta": {"ac_no": 1, "ac_name": "G"}, "stations": [{"ps_no": 1}]}))
    f2.write_text(json.dumps({"PK": "AC#TN#002", "SK": "META"}))

    with patch.object(PollingStationImporter, "import_single_file", return_value=5):
        with patch("boto3.resource"):
            importer = PollingStationImporter()
            total = importer.import_directory(str(tmp_path))
            assert total == 10


def test_import_directory_recursive_subdirs(tmp_path):
    """Test importing prioritized 08_dynamodb_items.ndjson files across AC subdirectories."""
    ac1_dir = tmp_path / "AC001"
    ac2_dir = tmp_path / "AC002"
    ac1_dir.mkdir()
    ac2_dir.mkdir()

    # AC1 has intermediate files and the target ndjson
    (ac1_dir / "01_raw_pages.json").write_text("{}")
    (ac1_dir / "08_dynamodb_items.ndjson").write_text('{"PK": "AC#TN#001", "SK": "META"}\n')

    # AC2 has target ndjson
    (ac2_dir / "08_dynamodb_items.ndjson").write_text('{"PK": "AC#TN#002", "SK": "META"}\n')

    with patch.object(PollingStationImporter, "import_single_file", return_value=1) as mock_single:
        with patch("boto3.resource"):
            importer = PollingStationImporter()
            total = importer.import_directory(str(tmp_path))
            assert total == 2
            assert mock_single.call_count == 2
            called_paths = [call[0][0] for call in mock_single.call_args_list]
            assert any("AC001/08_dynamodb_items.ndjson" in p for p in called_paths)
            assert any("AC002/08_dynamodb_items.ndjson" in p for p in called_paths)


def test_import_nonexistent_file():
    """Test FileNotFoundError on non-existent file path."""
    with patch("boto3.resource"):
        importer = PollingStationImporter()
        with pytest.raises(FileNotFoundError):
            importer.import_single_file("non_existent_file.json")


def test_is_station_missing_details():
    """Test detecting missing fields and details between existing and incoming stations."""
    existing_complete = {
        "PK": "AC#TN#001",
        "SK": "PS#0001",
        "ps_no": 1,
        "station_type": "ALL VOTERS",
        "has_overseas_electors": False,
        "pincode": "601201",
        "building": {
            "name": "Primary School",
            "location": "Egumadurai",
            "pincode": "601201",
            "facing": "South Facing",
            "wing_portion": "North Wing",
            "category": "Primary School",
        },
        "polling_areas": [{"area_no": 1, "locality_or_street": "Street 1"}],
        "wards": ["1"],
        "local_bodies": ["Egumadurai"],
    }

    incoming_same = dict(existing_complete)
    is_missing, reasons = is_station_missing_details(existing_complete, incoming_same)
    assert is_missing is False
    assert len(reasons) == 0

    # Existing missing pincode
    existing_no_pin = dict(existing_complete)
    existing_no_pin["pincode"] = ""
    is_missing, reasons = is_station_missing_details(existing_no_pin, incoming_same)
    assert is_missing is True
    assert "pincode" in reasons

    # Existing missing building location
    existing_no_loc = {
        **existing_complete,
        "building": {"name": "Primary School", "pincode": "601201"},
    }
    is_missing, reasons = is_station_missing_details(existing_no_loc, incoming_same)
    assert is_missing is True
    assert "building.location" in reasons

    # Existing empty areas but incoming has areas
    existing_no_areas = {**existing_complete, "polling_areas": []}
    is_missing, reasons = is_station_missing_details(existing_no_areas, incoming_same)
    assert is_missing is True
    assert "polling_areas" in reasons

    # Existing missing has_overseas_electors when incoming has overseas electors
    incoming_overseas = dict(existing_complete)
    incoming_overseas["has_overseas_electors"] = True
    existing_no_overseas = dict(existing_complete)
    existing_no_overseas["has_overseas_electors"] = False
    is_missing, reasons = is_station_missing_details(existing_no_overseas, incoming_overseas)
    assert is_missing is True
    assert "has_overseas_electors" in reasons


def test_is_entity_missing_details():
    """Test entity-level missing detail detection for META, PINCODE, LOCAL_BODY, INDEX."""
    meta_existing = {"PK": "AC#TN#001", "SK": "META", "entity": "AC_META", "total_stations": 100}
    meta_incoming = {"PK": "AC#TN#001", "SK": "META", "entity": "AC_META", "total_stations": 105}
    is_missing, reasons = is_entity_missing_details(meta_existing, meta_incoming)
    assert is_missing is True
    assert "total_stations" in reasons

    pin_existing = {"PK": "AC#TN#001", "SK": "PIN#601201", "entity": "PINCODE", "station_nos": [1]}
    pin_incoming = {"PK": "AC#TN#001", "SK": "PIN#601201", "entity": "PINCODE", "station_nos": [1, 2]}
    is_missing, reasons = is_entity_missing_details(pin_existing, pin_incoming)
    assert is_missing is True
    assert "station_nos" in reasons


def test_merge_station_item():
    """Test non-destructive merging of newly found details into existing station."""
    existing = {
        "PK": "AC#TN#001",
        "SK": "PS#0001",
        "ps_no": 1,
        "pincode": "",
        "created_at": "2026-01-01T00:00:00Z",
        "building": {"name": "Primary School"},
        "polling_areas": [],
    }
    incoming = {
        "PK": "AC#TN#001",
        "SK": "PS#0001",
        "ps_no": 1,
        "pincode": "601201",
        "building": {
            "name": "Primary School",
            "location": "Egumadurai",
            "pincode": "601201",
        },
        "polling_areas": [{"area_no": 1, "locality_or_street": "Main Road"}],
        "wards": ["1"],
    }

    merged = merge_station_item(existing, incoming)
    assert merged["pincode"] == "601201"
    assert merged["building"]["location"] == "Egumadurai"
    assert merged["building"]["pincode"] == "601201"
    assert len(merged["polling_areas"]) == 1
    assert merged["wards"] == ["1"]
    assert merged["created_at"] == "2026-01-01T00:00:00Z"
    assert "updated_at" in merged


def test_filter_missing_items_delta_and_force():
    """Test filter_missing_items filters out complete stations unless force=True."""
    mock_table = MagicMock()
    importer = PollingStationImporter()
    importer.table = mock_table

    existing_db = {
        "PS#0001": {
            "PK": "AC#TN#001",
            "SK": "PS#0001",
            "entity": "STATION",
            "ps_no": 1,
            "pincode": "601201",
            "station_type": "ALL VOTERS",
            "has_overseas_electors": False,
            "building": {"name": "School 1", "location": "Loc 1", "pincode": "601201"},
            "polling_areas": [{"area_no": 1}],
        },
        "PS#0002": {
            "PK": "AC#TN#001",
            "SK": "PS#0002",
            "entity": "STATION",
            "ps_no": 2,
            "pincode": None,
            "building": {"name": "School 2"},
            "polling_areas": [],
        },
        "IDX#PIN#601201#PS#0001": {
            "PK": "AC#TN#001",
            "SK": "IDX#PIN#601201#PS#0001",
            "entity": "INDEX",
            "GSI1PK": "AC#TN#001#PIN#601201",
            "GSI1SK": "PS#0001",
            "pincode": "601201",
        },
    }

    incoming_items = [
        # Station 1 is complete in DB and incoming
        {
            "PK": "AC#TN#001",
            "SK": "PS#0001",
            "entity": "STATION",
            "ps_no": 1,
            "pincode": "601201",
            "station_type": "ALL VOTERS",
            "has_overseas_electors": False,
            "building": {"name": "School 1", "location": "Loc 1", "pincode": "601201"},
            "polling_areas": [{"area_no": 1}],
        },
        # Station 2 was missing pincode, now incoming has pincode
        {
            "PK": "AC#TN#001",
            "SK": "PS#0002",
            "entity": "STATION",
            "ps_no": 2,
            "pincode": "601202",
            "station_type": "ALL VOTERS",
            "has_overseas_electors": False,
            "building": {"name": "School 2", "location": "Loc 2", "pincode": "601202"},
            "polling_areas": [{"area_no": 1}],
        },
        # Station 3 is completely new
        {
            "PK": "AC#TN#001",
            "SK": "PS#0003",
            "entity": "STATION",
            "ps_no": 3,
            "pincode": "601203",
        },
        # Index item for Station 1
        {"PK": "AC#TN#001", "SK": "IDX#PIN#601201#PS#0001", "entity": "INDEX"},
        # Index item for Station 2
        {"PK": "AC#TN#001", "SK": "IDX#PIN#601202#PS#0002", "entity": "INDEX"},
        # Index item for Station 3
        {"PK": "AC#TN#001", "SK": "IDX#PIN#601203#PS#0003", "entity": "INDEX"},
        # AC_META
        {"PK": "AC#TN#001", "SK": "META", "entity": "AC_META"},
    ]

    with patch.object(importer, "get_existing_constituency_items", return_value=existing_db):
        # 1. Delta mode (filter_missing_items)
        delta_items, stats = importer.filter_missing_items("AC#TN#001", incoming_items)
        delta_sks = {it["SK"] for it in delta_items}

        # Station 1 must be skipped because it is already complete
        assert "PS#0001" not in delta_sks
        assert "IDX#PIN#601201#PS#0001" not in delta_sks

        # Station 2 (updated) and Station 3 (new) must be present
        assert "PS#0002" in delta_sks
        assert "PS#0003" in delta_sks
        assert "IDX#PIN#601202#PS#0002" in delta_sks
        assert "IDX#PIN#601203#PS#0003" in delta_sks
        assert "META" in delta_sks
        assert stats["updated_stations"] == 1
        assert stats["new_stations"] == 1
        assert stats["skipped_items"] >= 2

        # 2. Delta import via _import_constituency_items (force=False)
        with patch.object(importer, "_write_items_batch", return_value=len(delta_items)) as mock_write:
            count = importer._import_constituency_items("AC#TN#001", incoming_items, force=False)
            assert count == len(delta_items)
            mock_write.assert_called_once_with(delta_items)

        # 3. Force import via _import_constituency_items (force=True)
        with patch.object(importer, "_write_items_batch", return_value=len(incoming_items)) as mock_write_force:
            count_forced = importer._import_constituency_items("AC#TN#001", incoming_items, force=True)
            assert count_forced == len(incoming_items)
            mock_write_force.assert_called_once_with(incoming_items)


def test_import_with_ac_filter(tmp_path):
    """Test importing with ac_filter processes only matching constituencies."""
    fpath = tmp_path / "08_dynamodb_items.ndjson"
    lines = [
        json.dumps({"PK": "AC#TN#001", "SK": "META", "entity": "AC_META"}),
        json.dumps({"PK": "AC#TN#001", "SK": "PS#0001", "entity": "STATION", "ps_no": 1}),
        json.dumps({"PK": "AC#TN#002", "SK": "META", "entity": "AC_META"}),
        json.dumps({"PK": "AC#TN#002", "SK": "PS#0001", "entity": "STATION", "ps_no": 1}),
    ]
    fpath.write_text("\n".join(lines))

    mock_table = MagicMock()
    mock_batch = MagicMock()
    mock_table.batch_writer.return_value.__enter__.return_value = mock_batch

    with patch("boto3.resource") as mock_boto:
        mock_dynamo = MagicMock()
        mock_dynamo.Table.return_value = mock_table
        mock_boto.return_value = mock_dynamo

        importer = PollingStationImporter()
        with patch.object(importer, "get_existing_constituency_items", return_value={}):
            count = importer.import_single_file(str(fpath), force=True, ac_filter=1)
            # Only AC001 items should be written
            assert count == 2
            written_pks = {call[1]["Item"]["PK"] for call in mock_batch.put_item.call_args_list}
            assert written_pks == {"AC#TN#001"}


def test_constituency_exists():
    """Test checking constituency existence in DynamoDB."""
    mock_table = MagicMock()
    importer = PollingStationImporter()
    importer.table = mock_table

    # When items exist
    mock_table.query.return_value = {"Items": [{"PK": "AC#TN#001", "SK": "META"}]}
    assert importer.constituency_exists("AC#TN#001") is True

    # When no items exist
    mock_table.query.return_value = {"Items": []}
    assert importer.constituency_exists("AC#TN#002") is False

    # When query raises exception
    mock_table.query.side_effect = Exception("DB error")
    assert importer.constituency_exists("AC#TN#003") is False


def test_filter_missing_items_missing_only():
    """Test missing_only=True ignores existing stations even if they have missing details."""
    mock_table = MagicMock()
    importer = PollingStationImporter()
    importer.table = mock_table

    existing_db = {
        "PS#0001": {
            "PK": "AC#TN#001",
            "SK": "PS#0001",
            "entity": "STATION",
            "ps_no": 1,
            "pincode": "601201",
        },
        "PS#0002": {
            "PK": "AC#TN#001",
            "SK": "PS#0002",
            "entity": "STATION",
            "ps_no": 2,
            "pincode": None,  # Existing station has missing pincode
        },
    }

    incoming_items = [
        # Station 1 exists
        {"PK": "AC#TN#001", "SK": "PS#0001", "entity": "STATION", "ps_no": 1, "pincode": "601201"},
        # Station 2 exists with new pincode
        {"PK": "AC#TN#001", "SK": "PS#0002", "entity": "STATION", "ps_no": 2, "pincode": "601202"},
        # Station 3 is completely missing from DB
        {"PK": "AC#TN#001", "SK": "PS#0003", "entity": "STATION", "ps_no": 3, "pincode": "601203"},
        # Meta item
        {"PK": "AC#TN#001", "SK": "META", "entity": "AC_META"},
    ]

    with patch.object(importer, "get_existing_constituency_items", return_value=existing_db):
        # missing_only=True: Station 2 MUST be skipped (no update to existing stations)
        items_to_write, stats = importer.filter_missing_items("AC#TN#001", incoming_items, missing_only=True)
        written_sks = {it["SK"] for it in items_to_write}

        assert "PS#0001" not in written_sks
        assert "PS#0002" not in written_sks  # Skipped!
        assert "PS#0003" in written_sks      # Kept because missing station!
        assert "META" in written_sks         # Updated to reflect new station
        assert stats["new_stations"] == 1
        assert stats["updated_stations"] == 0
        assert stats["skipped_items"] == 2


def test_import_with_missing_constituencies_only(tmp_path):
    """Test missing_constituencies_only skips existing constituencies without loading all records."""
    fpath = tmp_path / "AC001_polling_stations.ndjson"
    lines = [
        json.dumps({"PK": "AC#TN#001", "SK": "META", "entity": "AC_META"}),
        json.dumps({"PK": "AC#TN#001", "SK": "PS#0001", "entity": "STATION", "ps_no": 1}),
    ]
    fpath.write_text("\n".join(lines))

    mock_table = MagicMock()
    importer = PollingStationImporter()
    importer.table = mock_table

    with patch.object(importer, "constituency_exists", return_value=True):
        with patch.object(importer, "_write_items_batch") as mock_write:
            count = importer.import_single_file(str(fpath), missing_constituencies_only=True)
            assert count == 0
            mock_write.assert_not_called()


