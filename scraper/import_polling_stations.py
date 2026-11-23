#!/usr/bin/env python3
"""Imports extracted Polling Station master data into DynamoDB table knowyourmla_polling_stations.

Supports:
- .ndjson files (streaming line-by-line)
- .json pre-generated item lists (08_dynamodb_items.json)
- .json station bundles (07_final_stations.json, AC001_polling_stations.json)
  with dynamic expansion to 5 entity types: AC_META, STATION, INDEX, LOCAL_BODY, PINCODE.
- Clean reload support (--reload / --clean) to purge existing constituency records
  before re-importing, preventing stale index items.
"""

import os
import sys
import re
import json
import argparse
import logging
from decimal import Decimal
from datetime import datetime, timezone
from collections import Counter
from typing import Dict, List, Any, Optional, Tuple, Set

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

sys.path.append(os.path.dirname(__file__))
from utils import normalize_name, convert_floats_to_decimal
from helper.polling_station_details_extracter import build_dynamodb_items

POLLING_STATIONS_TABLE = "knowyourmla_polling_stations"
REGION_NAME = "ap-south-2"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def _parse_importer_station_numbers(station: Dict[str, Any]) -> Tuple[Optional[str], int, int]:
    """Extracts ps_no string, ps_no int, and sl_no from station dictionary.

    Args:
        station: Station dictionary.

    Returns:
        Tuple of (ps_no_str, ps_no_int, sl_no).
    """
    ps_val = station.get("ps_no") or station.get("ps")
    if ps_val is None:
        return None, 1, 1
    ps_no_str = str(ps_val).strip()
    ps_no_int = int(ps_no_str) if ps_no_str.isdigit() else 1

    sl_val = station.get("sl_no")
    if sl_val is not None:
        try:
            sl_no = int(sl_val)
        except (ValueError, TypeError):
            sl_no = ps_no_int
    else:
        sl_no = ps_no_int
    return ps_no_str, ps_no_int, sl_no


def _extract_clean_wards(filter_meta: Dict[str, Any]) -> List[str]:
    """Extracts and sorts clean ward numbers.

    Args:
        filter_meta: Filter metadata dictionary.

    Returns:
        Sorted list of ward strings.
    """
    raw_wards = filter_meta.get("wards", filter_meta.get("ward_nos", []))
    clean_wards = set()
    for w in raw_wards:
        digits = re.findall(r"\b\d+\b", str(w))
        if digits:
            for d in digits:
                clean_wards.add(d)
        elif str(w).strip():
            clean_wards.add(str(w).strip())
    return sorted(list(clean_wards), key=lambda x: int(x) if x.isdigit() else 999)


def _normalize_single_area(a: Dict[str, Any], idx: int) -> Dict[str, Any]:
    """Normalizes a single area record.

    Args:
        a: Raw area dictionary.
        idx: 1-based area fallback index.

    Returns:
        Structured area dictionary.
    """
    lb_name = a.get("local_body_canonical") or a.get("local_body_name") or ""
    lb_id = a.get("local_body_id") or normalize_name(lb_name)
    locality = a.get("locality") or a.get("locality_or_street") or ""
    ward_val = a.get("ward_no")
    ward_nos = a.get("ward_nos")
    if not ward_nos:
        ward_nos = [str(ward_val)] if ward_val is not None else []
    types = a.get("local_body_types", [])
    is_rv = bool(a.get("is_revenue_village") or ("R.V" in types))
    clean_wards = [str(w).strip() for w in ward_nos if str(w).strip()]
    return {
        "area_no": a.get("area_no", idx),
        "locality": locality,
        "local_body_canonical": lb_name,
        "local_body_id": lb_id,
        "local_body_type": a.get("local_body_type", "P"),
        "is_revenue_village": is_rv,
        "ward_nos": clean_wards,
        "door_from": a.get("door_from"),
        "door_to": a.get("door_to"),
    }


def _normalize_import_areas(station: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Normalizes areas or polling_areas from a station record.

    Args:
        station: Station dictionary.

    Returns:
        List of normalized area dictionaries.
    """
    raw_areas = station.get("areas") or station.get("polling_areas") or []
    return [
        _normalize_single_area(a, idx)
        for idx, a in enumerate(raw_areas, start=1)
        if isinstance(a, dict)
    ]


def _resolve_filter_ids(fm: Dict[str, Any], primary_key: str, fallback_key: str) -> List[str]:
    """Resolves and normalizes string IDs from primary or fallback filter keys.

    Args:
        fm: Filter metadata dictionary.
        primary_key: Direct list key (e.g. 'local_body_ids').
        fallback_key: Fallback list key (e.g. 'local_bodies').

    Returns:
        List of normalized ID strings.
    """
    direct = fm.get(primary_key)
    if direct:
        return [str(x) for x in direct if x]
    fallback = fm.get(fallback_key, [])
    return [normalize_name(str(x)) for x in fallback if x]


def _resolve_ward_keys(fm: Dict[str, Any], lb_ids: List[str], wards: List[str]) -> List[str]:
    """Resolves ward keys (local_body_id#ward).

    Args:
        fm: Filter metadata dictionary.
        lb_ids: List of local body IDs.
        wards: List of clean ward numbers.

    Returns:
        List of composite ward keys.
    """
    keys = list(fm.get("ward_keys") or [])
    if not keys and lb_ids and wards:
        for lb in lb_ids:
            for w in wards:
                keys.append(f"{lb}#{w}")
    return keys


def _normalize_import_filters(station: Dict[str, Any], building: Dict[str, Any]) -> Dict[str, Any]:
    """Normalizes filter metadata dictionary.

    Args:
        station: Station dictionary.
        building: Building dictionary.

    Returns:
        Normalized filters dictionary.
    """
    fm = station.get("filters") or station.get("filter_metadata") or {}
    pin = fm.get("pincode") or building.get("pincode")
    pincodes = [str(pin).strip()] if pin else [str(p) for p in fm.get("pincodes", []) if p]
    lb_ids = _resolve_filter_ids(fm, "local_body_ids", "local_bodies")
    rv_ids = [str(r) for r in fm.get("rv_ids", []) if r]
    wards = _extract_clean_wards(fm)
    ward_keys = _resolve_ward_keys(fm, lb_ids, wards)
    loc_ids = _resolve_filter_ids(fm, "locality_ids", "localities")
    cat = fm.get("building_category") or building.get("category", "OTHER")

    return {
        "pincodes": pincodes,
        "local_body_ids": lb_ids,
        "rv_ids": rv_ids,
        "ward_nos": wards,
        "ward_keys": ward_keys,
        "locality_ids": loc_ids,
        "building_category": str(cat).upper().replace(" ", "_"),
        "search_keywords": fm.get("search_keywords", []),
    }


def normalize_station_for_import(station: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures a station record has normalized fields for multi-entity generation.

    Args:
        station: Raw or partially structured station dictionary.

    Returns:
        Dictionary conforming to expected schema.
    """
    _, ps_int, sl_no = _parse_importer_station_numbers(station)
    building = station.get("building") or {}
    if not isinstance(building, dict):
        building = {}

    areas = _normalize_import_areas(station)
    filters = _normalize_import_filters(station, building)
    search_keywords = filters.get("search_keywords", [])
    search_text = station.get("search_text") or " ".join(search_keywords)

    return {
        "ps_no": ps_int if ps_int else 1,
        "ps_no_suffix": station.get("ps_no_suffix"),
        "sl_no": sl_no,
        "station_type": station.get("station_type") or "ALL VOTERS",
        "has_overseas_electors": bool(station.get("has_overseas_electors")),
        "building": building,
        "areas": areas,
        "filters": filters,
        "search_text": search_text.lower().strip(),
        "needs_review": bool(station.get("needs_review", False)),
        "review": station.get("review") or {"status": "ok", "reasons": []},
    }


def _resolve_station_keys(
    meta: Dict[str, Any],
    ps_no_str: str,
    ps_no_int: int,
    state_code: str,
    legacy_pk: bool,
) -> Tuple[Optional[str], Optional[str], Optional[str], int]:
    """Resolves PK, SK, constituency_id and ac_no for a station item.

    Args:
        meta: Constituency metadata dictionary.
        ps_no_str: String representation of station number.
        ps_no_int: Integer representation of station number.
        state_code: State ISO code.
        legacy_pk: Whether to use legacy PK pattern.

    Returns:
        Tuple of (pk, sk, const_id, ac_no_int) or (None, None, None, 0) if invalid.
    """
    raw_ac_name = meta.get("ac_name", "")
    const_norm = normalize_name(raw_ac_name)
    if not const_norm:
        return None, None, None, 0

    try:
        ac_no_int = int(meta.get("ac_no", 1))
    except (ValueError, TypeError):
        ac_no_int = 1

    const_id = f"CONSTITUENCY#{const_norm}"
    pk_val = const_id if legacy_pk else f"AC#{state_code}#{ac_no_int:03d}"
    sk_val = f"PS#{ps_no_str}" if legacy_pk else f"PS#{ps_no_int:04d}"
    return pk_val, sk_val, const_id, ac_no_int


def build_dynamodb_item(
    station: Dict[str, Any],
    meta: Dict[str, Any],
    state_code: str = "TN",
    state_name: str = "Tamil Nadu",
    legacy_pk: bool = False,
) -> Optional[Dict[str, Any]]:
    """Transforms an extracted station record into a single STATION DynamoDB item.

    Args:
        station: Extracted polling station dictionary.
        meta: Constituency metadata dictionary.
        state_code: State ISO code (default: 'TN').
        state_name: State display name (default: 'Tamil Nadu').
        legacy_pk: If True, uses legacy PK = 'CONSTITUENCY#{slug}'. Otherwise uses 'AC#{state}#{ac_no:03d}'.

    Returns:
        Structured DynamoDB item dictionary or None if invalid.
    """
    ps_no_str, ps_no_int, sl_no = _parse_importer_station_numbers(station)
    if ps_no_str is None:
        return None

    pk_val, sk_val, const_id, ac_no_int = _resolve_station_keys(
        meta, ps_no_str, ps_no_int, state_code, legacy_pk
    )
    if not pk_val:
        return None

    building = station.get("building") or {}
    filter_meta = station.get("filters") or station.get("filter_metadata") or {}
    raw_pincode = filter_meta.get("pincode") or building.get("pincode")
    areas = station.get("areas") or station.get("polling_areas", [])
    has_split = any(bool(a.get("door_no_range")) for a in areas if isinstance(a, dict))

    item = {
        "PK": pk_val,
        "SK": sk_val,
        "entity": "STATION",
        "entity_type": "POLLING_STATION",
        "state_code": state_code,
        "state_name": state_name,
        "constituency_id": const_id,
        "constituency_slug": normalize_name(meta.get("ac_name", "")),
        "ac_no": ac_no_int,
        "ac_name": meta.get("ac_name", ""),
        "pc_no": meta.get("pc_no"),
        "pc_name": meta.get("pc_name"),
        "pc_category": meta.get("pc_category", "GEN"),
        "polling_station_no": ps_no_str,
        "ps_no": ps_no_int,
        "sl_no": sl_no,
        "station_type": station.get("station_type") or "ALL VOTERS",
        "has_overseas_electors": bool(station.get("has_overseas_electors")),
        "building": building,
        "building_category": filter_meta.get("building_category") or building.get("category", "Other"),
        "facing_direction": building.get("facing") or "",
        "has_door_split": has_split,
        "wards": _extract_clean_wards(filter_meta),
        "local_bodies": filter_meta.get("local_bodies", filter_meta.get("local_body_ids", [])),
        "localities": filter_meta.get("localities", filter_meta.get("locality_ids", [])),
        "areas": areas,
        "polling_areas": areas,
        "search_keywords": filter_meta.get("search_keywords", []),
        "created_at": int(datetime.now(timezone.utc).timestamp()),
    }
    if raw_pincode:
        item["pincode"] = str(raw_pincode).strip()
    return convert_floats_to_decimal(item)


GSI_KEYS = {"pincode", "constituency_id", "polling_station_no", "GSI1PK", "GSI1SK"}


def sanitize_dynamodb_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitizes an item before writing to DynamoDB.

    Removes any top-level GSI key attributes that are None, empty strings,
    or invalid types to prevent DynamoDB ValidationException on sparse GSIs.

    Args:
        item: Raw DynamoDB item dictionary.

    Returns:
        Sanitized DynamoDB item dictionary.
    """
    clean_item = {}
    for k, v in item.items():
        if k in GSI_KEYS and (v is None or (isinstance(v, str) and not v.strip())):
            continue
        clean_item[k] = v
    return clean_item


def is_empty_value(val: Any) -> bool:
    """Checks whether a value is considered empty, None, or blank.

    Args:
        val: Any Python object.

    Returns:
        True if the value is None, empty string/whitespace, empty list, or empty dict.
    """
    if val is None:
        return True
    if isinstance(val, str) and not val.strip():
        return True
    if isinstance(val, (list, dict, set)) and len(val) == 0:
        return True
    return False


def _check_building_missing_details(
    existing_building: Any,
    incoming_building: Any,
) -> List[str]:
    """Checks for missing subfields in building dictionary.

    Args:
        existing_building: Building dict from DynamoDB.
        incoming_building: Building dict from incoming item.

    Returns:
        List of missing building field names.
    """
    if is_empty_value(existing_building) and not is_empty_value(incoming_building):
        return ["building"]
    if not isinstance(existing_building, dict) or not isinstance(incoming_building, dict):
        return []

    missing = []
    for sub_k in ("name", "location", "pincode", "facing", "wing_portion", "category"):
        if not is_empty_value(incoming_building.get(sub_k)) and is_empty_value(existing_building.get(sub_k)):
            missing.append(f"building.{sub_k}")
    return missing


def is_station_missing_details(
    existing: Dict[str, Any],
    incoming: Dict[str, Any],
) -> Tuple[bool, List[str]]:
    """Determines if an existing station in DynamoDB is missing details present in incoming item.

    Args:
        existing: Existing DynamoDB STATION item.
        incoming: Newly extracted STATION item.

    Returns:
        Tuple of (is_missing_bool, list_of_missing_field_names).
    """
    missing_fields: List[str] = []

    for field in ("pincode", "facing_direction", "station_type", "search_text", "building_category"):
        if not is_empty_value(incoming.get(field)) and is_empty_value(existing.get(field)):
            missing_fields.append(field)

    building_missing = _check_building_missing_details(
        existing.get("building"), incoming.get("building")
    )
    missing_fields.extend(building_missing)

    for list_field in ("areas", "polling_areas", "local_bodies", "localities", "wards", "search_keywords"):
        in_list = incoming.get(list_field) or []
        ex_list = existing.get(list_field) or []
        if in_list and not ex_list:
            missing_fields.append(list_field)
        elif len(in_list) > len(ex_list):
            missing_fields.append(f"{list_field}(more_items)")

    if incoming.get("has_overseas_electors") and not existing.get("has_overseas_electors"):
        missing_fields.append("has_overseas_electors")

    return (len(missing_fields) > 0, missing_fields)


def merge_station_item(existing: Dict[str, Any], incoming: Dict[str, Any]) -> Dict[str, Any]:
    """Merges missing details from incoming item into existing DynamoDB station item.

    Preserves existing metadata and updates with newly extracted details.

    Args:
        existing: Existing DynamoDB station item.
        incoming: Newly extracted station item.

    Returns:
        Merged and sanitized DynamoDB item.
    """
    merged = dict(existing)
    for k, v in incoming.items():
        if is_empty_value(v):
            continue
        if is_empty_value(merged.get(k)):
            merged[k] = v
        elif isinstance(v, dict) and isinstance(merged.get(k), dict):
            sub_dict = dict(merged[k])
            for sub_k, sub_v in v.items():
                if not is_empty_value(sub_v) and is_empty_value(sub_dict.get(sub_k)):
                    sub_dict[sub_k] = sub_v
            merged[k] = sub_dict
        elif isinstance(v, list) and isinstance(merged.get(k), list):
            if len(v) > len(merged[k]):
                merged[k] = v
        else:
            merged[k] = v

    if "created_at" in existing and existing["created_at"]:
        merged["created_at"] = existing["created_at"]
    merged["updated_at"] = int(datetime.now(timezone.utc).timestamp())
    return sanitize_dynamodb_item(convert_floats_to_decimal(merged))


def _is_meta_missing_details(existing: Dict[str, Any], incoming: Dict[str, Any]) -> List[str]:
    """Checks if AC_META has missing fields or increased total stations."""
    missing = []
    for k in ("total_stations", "pincodes", "local_body_count", "needs_review_count"):
        if not is_empty_value(incoming.get(k)) and is_empty_value(existing.get(k)):
            missing.append(k)
    if (incoming.get("total_stations") or 0) > (existing.get("total_stations") or 0):
        missing.append("total_stations")
    return missing


def _is_lookup_missing_details(existing: Dict[str, Any], incoming: Dict[str, Any]) -> List[str]:
    """Checks if LOCAL_BODY or PINCODE has more stations in incoming item."""
    in_stations = incoming.get("station_nos") or []
    ex_stations = existing.get("station_nos") or []
    return ["station_nos"] if len(in_stations) > len(ex_stations) else []


def _is_index_missing_details(existing: Dict[str, Any], incoming: Dict[str, Any]) -> List[str]:
    """Checks if INDEX item has missing GSI attributes or location fields."""
    missing = []
    for k in ("GSI1PK", "GSI1SK", "pincode", "location", "building_name"):
        if not is_empty_value(incoming.get(k)) and is_empty_value(existing.get(k)):
            missing.append(k)
    return missing


def is_entity_missing_details(
    existing: Dict[str, Any],
    incoming: Dict[str, Any],
) -> Tuple[bool, List[str]]:
    """Checks if an existing non-station entity has missing details compared to incoming.

    Args:
        existing: Existing DynamoDB item.
        incoming: Incoming DynamoDB item.

    Returns:
        Tuple of (is_missing_bool, list_of_missing_field_names).
    """
    entity = incoming.get("entity", "")
    if entity == "AC_META":
        missing = _is_meta_missing_details(existing, incoming)
    elif entity in ("LOCAL_BODY", "PINCODE"):
        missing = _is_lookup_missing_details(existing, incoming)
    elif entity == "INDEX":
        missing = _is_index_missing_details(existing, incoming)
    else:
        missing = []
    return (len(missing) > 0, missing)


def _evaluate_candidate_item(
    it: Dict[str, Any],
    existing: Dict[str, Dict[str, Any]],
    missing_only: bool = False,
) -> Tuple[Optional[Dict[str, Any]], str]:
    """Evaluates whether an item should be written to DynamoDB.

    Args:
        it: Candidate item dictionary.
        existing: Existing items map (SK -> item).
        missing_only: If True, only returns items that do not exist in existing map.

    Returns:
        Tuple of (item_to_write_or_None, category_name).
    """
    sk = it.get("SK")
    if not sk:
        return None, "skipped"

    is_station = it.get("entity") == "STATION" or sk.startswith("PS#")
    if sk not in existing:
        return it, "new_station" if is_station else "new_other"

    if missing_only:
        return None, "skipped"

    existing_it = existing[sk]
    if is_station:
        is_missing, _ = is_station_missing_details(existing_it, it)
        if is_missing:
            return merge_station_item(existing_it, it), "updated_station"
        return None, "skipped"

    is_missing, _ = is_entity_missing_details(existing_it, it)
    if is_missing:
        return it, "updated_other"
    return None, "skipped"


def _group_items_by_pk(
    items: List[Dict[str, Any]],
    state_code: str,
    ac_filter: Optional[int] = None,
) -> Dict[str, List[Dict[str, Any]]]:
    """Groups items by partition key and applies optional constituency filter.

    Args:
        items: List of all DynamoDB items.
        state_code: Default state ISO code.
        ac_filter: Optional AC number filter.

    Returns:
        Dictionary mapping PK -> list of items.
    """
    by_pk: Dict[str, List[Dict[str, Any]]] = {}
    for it in items:
        pk = it.get("PK")
        if pk:
            by_pk.setdefault(pk, []).append(it)

    if ac_filter is None:
        return by_pk

    expected_pk = f"AC#{state_code}#{ac_filter:03d}"
    filtered = {}
    for pk, it_list in by_pk.items():
        if pk == expected_pk or f"#{ac_filter:03d}" in pk or (it_list and it_list[0].get("ac_no") == ac_filter):
            filtered[pk] = it_list
    return filtered


def _matches_ac_filter(path_str: str, ac_filter: Optional[int]) -> bool:
    """Checks if a file path matches the specified constituency number.

    Args:
        path_str: File or directory path.
        ac_filter: Optional Assembly Constituency number.

    Returns:
        True if matching or if no filter is set.
    """
    if ac_filter is None:
        return True
    m = re.search(r"AC[-_]?(\d+)", path_str, re.I)
    return bool(m and int(m.group(1)) == ac_filter)


def _load_ndjson_items(file_path: str) -> List[Dict[str, Any]]:
    """Loads items from an NDJSON file.

    Args:
        file_path: Path to .ndjson file.

    Returns:
        List of deserialized item dictionaries.
    """
    items = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line_str = line.strip()
            if line_str:
                raw_item = convert_floats_to_decimal(json.loads(line_str, parse_float=Decimal))
                items.append(sanitize_dynamodb_item(raw_item))
    return items


def _load_json_items(file_path: str) -> Any:
    """Loads JSON file content.

    Args:
        file_path: Path to .json file.

    Returns:
        Parsed JSON data (dict or list).
    """
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _collect_import_files(dir_path: str, ac_filter: Optional[int] = None) -> List[str]:
    """Finds all candidate polling station import files in a directory.

    Prioritizes 08_dynamodb_items.ndjson across subdirectories to avoid importing
    intermediate pipeline JSON files (01_raw_pages.json, 03_parsed.json, etc.).

    Args:
        dir_path: Root directory to search.
        ac_filter: Optional Assembly Constituency number filter.

    Returns:
        Sorted list of file paths to import.
    """
    ndjson_files = []
    for root, _, filenames in os.walk(dir_path):
        if "08_dynamodb_items.ndjson" in filenames:
            fpath = os.path.join(root, "08_dynamodb_items.ndjson")
            if _matches_ac_filter(fpath, ac_filter):
                ndjson_files.append(fpath)
    if ndjson_files:
        return sorted(ndjson_files)

    json_items = []
    for root, _, filenames in os.walk(dir_path):
        if "08_dynamodb_items.json" in filenames:
            fpath = os.path.join(root, "08_dynamodb_items.json")
            if _matches_ac_filter(fpath, ac_filter):
                json_items.append(fpath)
    if json_items:
        return sorted(json_items)

    direct_files = []
    for f in os.listdir(dir_path):
        fpath = os.path.join(dir_path, f)
        if os.path.isfile(fpath) and (f.endswith(".json") or f.endswith(".ndjson")):
            if _matches_ac_filter(fpath, ac_filter):
                direct_files.append(fpath)
    return sorted(direct_files)


class PollingStationImporter:
    """Imports extracted polling station files into DynamoDB table."""

    def __init__(
        self,
        table_name: str = POLLING_STATIONS_TABLE,
        region: str = REGION_NAME,
        state_code: str = "TN",
        state_name: str = "Tamil Nadu",
        dynamodb_resource: Optional[Any] = None,
    ):
        """Initializes DynamoDB table connection.

        Args:
            table_name: DynamoDB table name.
            region: AWS region.
            state_code: Default state ISO code.
            state_name: Default state display name.
            dynamodb_resource: Optional pre-configured boto3 DynamoDB resource.
        """
        self.state_code = state_code
        self.state_name = state_name
        self.table_name = table_name
        self.region = region
        if dynamodb_resource is not None:
            self.dynamodb = dynamodb_resource
        else:
            self.dynamodb = boto3.resource("dynamodb", region_name=region)
        self.table = self.dynamodb.Table(table_name)

    def purge_constituency(self, pk: str) -> int:
        """Queries all items with the given PK and deletes them in batches.

        Args:
            pk: Partition key of the constituency to purge (e.g. 'AC#TN#001').

        Returns:
            Number of items deleted.
        """
        logger.info("Purging existing records for PK=%s...", pk)
        deleted_count = 0
        query_kwargs = {
            "KeyConditionExpression": Key("PK").eq(pk),
            "ProjectionExpression": "PK, SK",
        }
        with self.table.batch_writer() as batch:
            while True:
                response = self.table.query(**query_kwargs)
                items = response.get("Items", [])
                for item in items:
                    batch.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})
                    deleted_count += 1
                if "LastEvaluatedKey" not in response:
                    break
                query_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
        logger.info("Purged %d existing records for %s", deleted_count, pk)
        return deleted_count

    def generate_constituency_items(
        self,
        meta: Dict[str, Any],
        raw_stations: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Generates all 5 entity types (STATION, INDEX, LOCAL_BODY, PINCODE, AC_META).

        Args:
            meta: Constituency metadata dictionary.
            raw_stations: List of raw or normalized station records.

        Returns:
            List of generated DynamoDB item dictionaries.
        """
        cleaned_stations = [normalize_station_for_import(s) for s in raw_stations]
        return build_dynamodb_items(
            meta=meta,
            stations=cleaned_stations,
            state_code=meta.get("state_code", self.state_code),
            state_name=meta.get("state_name", self.state_name),
        )

    def _prepare_dict_data(self, data: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Set[str]]:
        """Prepares items when file content is a constituency dictionary.

        Args:
            data: Constituency dictionary containing meta and stations.

        Returns:
            Tuple of (items list, set of PKs to purge).
        """
        meta = data.get("meta", {})
        stations = data.get("stations", [])
        if not stations:
            return [], set()
        ac_no = meta.get("ac_no", 1)
        state_code = meta.get("state_code", self.state_code)
        pk = f"AC#{state_code}#{ac_no:03d}"
        items = self.generate_constituency_items(meta, stations)
        sanitized = [sanitize_dynamodb_item(convert_floats_to_decimal(it)) for it in items]
        return sanitized, {pk}

    def _prepare_items_for_file(self, file_path: str) -> Tuple[List[Dict[str, Any]], Set[str]]:
        """Parses and prepares items and constituency PKs for writing.

        Args:
            file_path: Path to .json or .ndjson file.

        Returns:
            Tuple of (list of DynamoDB items, set of partition keys to purge if reloading).
        """
        if file_path.endswith(".ndjson"):
            items = _load_ndjson_items(file_path)
            pks = {it["PK"] for it in items if isinstance(it, dict) and "PK" in it}
            return items, pks

        data = _load_json_items(file_path)
        if isinstance(data, list):
            items = [sanitize_dynamodb_item(convert_floats_to_decimal(it)) for it in data if isinstance(it, dict)]
            pks = {it["PK"] for it in items if "PK" in it}
            return items, pks

        if isinstance(data, dict):
            return self._prepare_dict_data(data)

        return [], set()

    def _write_items_batch(self, items: List[Dict[str, Any]]) -> int:
        """Batch-writes items to DynamoDB with automatic retries.

        Args:
            items: List of item dictionaries to write.

        Returns:
            Number of items written.
        """
        count = 0
        with self.table.batch_writer() as batch:
            for item in items:
                batch.put_item(Item=sanitize_dynamodb_item(item))
                count += 1
        return count

    def constituency_exists(self, pk: str) -> bool:
        """Checks if a constituency partition key exists in DynamoDB.

        Args:
            pk: Partition key (e.g. 'AC#TN#001').

        Returns:
            True if at least one item exists for this PK, False otherwise.
        """
        if not self.table:
            return False
        try:
            res = self.table.query(
                KeyConditionExpression=Key("PK").eq(pk),
                Limit=1,
                ProjectionExpression="PK, SK",
            )
            items = res.get("Items", []) if isinstance(res, dict) else []
            return bool(items)
        except Exception as exc:
            logger.warning("Could not check existence for %s: %s", pk, exc)
            return False

    def get_existing_constituency_items(self, pk: str) -> Dict[str, Dict[str, Any]]:
        """Queries all existing DynamoDB items for a constituency partition key.

        Args:
            pk: Partition key (e.g. 'AC#TN#001').

        Returns:
            Dictionary mapping SK -> existing item dict.
        """
        query_kwargs = {
            "KeyConditionExpression": Key("PK").eq(pk),
        }
        existing: Dict[str, Dict[str, Any]] = {}
        try:
            while True:
                response = self.table.query(**query_kwargs)
                if not isinstance(response, dict) or "Items" not in response:
                    break
                for it in response.get("Items", []):
                    if isinstance(it, dict) and "SK" in it:
                        existing[it["SK"]] = it
                if "LastEvaluatedKey" not in response:
                    break
                query_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
        except Exception as exc:
            logger.warning("Could not query existing items for %s: %s. Assuming fresh import.", pk, exc)
            return {}
        return existing

    def filter_missing_items(
        self,
        pk: str,
        items: List[Dict[str, Any]],
        missing_only: bool = False,
    ) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        """Filters items for a constituency, keeping only missing items or items with missing details.

        Args:
            pk: Constituency partition key (e.g. 'AC#TN#001').
            items: All candidate items for this constituency.
            missing_only: If True, only imports missing items and does not update existing items.

        Returns:
            Tuple of (items_to_write, stats_dict).
        """
        existing = self.get_existing_constituency_items(pk)
        if not existing:
            logger.info("Constituency %s does not exist in DB. Importing all %d items.", pk, len(items))
            return items, {
                "new_stations": len(items),
                "updated_stations": 0,
                "new_other": 0,
                "updated_other": 0,
                "skipped_items": 0,
            }

        items_to_write: List[Dict[str, Any]] = []
        stats: Counter = Counter()

        for it in items:
            item_to_write, cat = _evaluate_candidate_item(it, existing, missing_only=missing_only)
            stats[cat] += 1
            if item_to_write is not None:
                items_to_write.append(item_to_write)

        if (stats["new_station"] > 0 or stats["updated_station"] > 0) and not any(it.get("SK") == "META" for it in items_to_write):
            meta_it = next((it for it in items if it.get("SK") == "META"), None)
            if meta_it:
                items_to_write.append(meta_it)
                stats["updated_other"] += 1
                if stats["skipped"] > 0:
                    stats["skipped"] -= 1

        result_stats = {
            "new_stations": stats["new_station"],
            "updated_stations": stats["updated_station"],
            "new_other": stats["new_other"],
            "updated_other": stats["updated_other"],
            "skipped_items": stats["skipped"],
        }
        return items_to_write, result_stats

    def _import_constituency_items(
        self,
        pk: str,
        constituency_items: List[Dict[str, Any]],
        force: bool = False,
        missing_only: bool = False,
        missing_constituencies_only: bool = False,
    ) -> int:
        """Imports items for a single constituency partition key.

        Args:
            pk: Constituency partition key.
            constituency_items: Items belonging to this constituency.
            force: Whether to overwrite without delta checking.
            missing_only: Whether to only import missing stations and omit updating existing stations.
            missing_constituencies_only: Whether to skip existing constituencies completely.

        Returns:
            Number of items written for this constituency.
        """
        if missing_constituencies_only and self.constituency_exists(pk):
            logger.info(
                "Constituency %s already exists in DynamoDB. Skipping (--missing-constituencies-only).",
                pk,
            )
            return 0

        if force:
            logger.info("Full import (--force) for %s: %d items.", pk, len(constituency_items))
            items_to_write = constituency_items
        else:
            mode_desc = "missing stations only" if missing_only else "missing stations or details"
            logger.info("Checking for %s in %s...", mode_desc, pk)
            items_to_write, stats = self.filter_missing_items(pk, constituency_items, missing_only=missing_only)
            if not items_to_write:
                logger.info(
                    "Constituency %s is up-to-date (skipped %d items).",
                    pk,
                    stats["skipped_items"],
                )
                return 0
            logger.info(
                "Constituency %s delta: %d new station(s), %d updated station(s), %d lookup(s), %d skipped.",
                pk,
                stats["new_stations"],
                stats["updated_stations"],
                stats["new_other"] + stats["updated_other"],
                stats["skipped_items"],
            )

        written = self._write_items_batch(items_to_write)
        entity_counts = Counter(it.get("entity", it.get("entity_type", "UNKNOWN")) for it in items_to_write)
        logger.info("Wrote %d items for %s: %s", written, pk, dict(entity_counts))
        return written

    def import_single_file(
        self,
        file_path: str,
        reload: bool = False,
        force: bool = False,
        ac_filter: Optional[int] = None,
        missing_only: bool = False,
        missing_constituencies_only: bool = False,
    ) -> int:
        """Loads and batch-writes polling station items from a JSON or NDJSON file.

        Args:
            file_path: Path to .json or .ndjson file.
            reload: If True, purges existing records for the constituency PK before writing.
            force: If True, performs full import overwriting existing records without delta filtering.
            ac_filter: Optional AC number filter (e.g. 1). Skips other ACs.
            missing_only: If True, only imports missing stations and does not update existing stations.
            missing_constituencies_only: If True, skips any constituency that already exists in DB.

        Returns:
            Number of items written.

        Raises:
            FileNotFoundError: If the file does not exist.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        logger.info("Processing %s (force=%s, reload=%s, missing_only=%s)...", file_path, force, reload, missing_only)
        items, _ = self._prepare_items_for_file(file_path)
        if not items:
            logger.warning("No items found or generated from %s", file_path)
            return 0

        items_by_pk = _group_items_by_pk(items, self.state_code, ac_filter=ac_filter)
        if not items_by_pk:
            logger.debug("Skipping %s (does not match AC %s)", file_path, ac_filter)
            return 0

        if reload:
            for pk in sorted(items_by_pk.keys()):
                self.purge_constituency(pk)
            force = True

        total_written = sum(
            self._import_constituency_items(
                pk,
                c_items,
                force=force,
                missing_only=missing_only,
                missing_constituencies_only=missing_constituencies_only,
            )
            for pk, c_items in sorted(items_by_pk.items())
        )
        logger.info(
            "Import finished for %s: %d total items written.",
            os.path.basename(file_path),
            total_written,
        )
        return total_written

    def import_directory(
        self,
        dir_path: str,
        reload: bool = False,
        force: bool = False,
        ac_filter: Optional[int] = None,
        missing_only: bool = False,
        missing_constituencies_only: bool = False,
    ) -> int:
        """Scans directory and imports all polling station JSON/NDJSON files.

        Args:
            dir_path: Directory containing polling station files.
            reload: If True, purges existing records for each constituency before writing.
            force: If True, performs full import overwriting existing records.
            ac_filter: Optional AC number filter (e.g. 1).
            missing_only: If True, only imports missing stations and does not update existing stations.
            missing_constituencies_only: If True, skips existing constituencies completely.

        Returns:
            Total items imported across all files.
        """
        if not os.path.isdir(dir_path):
            logger.error("Directory not found: %s", dir_path)
            return 0

        files = _collect_import_files(dir_path, ac_filter=ac_filter)
        logger.info("Found %d candidate import file(s) in %s", len(files), dir_path)
        total = 0
        for fpath in files:
            total += self.import_single_file(
                fpath,
                reload=reload,
                force=force,
                ac_filter=ac_filter,
                missing_only=missing_only,
                missing_constituencies_only=missing_constituencies_only,
            )
        logger.info("Total items imported from %s: %d", dir_path, total)
        return total


def main():
    """CLI entry point for importing polling stations."""
    import glob

    parser = argparse.ArgumentParser(
        description="Import extracted polling stations into DynamoDB table."
    )
    parser.add_argument("path", help="Path to JSON/NDJSON file, directory, or glob pattern")
    parser.add_argument(
        "--table", "-t", default=POLLING_STATIONS_TABLE, help="DynamoDB table name"
    )
    parser.add_argument("--region", "-r", default=REGION_NAME, help="AWS region")
    parser.add_argument("--state-code", default="TN", help="State ISO code (default: TN)")
    parser.add_argument("--state-name", default="Tamil Nadu", help="State display name")
    parser.add_argument(
        "--reload", "--clean", action="store_true", help="Purge existing constituency records before importing"
    )
    parser.add_argument(
        "--force", "-f", action="store_true", help="Perform full import, overwriting existing records without delta filtering"
    )
    parser.add_argument(
        "--ac", "--constituency", dest="ac", type=int, default=None, help="Filter import to specific Assembly Constituency number (e.g. 1)"
    )
    parser.add_argument(
        "--missing-only",
        "--only-missing",
        "--missing-stations-only",
        action="store_true",
        dest="missing_only",
        help="Import only missing stations and missing constituencies (skips updating existing stations)",
    )
    parser.add_argument(
        "--missing-constituencies-only",
        "--only-missing-constituencies",
        "--missing-constituencies",
        action="store_true",
        dest="missing_constituencies_only",
        help="Import only missing constituencies (skips any constituency that already exists in DB)",
    )
    args = parser.parse_args()

    importer = PollingStationImporter(
        table_name=args.table,
        region=args.region,
        state_code=args.state_code,
        state_name=args.state_name,
    )

    matches = sorted(glob.glob(args.path))
    if len(matches) > 1:
        total = 0
        logger.info("Found %d file matches for pattern '%s'", len(matches), args.path)
        for fpath in matches:
            total += importer.import_single_file(
                fpath,
                reload=args.reload,
                force=args.force,
                ac_filter=args.ac,
                missing_only=args.missing_only,
                missing_constituencies_only=args.missing_constituencies_only,
            )
        logger.info("Total items imported: %d", total)
    elif os.path.isdir(args.path):
        importer.import_directory(
            args.path,
            reload=args.reload,
            force=args.force,
            ac_filter=args.ac,
            missing_only=args.missing_only,
            missing_constituencies_only=args.missing_constituencies_only,
        )
    else:
        importer.import_single_file(
            args.path,
            reload=args.reload,
            force=args.force,
            ac_filter=args.ac,
            missing_only=args.missing_only,
            missing_constituencies_only=args.missing_constituencies_only,
        )


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="/Users/ideas2it/Projects/personal/knowyourmla/scraper/.env.local")
    main()
