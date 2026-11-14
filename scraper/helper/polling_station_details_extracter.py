#!/usr/bin/env python3
"""Extract Polling Station location, area, ward, and building details using Gemini AI."""

import os
import re
import json
import time
import argparse
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any, Optional, Tuple
from unittest.mock import MagicMock

from google import genai
from google.genai import types
from json_repair import repair_json

DEFAULT_CHUNK_SIZE = 25
DEFAULT_PROMPT_PATH = "/Users/ideas2it/Projects/personal/knowyourmla/scraper/assets/polling_station_details_prompt.txt"
DEFAULT_OUTPUT_DIR = "/Users/ideas2it/Projects/personal/knowyourmla/scraper/assets/polling_stations"
DEFAULT_PDF_DIR = "/Users/ideas2it/Projects/personal/knowyourmla/scraper/assets/polling_stations/pdf"
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")
FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash-lite"]

MODEL_ALIASES = {
    "latest": "gemini-3.8-flash",
    "flash": "gemini-3.8-flash",
    "3.8": "gemini-3.8-flash",
    "3.8-flash": "gemini-3.8-flash",
    "3.8 flash": "gemini-3.8-flash",
    "lite": "gemini-3.1-flash-lite",
    "light": "gemini-3.1-flash-lite",
    "3.1-lite": "gemini-3.1-flash-lite",
    "3.1-light": "gemini-3.1-flash-lite",
    "3.1 lite": "gemini-3.1-flash-lite",
    "3.1 light": "gemini-3.1-flash-lite",
    "3.1": "gemini-3.1-flash-lite",
    "flash-lite": "gemini-3.1-flash-lite",
    "flash-light": "gemini-3.1-flash-lite",
    "3.1-flash-lite": "gemini-3.1-flash-lite",
    "3.1-flash-light": "gemini-3.1-flash-lite",
    "2.5": "gemini-2.5-flash",
    "2.5-flash": "gemini-2.5-flash",
    "2.5 flash": "gemini-2.5-flash",
    "pro": "gemini-2.5-pro",
}


def resolve_model_name(
    model_arg: Optional[str] = None,
    is_lite: bool = False,
    is_latest: bool = False,
) -> str:
    """Resolves CLI model argument or flag shortcuts to canonical Gemini model identifier.

    Args:
        model_arg: Explicit model string or alias (e.g. 'latest', '3.1-lite', 'gemini-3.8-flash').
        is_lite: Boolean shortcut flag to select 3.1 lite model.
        is_latest: Boolean shortcut flag to select latest flash model.

    Returns:
        Canonical model identifier string.
    """
    if is_lite:
        return "gemini-3.1-flash-lite"
    if is_latest:
        return "gemini-3.8-flash"

    val = (model_arg or "").strip().lower()
    if not val:
        return DEFAULT_MODEL

    return MODEL_ALIASES.get(val, model_arg.strip())


def get_pdf_path(ac_id: int, pdf_path: Optional[str] = None) -> str:
    """Resolves local PDF path from arguments or default downloaded assets directory.

    Args:
        ac_id: Assembly constituency number.
        pdf_path: Optional explicit PDF path override.

    Returns:
        Validated absolute path to the PDF file.

    Raises:
        FileNotFoundError: If the PDF cannot be found on disk.
    """
    if pdf_path and os.path.exists(pdf_path):
        return os.path.abspath(pdf_path)

    default_path = os.path.join(DEFAULT_PDF_DIR, f"AC{int(ac_id):03d}.pdf")
    if os.path.exists(default_path):
        return os.path.abspath(default_path)

    raise FileNotFoundError(
        f"PDF for AC {ac_id} not found at {default_path}. "
        f"Run download_polling_station_pdfs.py first or pass --pdf-path."
    )


def get_api_keys() -> List[str]:
    """Retrieves all available Gemini API keys from environment variables.

    Returns:
        List of valid API key strings.
    """
    key = os.environ.get("GOOGLE_GEMINI_API_KEY")
    return [key.strip()] if key and key.strip() else []


def init_gemini_session(
    api_keys: List[str],
    key_idx: int,
    pdf_path: str,
    model: str = DEFAULT_MODEL,
) -> Tuple[Optional[genai.Client], Optional[Any], Optional[Any]]:
    """Initializes a Gemini client and active chat session with uploaded PDF.

    Args:
        api_keys: List of configured Gemini API keys.
        key_idx: Index of the API key to use.
        pdf_path: Local path to the PDF file.
        model: Gemini model identifier for the chat session.

    Returns:
        Tuple of (client, uploaded_file_handle, chat_session) or (None, None, None).
    """
    if key_idx >= len(api_keys):
        return None, None, None
    try:
        client = genai.Client(api_key=api_keys[key_idx])
        print(f"[*] Uploading PDF {pdf_path} using API key index {key_idx}...")
        t0 = time.time()
        file_upload = client.files.upload(file=pdf_path)
        t_upload = time.time() - t0

        t1 = time.time()
        poll_count = 0
        while file_upload.state == "PROCESSING":
            poll_count += 1
            if poll_count % 3 == 0:
                print(f"    [⏱️ PDF Processing] Still processing on Gemini server ({time.time() - t1:.1f}s elapsed)...")
            time.sleep(2)
            file_upload = client.files.get(name=file_upload.name)
        t_process = time.time() - t1

        t2 = time.time()
        chat = client.chats.create(model=model)
        t_chat = time.time() - t2
        total_init = time.time() - t0

        print(
            f"[+] PDF ready in {total_init:.2f}s "
            f"(upload: {t_upload:.2f}s, server process: {t_process:.2f}s, chat session: {t_chat:.2f}s) "
            f"using model '{model}'."
        )
        return client, file_upload, chat
    except Exception as exc:
        print(f"[!] Session initialization error: {exc}")
        return None, None, None


def parse_json_response(raw_text: str) -> Dict[str, Any]:
    """Cleans and repairs raw JSON output returned by Gemini.

    Args:
        raw_text: Raw response string from the Gemini model.

    Returns:
        Parsed dictionary, or empty dictionary on failure.
    """
    if not raw_text or not raw_text.strip():
        return {}
    try:
        cleaned = re.sub(r"^```json\s*|\s*```$", "", raw_text.strip(), flags=re.MULTILINE)
        t0 = time.time()
        repaired = repair_json(cleaned)
        dur = time.time() - t0
        if dur > 0.5:
            print(f"    [⏱️ JSON Repair] Note: json_repair took {dur:.2f}s for {len(raw_text)} chars")
        parsed = json.loads(repaired)
        return parsed if isinstance(parsed, dict) else {}
    except Exception as exc:
        print(f"[!] JSON parse error: {exc}")
        return {}


def format_prompt(
    template: str,
    start_ps: int,
    end_ps: int,
    total_stations: Optional[int] = None,
) -> str:
    """Substitutes range placeholders and evaluations into the prompt template.

    Args:
        template: The prompt template text.
        start_ps: Start station number.
        end_ps: End station number.
        total_stations: Optional total expected polling stations count.

    Returns:
        Formatted prompt string.
    """
    total_str = str(total_stations) if total_stations is not None else "null"
    replacements = {
        "START_PS": str(start_ps),
        "END_PS": str(end_ps),
        "STATION_COUNT": str(total_stations) if total_stations is not None else "Not specified",
        "TOTAL_STATIONS_JSON": total_str,
    }
    prompt = template
    for key, val in replacements.items():
        prompt = prompt.replace(f"{{{{{key}}}}}", val)

    eval_ctx = {
        "START_PS": start_ps,
        "END_PS": end_ps,
        "STATION_COUNT": total_stations,
        "TOTAL_STATIONS_JSON": total_str,
    }
    return re.sub(r"\{\{(.*?)\}\}", lambda m: str(eval(m.group(1), {}, eval_ctx)), prompt)


def _get_candidate_models(chat: Any) -> List[str]:
    """Builds prioritized list of models to attempt for a chunk request.

    Args:
        chat: Active Gemini chat instance.

    Returns:
        List of unique model identifiers starting with the active chat model.
    """
    models = [chat._model] if hasattr(chat, "_model") else []
    for candidate in FALLBACK_MODELS:
        if candidate not in models:
            models.append(candidate)
    return models


def _is_retryable_model_error(msg: str) -> bool:
    """Checks whether an error indicates model unavailability, high demand, or deprecation.

    Args:
        msg: Exception message string.

    Returns:
        True if the request should fallback to another model.
    """
    return any(marker in msg for marker in ("503", "504", "UNAVAILABLE", "404", "NOT_FOUND"))


def _send_gemini_request(
    chat: Any,
    file_upload: Any,
    prompt: str,
    model_name: str,
    with_zero_thinking: bool = True,
) -> Any:
    """Dispatches a single Gemini content generation call statelessly with thinking disabled.

    Args:
        chat: Active chat instance or mock.
        file_upload: Uploaded PDF file handle.
        prompt: Extraction prompt string.
        model_name: Model identifier to use.
        with_zero_thinking: Whether to pass thinking_budget=0.

    Returns:
        Gemini response object.
    """
    config_kwargs: Dict[str, Any] = {
        "response_mime_type": "application/json",
        "temperature": 0.0,
    }
    if with_zero_thinking and "lite" not in model_name.lower():
        config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
    config = types.GenerateContentConfig(**config_kwargs)

    # Prefer stateless generate_content via client.models (_modules) on real client to avoid context bloat
    modules = getattr(chat, "_modules", None)
    if modules is not None and not isinstance(modules, MagicMock) and hasattr(modules, "generate_content"):
        return modules.generate_content(
            model=model_name,
            contents=[file_upload, prompt],
            config=config,
        )
    return chat.send_message(
        message=[file_upload, prompt],
        config=config,
    )


def execute_chunk_request(
    chat: Any,
    file_upload: Any,
    prompt: str,
    timings: Optional[Dict[str, Any]] = None,
) -> Tuple[Optional[Dict[str, Any]], bool]:
    """Sends extraction prompt for a range chunk to Gemini statelessly.

    Args:
        chat: Active Gemini chat instance.
        file_upload: Uploaded PDF file handle.
        prompt: Formatted range prompt string.
        timings: Optional dictionary to record elapsed phase times.

    Returns:
        Tuple of (parsed_data_dict, is_quota_exhausted).
    """
    models_to_try = _get_candidate_models(chat)

    for idx, model_name in enumerate(models_to_try):
        if hasattr(chat, "_model"):
            chat._model = model_name
        try:
            t_api_start = time.time()
            try:
                response = _send_gemini_request(
                    chat, file_upload, prompt, model_name, with_zero_thinking=True
                )
            except Exception as e:
                if "thinking" in str(e).lower():
                    response = _send_gemini_request(
                        chat, file_upload, prompt, model_name, with_zero_thinking=False
                    )
                else:
                    raise

            api_dur = time.time() - t_api_start
            if timings is not None:
                timings["api_time"] = api_dur
                timings["model_name"] = model_name

            t_parse_start = time.time()
            data = parse_json_response(response.text)
            parse_dur = time.time() - t_parse_start
            if timings is not None:
                timings["parse_time"] = parse_dur

            return data, False
        except Exception as exc:
            msg = str(exc)
            if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
                print("[!] API key exhausted or rate-limited.")
                return None, True
            if _is_retryable_model_error(msg) and idx + 1 < len(models_to_try):
                next_model = models_to_try[idx + 1]
                print(f"[!] Model '{model_name}' unavailable ({msg[:60]}...). Falling back to '{next_model}'...")
                time.sleep(1)
                continue
            print(f"[!] Request error: {exc}")
            return None, False

    return None, False


def safe_str(val: Any) -> str:
    """Safely converts any value to a trimmed string, returning empty string for None.

    Args:
        val: Any incoming value.

    Returns:
        Stripped string or empty string.
    """
    if val is None:
        return ""
    return str(val).strip()


def safe_optional_str(val: Any) -> Optional[str]:
    """Safely converts any value to a trimmed string, returning None for empty/null.

    Args:
        val: Any incoming value.

    Returns:
        Stripped string or None.
    """
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


def slugify(s: Optional[str]) -> str:
    """Converts a string to lowercase alphanumeric characters only.

    Args:
        s: Raw input string.

    Returns:
        Slugified string.
    """
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())


CATEGORY_RULES = [
    (r"anganwadi", "ANGANWADI"),
    (r"community hall", "COMMUNITY_HALL"),
    (r"service cent|grama sevai", "PANCHAYAT_SERVICE_CENTRE"),
    (r"higher sec", "HIGHER_SECONDARY_SCHOOL"),
    (r"high\s*school", "HIGH_SCHOOL"),
    (r"middle", "MIDDLE_SCHOOL"),
    (r"primary|elementry|elementary|nursery", "PRIMARY_SCHOOL"),
    (r"matric", "MATRIC_SCHOOL"),
    (r"welfare", "WELFARE_SCHOOL"),
    (r"school", "OTHER_SCHOOL"),
]

MGMT_RULES = [
    (r"(?:pan|pac)[a-z]*\s*u(?:ni|in)on", "PANCHAYAT_UNION"),
    (r"village panchayat|block panchayat", "PANCHAYAT"),
    (r"adi dravid|adi dravida|welfare", "ADI_DRAVIDAR_WELFARE"),
    (r"gov", "GOVERNMENT"),
    (r"c\.?\s*s\.?\s*i\b", "CSI"),
    (r"bosco|karunya|elite|antony|kothandaraman|matric", "PRIVATE_OR_AIDED"),
]


def normalize_category(name: str) -> str:
    """Classifies building name into standard category enum."""
    clean_name = name or ""
    for pat, val in CATEGORY_RULES:
        if re.search(pat, clean_name, re.I):
            return val
    return "OTHER"


def normalize_management(name: str) -> str:
    """Classifies building management from name."""
    clean_name = name or ""
    for pat, val in MGMT_RULES:
        if re.search(pat, clean_name, re.I):
            return val
    return "OTHER"


def normalize_facing(facing: Optional[str]) -> Optional[str]:
    """Normalizes facing direction to standard uppercase cardinal direction."""
    if not facing:
        return None
    fl = facing.lower()
    for d in ("north_east", "north_west", "south_east", "south_west", "east", "west", "north", "south"):
        if d.replace("_", " ") in fl or d.replace("_", "-") in fl or d in fl:
            return d.upper()
    return re.sub(r"[^A-Za-z0-9_]+", "", facing.strip()).upper() or None


def clean_tokens(tokens: List[Any]) -> List[str]:
    """Deduplicates and cleans search keyword tokens.

    Args:
        tokens: Raw keyword strings or values.

    Returns:
        Sorted list of clean lowercase tokens.
    """
    cleaned_set = set()
    for tok in tokens:
        if not tok:
            continue
        cleaned = re.sub(r"[^\w\s-]", "", str(tok)).strip().lower()
        if len(cleaned) >= 2:
            cleaned_set.add(cleaned)
    return sorted(list(cleaned_set))


def _parse_door_range(door_range: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """Extracts door_from and door_to boundary strings from door number range.

    Args:
        door_range: Raw door range string.

    Returns:
        Tuple of (door_from, door_to).
    """
    if not door_range:
        return None, None
    m = re.search(r"(\d+)\s*(?:to|-)\s*(\d+)", door_range)
    if m:
        return m.group(1), m.group(2)
    return door_range, None


def _parse_ward_numbers(raw_ward: Optional[str]) -> List[str]:
    """Extracts clean ward number strings from raw ward text.

    Args:
        raw_ward: Raw ward number string.

    Returns:
        List of ward numbers.
    """
    if not raw_ward:
        return []
    digits = re.findall(r"\b\d+\b", raw_ward)
    return digits if digits else [raw_ward]


def _parse_local_body_type(
    lb_types: Any, raw_type: Any, raw_txt: str
) -> Tuple[str, bool]:
    """Extracts standardized local body type string and revenue village status.

    Args:
        lb_types: List of detected local body types.
        raw_type: Fallback raw local body type.
        raw_txt: Full raw area chunk text.

    Returns:
        Tuple of (local_body_type_str, is_revenue_village).
    """
    types_list = lb_types if isinstance(lb_types, list) else []
    lb_type_str = "/".join(types_list) if types_list else safe_str(raw_type) or "P"
    is_rv = any("r.v" in t.lower() or "rv" in t.lower() for t in types_list) or "r.v" in raw_txt.lower()
    return lb_type_str, is_rv


def _clean_single_area(a: Dict[str, Any], area_idx: int) -> Tuple[Dict[str, Any], bool]:
    """Cleans and standardizes an individual polling area dictionary.

    Args:
        a: Raw polling area dictionary.
        area_idx: 1-based index fallback for area_no.

    Returns:
        Tuple of (cleaned_area_dict, is_overseas_flag).
    """
    raw_txt = safe_str(a.get("raw_text"))
    area_no = a.get("area_no") or area_idx
    is_overseas = area_no == 999 or "overseas" in raw_txt.lower()

    lb_name = safe_str(a.get("local_body_name"))
    lb_types = a.get("local_body_types", [])
    lb_type_str, is_rv = _parse_local_body_type(lb_types, a.get("local_body_type"), raw_txt)

    locality = safe_str(a.get("locality_or_street") or a.get("locality"))
    raw_ward = safe_str(a.get("ward_no"))
    ward_nos = _parse_ward_numbers(raw_ward)

    door_from, door_to = _parse_door_range(safe_optional_str(a.get("door_no_range")))
    canonical_lb = lb_name or "unknown"

    cleaned = {
        "area_no": area_no,
        "raw_text": raw_txt,
        "local_body_name": lb_name,
        "local_body_type": lb_type_str,
        "is_revenue_village": is_rv,
        "locality": locality,
        "ward_nos": ward_nos,
        "door_from": door_from,
        "door_to": door_to,
        "local_body_canonical": canonical_lb,
        "local_body_id": slugify(canonical_lb) or "unknown",
        "locality_id": slugify(locality) or None,
        "local_body_types": lb_types if isinstance(lb_types, list) else [],
        "locality_or_street": locality,
        "ward_no": raw_ward or None,
        "door_no_range": safe_optional_str(a.get("door_no_range")),
    }
    return cleaned, is_overseas


def _clean_polling_areas(raw_areas: List[Any]) -> Tuple[List[Dict[str, Any]], bool]:
    """Cleans polling area dictionaries and detects overseas electors section.

    Args:
        raw_areas: Raw list of polling area objects.

    Returns:
        Tuple of (cleaned_area_list, has_overseas_electors_flag).
    """
    cleaned = []
    has_overseas = False
    for idx, a in enumerate(raw_areas, start=1):
        if not isinstance(a, dict):
            continue
        cleaned_area, is_ov = _clean_single_area(a, idx)
        if is_ov:
            has_overseas = True
        cleaned.append(cleaned_area)
    return cleaned, has_overseas


def _extract_pincode(building: Dict[str, Any]) -> Tuple[Optional[str], List[str]]:
    """Extracts canonical pincode and pincode filter list from building dictionary.

    Args:
        building: Building dictionary.

    Returns:
        Tuple of (canonical_pincode, pincodes_list).
    """
    pin = safe_optional_str(building.get("pincode"))
    if not pin and building.get("raw_text"):
        m = re.search(r"\b\d{6}\b", str(building["raw_text"]))
        if m:
            pin = m.group(0)
    return pin, [pin] if pin else []


def _extract_area_filter_keys(
    areas: List[Dict[str, Any]],
) -> Tuple[List[str], List[str], List[str], List[str], List[str]]:
    """Aggregates local body IDs, RV IDs, ward keys, and locality IDs from areas.

    Args:
        areas: Cleaned area dictionaries.

    Returns:
        Tuple of (lb_ids, rv_ids, ward_nos, ward_keys, locality_ids).
    """
    lb_set, rv_set, ward_set, key_set, loc_set = set(), set(), set(), set(), set()
    for a in areas:
        lid = a.get("local_body_id")
        if not lid:
            continue
        lb_set.add(lid)
        if a.get("is_revenue_village"):
            rv_set.add(lid)
        raw_w = a.get("ward_nos") if a.get("ward_nos") is not None else a.get("ward_no")
        ward_list = raw_w if isinstance(raw_w, list) else ([raw_w] if raw_w else [])
        for w in ward_list:
            if w:
                w_str = str(w)
                ward_set.add(w_str)
                key_set.add(f"{lid}#{w_str}")
        loc_id = a.get("locality_id")
        if loc_id:
            loc_set.add(f"{lid}#{loc_id}")

    sorted_wards = sorted(ward_set, key=lambda x: (len(x), x))
    return sorted(lb_set), sorted(rv_set), sorted_wards, sorted(key_set), sorted(loc_set)


def _build_search_text(
    building: Dict[str, Any], areas: List[Dict[str, Any]], pin: Optional[str]
) -> Tuple[str, List[str]]:
    """Constructs concatenated search text and cleaned keyword tokens.

    Args:
        building: Building dictionary.
        areas: Cleaned area dictionaries.
        pin: Optional pincode string.

    Returns:
        Tuple of (search_text, search_keywords).
    """
    words = [building.get("name"), building.get("location"), pin]
    words += [a.get("local_body_canonical") or a.get("local_body_name") for a in areas]
    words += [a.get("locality") or a.get("locality_or_street") for a in areas]
    clean_words = [w for w in words if w and len(str(w).strip()) > 1]
    search_text = " ".join(sorted({str(w).lower() for w in clean_words}))
    keywords = clean_tokens(words)
    return search_text, keywords


def derive_filters_and_search_text(
    building: Dict[str, Any], areas: List[Dict[str, Any]]
) -> Tuple[Dict[str, Any], str]:
    """Computes search indices, filter mappings, and query text.

    Args:
        building: Normalized building dictionary.
        areas: List of normalized polling area dictionaries.

    Returns:
        Tuple of (filters_dict, search_text_string).
    """
    pin, pincodes = _extract_pincode(building)
    lb_ids, rv_ids, ward_nos, ward_keys, locality_ids = _extract_area_filter_keys(areas)
    category = building.get("category") or normalize_category(building.get("name") or "")
    search_text, search_keywords = _build_search_text(building, areas, pin)

    uniq = lambda xs: sorted({x for x in xs if x})
    local_bodies = uniq(a.get("local_body_canonical") or a.get("local_body_name") for a in areas if (a.get("local_body_canonical") or a.get("local_body_name")))
    localities = uniq(a.get("locality") or a.get("locality_or_street") for a in areas if (a.get("locality") or a.get("locality_or_street")))

    filters = {
        "pincodes": pincodes,
        "local_body_ids": lb_ids,
        "rv_ids": rv_ids,
        "ward_nos": ward_nos,
        "ward_keys": ward_keys,
        "locality_ids": locality_ids,
        "building_category": category,
        "pincode": pin,
        "wards": ward_nos,
        "local_bodies": local_bodies,
        "localities": localities,
        "search_keywords": search_keywords,
    }
    return filters, search_text


def build_filter_metadata(station: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy helper generating standardized filter metadata dictionary."""
    building = station.get("building") or {}
    raw_areas = station.get("areas") or station.get("polling_areas") or []
    cleaned_areas, _ = _clean_polling_areas(raw_areas)
    filters, _ = derive_filters_and_search_text(building, cleaned_areas)
    filters["station_type"] = safe_optional_str(station.get("station_type")) or "ALL VOTERS"
    return filters


def _parse_station_numbers(station: Dict[str, Any]) -> Tuple[Optional[int], int]:
    """Extracts valid integer ps_no and sl_no from station dictionary.

    Args:
        station: Extracted station dictionary.

    Returns:
        Tuple of (ps_no, sl_no).
    """
    ps_val = station.get("ps_no") if station.get("ps_no") is not None else station.get("ps")
    if ps_val is None:
        return None, 1
    try:
        ps_no = int(ps_val)
    except (ValueError, TypeError):
        return None, 1

    sl_val = station.get("sl_no")
    try:
        sl_no = int(sl_val) if sl_val is not None else ps_no
    except (ValueError, TypeError):
        sl_no = ps_no
    return ps_no, sl_no


def _normalize_building_dict(b_raw: Dict[str, Any]) -> Dict[str, Any]:
    """Normalizes building sub-dictionary fields and categories.

    Args:
        b_raw: Raw building dictionary.

    Returns:
        Standardized building dictionary.
    """
    b_name = safe_str(b_raw.get("name"))
    pin, _ = _extract_pincode(b_raw)
    category = b_raw.get("category") or normalize_category(b_name)
    management = b_raw.get("management") or normalize_management(b_name)
    facing = normalize_facing(b_raw.get("facing"))

    return {
        "raw_text": safe_str(b_raw.get("raw_text")),
        "name": b_name,
        "category": category,
        "management": management,
        "wing_portion": safe_str(b_raw.get("wing_portion")),
        "facing": facing,
        "room_no": safe_optional_str(b_raw.get("room_no")),
        "location": safe_str(b_raw.get("location")),
        "pincode": pin,
    }


def normalize_station_record(station: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validates and enriches a single extracted station record to parse_polling_stations schema.

    Args:
        station: Extracted station dictionary.

    Returns:
        Normalized station dictionary or None if invalid.
    """
    ps_no, sl_no = _parse_station_numbers(station)
    if ps_no is None:
        return None

    b_raw = station.get("building") or {}
    building = _normalize_building_dict(b_raw)

    raw_areas = station.get("areas") or station.get("polling_areas") or []
    cleaned_areas, has_overseas = _clean_polling_areas(raw_areas)
    filters, search_text = derive_filters_and_search_text(building, cleaned_areas)

    return {
        "ps_no": ps_no,
        "ps_no_suffix": station.get("ps_no_suffix"),
        "sl_no": sl_no,
        "page": station.get("page", 1),
        "station_type": safe_optional_str(station.get("station_type")) or "ALL VOTERS",
        "has_overseas_electors": has_overseas or bool(station.get("has_overseas_electors")),
        "building": building,
        "areas": cleaned_areas,
        "polling_areas": cleaned_areas,
        "raw": {
            "building": safe_str(b_raw.get("raw_text")),
            "areas": ", ".join(a["raw_text"] for a in cleaned_areas if a.get("raw_text")),
        },
        "filters": filters,
        "filter_metadata": filters,
        "search_text": search_text,
        "review": {"status": "ok", "reasons": []},
        "needs_review": False,
    }


def merge_extracted_stations(
    all_stations: List[Dict[str, Any]],
    chunk_stations: List[Dict[str, Any]],
) -> int:
    """Merges newly extracted stations into the master list, avoiding duplicates.

    Args:
        all_stations: Master list of unique stations.
        chunk_stations: List of stations extracted from the current chunk.

    Returns:
        Count of new stations added.
    """
    existing_map = {s["ps_no"]: idx for idx, s in enumerate(all_stations)}
    new_count = 0

    for raw_s in chunk_stations:
        norm = normalize_station_record(raw_s)
        if not norm:
            continue
        ps_no = norm["ps_no"]
        if ps_no in existing_map:
            all_stations[existing_map[ps_no]] = norm
        else:
            all_stations.append(norm)
            existing_map[ps_no] = len(all_stations) - 1
            new_count += 1

    all_stations.sort(key=lambda s: s["ps_no"])
    return new_count


def find_missing_stations(stations: List[Dict[str, Any]], total: int) -> List[int]:
    """Identifies missing station numbers in the range 1 to total.

    Args:
        stations: Extracted station records.
        total: Expected total polling station count.

    Returns:
        Sorted list of missing station numbers.
    """
    present = set()
    for s in stations:
        if not isinstance(s, dict):
            continue
        val = s.get("ps_no") if s.get("ps_no") is not None else s.get("polling_station_no")
        if val is not None:
            try:
                present.add(int(val))
            except (ValueError, TypeError):
                pass
    return [ps for ps in range(1, total + 1) if ps not in present]


def group_numbers_into_ranges(numbers: List[int], max_chunk: int = 20) -> List[Tuple[int, int]]:
    """Groups isolated numbers into sequential (start, end) chunk spans.

    Args:
        numbers: Sorted list of integers.
        max_chunk: Maximum span length for a single chunk.

    Returns:
        List of (start, end) tuples.
    """
    if not numbers:
        return []
    sorted_nums = sorted(list(set(numbers)))
    ranges = []
    r_start = sorted_nums[0]
    r_end = sorted_nums[0]

    for num in sorted_nums[1:]:
        if num == r_end + 1 and (num - r_start + 1) <= max_chunk:
            r_end = num
        else:
            ranges.append((r_start, r_end))
            r_start = num
            r_end = num
    ranges.append((r_start, r_end))
    return ranges


def detect_total_stations_from_pdf(pdf_path: str) -> Optional[int]:
    """Detects total polling station count by inspecting trailing pages of PDF.

    Args:
        pdf_path: Path to the local polling station PDF.

    Returns:
        Integer count of total stations if detected, or None.
    """
    if not pdf_path or not os.path.exists(pdf_path):
        return None
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            if not pdf.pages:
                return None
            for page in reversed(pdf.pages[-3:]):
                text = page.extract_text() or ""
                matches = re.findall(r"(?:^|\n)\s*(\d{1,4})\s+(\d{1,4})\b", text)
                if matches:
                    valid = [int(m[1]) for m in matches if abs(int(m[0]) - int(m[1])) <= 5]
                    if valid:
                        return max(valid)
    except Exception as exc:
        print(f"[!] Warning: Could not auto-detect station count from PDF: {exc}")
    return None


def _extract_station_number(s: Any) -> Optional[int]:
    """Safely extracts integer station number from record dictionary.

    Args:
        s: Station record dictionary or entity.

    Returns:
        Integer station number, or None if invalid.
    """
    if not isinstance(s, dict):
        return None
    val = s.get("ps_no") if s.get("ps_no") is not None else s.get("polling_station_no")
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def _find_duplicate_numbers(numbers: List[int]) -> List[int]:
    """Finds duplicate numbers in a list.

    Args:
        numbers: List of integers.

    Returns:
        Sorted list of duplicated numbers.
    """
    seen = set()
    dups = set()
    for num in numbers:
        if num in seen:
            dups.add(num)
        else:
            seen.add(num)
    return sorted(list(dups))


def _print_verification_report(res: Dict[str, Any]) -> None:
    """Prints a structured verification summary to the console.

    Args:
        res: Verification result dictionary.
    """
    expected = res.get("expected")
    unique = res.get("unique_count", 0)
    missing = res.get("missing", [])
    duplicates = res.get("duplicates", [])
    cov = res.get("coverage_pct", 0.0)
    is_complete = res.get("is_complete", False)

    print("\n" + "=" * 62)
    if is_complete and expected is not None:
        print("       ✅  POLLING STATION COUNT VERIFIED (100% COMPLETE)")
    elif missing:
        print(f"       ⚠️  POLLING STATION COUNT MISMATCH ({len(missing)} MISSING)")
    else:
        print("       🔍  POLLING STATION COUNT VERIFICATION")
    print("=" * 62)
    if expected is not None:
        print(f"Expected Stations        : {expected}")
    print(f"Extracted Unique Stations : {unique} ({cov}% coverage)")
    if duplicates:
        print(f"Duplicate Stations       : {len(duplicates)} {duplicates[:10]}")
    if missing:
        missing_preview = str(missing[:15]) + ("..." if len(missing) > 15 else "")
        print(f"Missing Station Count    : {len(missing)}")
        print(f"Missing Station Numbers  : {missing_preview}")
        print("Status                   : ⚠️ INCOMPLETE - Extraction Needed")
    else:
        print("Missing Station Count    : 0")
        print("Status                   : ✅ ALL STATIONS ACCOUNTED FOR")
    print("=" * 62 + "\n")


def verify_station_count(
    stations: List[Dict[str, Any]],
    total_stations: Optional[int] = None,
    verbose: bool = True,
) -> Dict[str, Any]:
    """Verifies extracted polling stations against expected ground-truth count.

    Args:
        stations: List of extracted station records.
        total_stations: Expected total polling station count.
        verbose: Whether to print the formatted verification report.

    Returns:
        Dictionary containing verification results:
        - expected: Total expected stations
        - total_extracted: Count of all station records
        - unique_count: Count of unique stations
        - missing: Sorted list of missing station numbers
        - duplicates: List of duplicated station numbers
        - is_complete: Boolean indicating 100% complete and verified
        - coverage_pct: Percentage of expected stations extracted
    """
    station_nos = [num for s in stations if (num := _extract_station_number(s)) is not None]
    unique_set = set(station_nos)
    unique_count = len(unique_set)
    duplicates = _find_duplicate_numbers(station_nos)

    expected = total_stations or (max(unique_set) if unique_set else None)
    if expected and expected > 0:
        missing = [num for num in range(1, expected + 1) if num not in unique_set]
        coverage_pct = round((unique_count / expected) * 100, 1)
        is_complete = not missing and unique_count == expected
    else:
        missing = []
        coverage_pct = 100.0 if unique_count > 0 else 0.0
        is_complete = True

    result = {
        "expected": expected,
        "total_extracted": len(stations),
        "unique_count": unique_count,
        "missing": missing,
        "missing_count": len(missing),
        "duplicates": duplicates,
        "coverage_pct": coverage_pct,
        "is_complete": is_complete,
    }

    if verbose:
        _print_verification_report(result)

    return result


def _build_station_item(
    st: Dict[str, Any],
    meta: Dict[str, Any],
    pk: str,
    sk: str,
    state_code: str,
    state_name: str,
) -> Dict[str, Any]:
    """Builds a single STATION DynamoDB record from normalized station dict."""
    b = st["building"]
    ac_no = meta.get("ac_no", 1)
    ac_name = meta.get("ac_name", f"AC {ac_no:03d}")
    ac_slug = slugify(ac_name) or str(ac_no)
    source_file = meta.get("source_file", f"AC{ac_no:03d}.pdf")

    item = {
        "PK": pk,
        "SK": sk,
        "entity": "STATION",
        "entity_type": "POLLING_STATION",
        "state_code": state_code,
        "state_name": state_name,
        "ac_no": ac_no,
        "ac_name": ac_name,
        "pc_no": meta.get("pc_no"),
        "pc_name": meta.get("pc_name"),
        "pc_category": meta.get("pc_category", "GEN"),
        "ps_no": st["ps_no"],
        "ps_no_suffix": st.get("ps_no_suffix"),
        "sl_no": st.get("sl_no", st["ps_no"]),
        "station_type": st.get("station_type") or "ALL VOTERS",
        "has_overseas_electors": bool(st.get("has_overseas_electors")),
        "source": {"file": source_file, "page": st.get("page", 1)},
        "building": b,
        "areas": [{k: v for k, v in a.items() if k != "manually_edited"} for a in st.get("areas", [])],
        "filters": st.get("filters", {}),
        "search_text": st.get("search_text", ""),
        "needs_review": bool(st.get("needs_review", False)),
        "review_status": st.get("review", {}).get("status", "ok"),
        "review_codes": sorted({r["code"] for r in st.get("review", {}).get("reasons", []) if r.get("severity") != "info"}),
        "constituency_id": f"CONSTITUENCY#{ac_slug}",
        "constituency_slug": ac_slug,
        "polling_station_no": str(st["ps_no"]),
    }
    if b.get("pincode"):
        item["pincode"] = str(b["pincode"]).strip()
    return item


def _build_index_items_for_station(
    st: Dict[str, Any],
    pk: str,
    sk: str,
) -> List[Dict[str, Any]]:
    """Generates secondary index items for search and filtering on a station."""
    b = st["building"]
    proj = {
        "ps_no": st["ps_no"],
        "building_name": b.get("name"),
        "location": b.get("location"),
        "category": b.get("category"),
        "areas": len(st.get("areas", [])),
    }
    if b.get("pincode"):
        proj["pincode"] = str(b["pincode"]).strip()
    f = st.get("filters", {})
    idx_map = {
        "PIN": f.get("pincodes", []),
        "LB": f.get("local_body_ids", []),
        "RV": f.get("rv_ids", []),
        "WARD": f.get("ward_keys", []),
        "LOC": f.get("locality_ids", []),
        "CAT": [f.get("building_category")] if f.get("building_category") else [],
        "OVERSEAS": ["Y"] if st.get("has_overseas_electors") else [],
    }
    index_items = []
    for kind, vals in idx_map.items():
        for v in sorted({x for x in vals if x}):
            index_items.append({
                "PK": pk,
                "SK": f"IDX#{kind}#{v}#{sk}",
                "entity": "INDEX",
                "kind": kind,
                "value": v,
                "GSI1PK": f"{pk}#{kind}#{v}",
                "GSI1SK": sk,
                **proj,
            })
    return index_items


def _aggregate_station_lookups(
    stations: List[Dict[str, Any]],
) -> Tuple[Dict[str, List[int]], Dict[str, Dict[str, Any]]]:
    """Aggregates pincode mappings and local body details across stations."""
    pin_map = defaultdict(list)
    lb_info = {}
    for st in stations:
        b = st.get("building", {})
        pin_val = b.get("pincode") or "UNKNOWN"
        pin_map[pin_val].append(st["ps_no"])
        for a in st.get("areas", []):
            lid = a.get("local_body_id") or "unknown"
            li = lb_info.setdefault(lid, {
                "names": set(),
                "types": set(),
                "wards": set(),
                "pins": set(),
                "stations": set(),
                "rv": False,
            })
            if a.get("local_body_canonical"):
                li["names"].add(a["local_body_canonical"])
            if a.get("local_body_type"):
                li["types"].add(a["local_body_type"])
            li["wards"].update(a.get("ward_nos", []))
            if b.get("pincode"):
                li["pins"].add(b["pincode"])
            li["stations"].add(st["ps_no"])
            li["rv"] = li["rv"] or bool(a.get("is_revenue_village"))
    return pin_map, lb_info


def _build_local_body_items(
    lb_info: Dict[str, Dict[str, Any]],
    pk: str,
) -> List[Dict[str, Any]]:
    """Builds LOCAL_BODY entities from aggregated lookup dictionary."""
    items = []
    for lid, li in sorted(lb_info.items()):
        items.append({
            "PK": pk,
            "SK": f"LB#{lid}",
            "entity": "LOCAL_BODY",
            "id": lid,
            "names": sorted(n for n in li["names"] if n),
            "types": sorted(t for t in li["types"] if t),
            "is_revenue_village": li["rv"],
            "wards": sorted(li["wards"], key=lambda x: (len(x), x)),
            "pincodes": sorted(p for p in li["pins"] if p),
            "station_nos": sorted(li["stations"]),
        })
    return items


def _build_pincode_and_meta_items(
    pin_map: Dict[str, List[int]],
    lb_info: Dict[str, Dict[str, Any]],
    meta: Dict[str, Any],
    stations: List[Dict[str, Any]],
    pk: str,
    state_code: str,
    state_name: str,
) -> List[Dict[str, Any]]:
    """Builds PINCODE and AC_META entities for DynamoDB."""
    items = []
    for pin, nos in sorted(pin_map.items()):
        items.append({
            "PK": pk,
            "SK": f"PIN#{pin}",
            "entity": "PINCODE",
            "pincode": pin,
            "station_nos": sorted(nos),
            "count": len(nos),
        })
    ac_no = meta.get("ac_no", 1)
    needs_review_count = sum(1 for s in stations if s.get("needs_review"))
    items.append({
        "PK": pk,
        "SK": "META",
        "entity": "AC_META",
        "ac_no": ac_no,
        "ac_name": meta.get("ac_name", f"AC {ac_no:03d}"),
        "pc_no": meta.get("pc_no"),
        "pc_name": meta.get("pc_name"),
        "pc_category": meta.get("pc_category", "GEN"),
        "state_code": state_code,
        "state_name": state_name,
        "total_stations": len(stations),
        "pincodes": sorted(pin_map.keys()),
        "local_body_count": len(lb_info),
        "needs_review_count": needs_review_count,
        "source_file": meta.get("source_file", f"AC{ac_no:03d}.pdf"),
    })
    return items


def build_dynamodb_items(
    meta: Dict[str, Any],
    stations: List[Dict[str, Any]],
    state_code: str = "TN",
    state_name: str = "Tamil Nadu",
) -> List[Dict[str, Any]]:
    """Builds complete list of DynamoDB items (STATION, INDEX, LOCAL_BODY, PINCODE, AC_META).

    Args:
        meta: Constituency metadata dictionary.
        stations: Normalized stations list.
        state_code: State code (default: 'TN').
        state_name: State display name (default: 'Tamil Nadu').

    Returns:
        List of DynamoDB item dictionaries.
    """
    ac_no = meta.get("ac_no", 1)
    pk = f"AC#{state_code}#{ac_no:03d}"
    items = []

    for st in stations:
        suffix = st.get("ps_no_suffix") or ""
        sk = f"PS#{st['ps_no']:04d}{suffix}"
        items.append(_build_station_item(st, meta, pk, sk, state_code, state_name))
        items.extend(_build_index_items_for_station(st, pk, sk))

    pin_map, lb_info = _aggregate_station_lookups(stations)
    items.extend(_build_local_body_items(lb_info, pk))
    items.extend(_build_pincode_and_meta_items(pin_map, lb_info, meta, stations, pk, state_code, state_name))
    return items


def _aggregate_bundle_lookups(
    stations: List[Dict[str, Any]],
) -> Tuple[
    Dict[str, List[int]],
    Dict[str, Dict[str, Any]],
    Dict[str, Dict[str, List[int]]],
    Dict[str, List[int]],
]:
    """Aggregates pincode, local body, ward, and locality mappings for bundle.

    Args:
        stations: Extracted station records.

    Returns:
        Tuple of (pin_map, lb_dict, wards_map, locs_map).
    """
    pin_map = defaultdict(list)
    lb_dict = {}
    wards_map = defaultdict(lambda: defaultdict(list))
    locs_map = defaultdict(list)

    for st in stations:
        b, f = st.get("building", {}), st.get("filters", {})
        pin_map[b.get("pincode") or "UNKNOWN"].append(st["ps_no"])
        for a in st.get("areas", []):
            lid = a.get("local_body_id") or "unknown"
            x = lb_dict.setdefault(lid, {
                "id": lid, "names": set(), "types": set(), "is_revenue_village": False,
                "wards": set(), "pincodes": set(), "station_nos": set()
            })
            if a.get("local_body_canonical"):
                x["names"].add(a["local_body_canonical"])
            if a.get("local_body_type"):
                x["types"].add(a["local_body_type"])
            x["is_revenue_village"] |= bool(a.get("is_revenue_village"))
            x["wards"].update(a.get("ward_nos", []))
            if b.get("pincode"):
                x["pincodes"].add(b["pincode"])
            x["station_nos"].add(st["ps_no"])
        for k in f.get("ward_keys", []):
            if "#" in k:
                l, w = k.split("#", 1)
                wards_map[l][w].append(st["ps_no"])
        for k in f.get("locality_ids", []):
            locs_map[k].append(st["ps_no"])
    return pin_map, lb_dict, wards_map, locs_map


def _clean_bundle_stations(stations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Builds clean, uniform station list for JSON bundle.

    Args:
        stations: Master station records.

    Returns:
        List of cleaned station objects.
    """
    clean_stations = []
    for st in stations:
        b, f = st.get("building", {}), st.get("filters", {})
        clean_stations.append({
            "ps_no": st["ps_no"],
            "ps_no_suffix": st.get("ps_no_suffix"),
            "sl_no": st.get("sl_no", st["ps_no"]),
            "page": st.get("page", 1),
            "station_type": st.get("station_type", "ALL VOTERS"),
            "has_overseas_electors": bool(st.get("has_overseas_electors")),
            "building": b,
            "areas": [{k: v for k, v in a.items() if k != "manually_edited"} for a in st.get("areas", [])],
            "filters": f,
            "search_text": st.get("search_text", ""),
            "review": {
                "status": st.get("review", {}).get("status", "ok"),
                "needs_review": bool(st.get("needs_review", False)),
                "open_codes": sorted({r["code"] for r in st.get("review", {}).get("reasons", []) if not r.get("resolved_by")}),
                "note": (st.get("manual") or {}).get("note"),
            },
        })
    return clean_stations


def _build_bundle_lookups_dict(
    pin_map: Dict[str, List[int]],
    lb_dict: Dict[str, Dict[str, Any]],
    wards_map: Dict[str, Dict[str, List[int]]],
    locs_map: Dict[str, List[int]],
    clean_stations: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Builds lookups object containing pincodes, local bodies, wards, and categories.

    Args:
        pin_map: Pincode to station numbers map.
        lb_dict: Local body dictionary.
        wards_map: Ward mapping dict.
        locs_map: Locality mapping dict.
        clean_stations: List of clean stations.

    Returns:
        Dictionary of formatted lookups.
    """
    srt = lambda xs, key=None: sorted((x for x in xs if x), key=key)
    wkey = lambda x: (len(x), x)

    local_bodies = [
        {
            "id": k,
            "names": srt(v["names"]),
            "types": srt(v["types"]),
            "is_revenue_village": v["is_revenue_village"],
            "wards": srt(v["wards"], wkey),
            "pincodes": srt(v["pincodes"]),
            "station_nos": sorted(v["station_nos"]),
        }
        for k, v in sorted(lb_dict.items())
    ]
    wards = {
        l: {w: sorted(set(n)) for w, n in sorted(ws.items(), key=lambda kv: wkey(kv[0]))}
        for l, ws in sorted(wards_map.items())
    }
    categories = sorted({s["building"]["category"] for s in clean_stations if s["building"].get("category")})

    return {
        "pincodes": {k: sorted(v) for k, v in sorted(pin_map.items())},
        "building_categories": categories,
        "local_bodies": local_bodies,
        "wards": wards,
        "localities": {k: sorted(set(v)) for k, v in sorted(locs_map.items())},
        "overseas_station_nos": [s["ps_no"] for s in clean_stations if s["has_overseas_electors"]],
    }


def build_bundle_json(
    meta: Dict[str, Any],
    stations: List[Dict[str, Any]],
    summary: Dict[str, Any],
    state_code: str = "TN",
    state_name: str = "Tamil Nadu",
) -> Dict[str, Any]:
    """Generates the constituency bundle matching parse_polling_stations step 9.

    Args:
        meta: Constituency metadata dictionary.
        stations: Cleaned stations list.
        summary: Summary statistics dictionary.
        state_code: State abbreviation.
        state_name: State display name.

    Returns:
        Consolidated bundle dictionary.
    """
    pin_map, lb_dict, wards_map, locs_map = _aggregate_bundle_lookups(stations)
    clean_stations = _clean_bundle_stations(stations)
    lookups = _build_bundle_lookups_dict(pin_map, lb_dict, wards_map, locs_map, clean_stations)
    ac_no = meta.get("ac_no", 1)

    return {
        "schema_version": "1.0",
        "meta": {
            "state_code": state_code,
            "state_name": state_name,
            "ac_no": ac_no,
            "ac_name": meta.get("ac_name", f"AC {ac_no:03d}"),
            "pc_no": meta.get("pc_no"),
            "pc_name": meta.get("pc_name"),
            "pc_category": meta.get("pc_category", "GEN"),
            "source_file": meta.get("source_file", f"AC{ac_no:03d}.pdf"),
            "total_stations": len(clean_stations),
        },
        "summary": summary,
        "lookups": lookups,
        "stations": clean_stations,
    }


def _get_resume_candidate_paths(output_path: str) -> List[str]:
    """Generates prioritized list of file paths to check for resumed extraction state.

    Args:
        output_path: Path to output directory or file.

    Returns:
        List of candidate file paths in priority order.
    """
    candidate_paths: List[str] = []
    if os.path.isdir(output_path):
        ac_dir = output_path
        parent_dir = os.path.dirname(output_path)
    else:
        ac_dir = os.path.dirname(output_path)
        parent_dir = os.path.dirname(ac_dir)
        candidate_paths.append(output_path)

    m = re.search(r"AC[-_]?(\d+)", output_path, re.I)
    ac_id = int(m.group(1)) if m else None

    candidate_paths.append(os.path.join(ac_dir, "07_final_stations.json"))
    if ac_id is not None:
        candidate_paths.append(os.path.join(ac_dir, f"AC{ac_id:03d}.json"))
        candidate_paths.append(os.path.join(ac_dir, f"AC{ac_id:03d}_polling_stations.json"))
        candidate_paths.append(os.path.join(parent_dir, f"AC{ac_id:03d}_polling_stations.json"))
    return candidate_paths


def load_resumed_state(
    output_path: str,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any], int]:
    """Loads existing extraction output to support resumption after interruption.

    Args:
        output_path: Path to target directory or JSON file.

    Returns:
        Tuple of (stations_list, meta_dict, next_start_station_number).
    """
    candidate_paths = _get_resume_candidate_paths(output_path)
    target_file = next((p for p in candidate_paths if os.path.isfile(p)), None)
    if not target_file:
        return [], {}, 1

    print(f"[*] Resuming from existing file: {target_file}")
    try:
        with open(target_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        stations = data.get("stations", []) if isinstance(data, dict) else [
            it for it in data if isinstance(it, dict) and it.get("entity") == "STATION"
        ]
        meta = data.get("meta", {}) if isinstance(data, dict) else {}
        next_start = 1
        if stations:
            max_ps = max(s["ps_no"] for s in stations if "ps_no" in s)
            next_start = max_ps + 1
        print(f"[*] Found {len(stations)} existing stations. Next start: {next_start}")
        return stations, meta, next_start
    except Exception as exc:
        print(f"[!] Could not resume state: {exc}. Starting fresh.")
        return [], {}, 1


def save_extracted_results(
    output_path: str,
    meta: Dict[str, Any],
    stations: List[Dict[str, Any]],
    total_stations: Optional[int] = None,
    state_code: str = "TN",
    state_name: str = "Tamil Nadu",
) -> Dict[str, Any]:
    """Saves final extracted polling stations across all target formats.

    Always saves ONLY into the constituency folder AC{ac_no:03d}/:
      1. 07_final_stations.json (identical to parse_polling_stations step 7)
      2. 08_dynamodb_items.json (identical to parse_polling_stations step 8)
      3. 08_dynamodb_items.ndjson (line-delimited items)
      4. AC{ac_no:03d}.json (constituency bundle)

    Args:
        output_path: Output directory or destination path.
        meta: Constituency metadata dictionary.
        stations: Full list of extracted station dictionaries.
        total_stations: Expected total station count.
        state_code: State code (default: 'TN').
        state_name: State display name (default: 'Tamil Nadu').

    Returns:
        The consolidated results dictionary.
    """
    t_save_start = time.time()
    missing = find_missing_stations(stations, total_stations) if total_stations else []
    summary = {
        "total_stations": len(stations),
        "ok": len(stations),
        "gemini_checked": 0,
        "approved": 0,
        "needs_review": 0,
        "open_reasons_by_severity": {},
        "global_issues": [],
    }
    validation_info = {
        "expected_station_count": total_stations,
        "actual_station_count": len(stations),
        "is_complete": len(missing) == 0 if total_stations else True,
        "missing_stations": missing,
    }

    # Authoritative AC number resolution:
    # 1. Search path for AC pattern (e.g. AC080 -> 80)
    # 2. Or validate meta["ac_no"] within 1..234
    # 3. Default to 1
    m = re.search(r"AC[-_]?(\d+)", output_path, re.I)
    path_ac = int(m.group(1)) if m else None
    if path_ac is not None and 1 <= path_ac <= 234:
        ac_no = path_ac
    elif meta.get("ac_no") and 1 <= int(meta.get("ac_no", 0)) <= 234:
        ac_no = int(meta["ac_no"])
    else:
        ac_no = 1
    meta["ac_no"] = ac_no

    ac_name = meta.get("ac_name", f"AC {ac_no:03d}")
    clean_name_match = re.search(r"\d+\s*[-–]\s*([A-Za-z\s()]+)", ac_name)
    if clean_name_match:
        ac_name = clean_name_match.group(1).strip()
    meta["ac_name"] = ac_name
    meta.setdefault("pc_category", "GEN")
    meta["source_file"] = f"AC{ac_no:03d}.pdf"

    final_payload = {
        "meta": meta,
        "summary": summary,
        "total_stations": len(stations),
        "validation": validation_info,
        "stations": stations,
    }

    abs_output = os.path.abspath(output_path)
    if os.path.isdir(abs_output) or not abs_output.endswith(".json"):
        if os.path.basename(abs_output).upper() == f"AC{ac_no:03d}":
            ac_folder = abs_output
        else:
            ac_folder = os.path.join(abs_output, f"AC{ac_no:03d}")
    else:
        dir_name = os.path.dirname(abs_output)
        if os.path.basename(dir_name).upper() == f"AC{ac_no:03d}":
            ac_folder = dir_name
        else:
            ac_folder = os.path.join(dir_name, f"AC{ac_no:03d}")

    os.makedirs(ac_folder, exist_ok=True)

    final_stations_path = os.path.join(ac_folder, "07_final_stations.json")
    with open(final_stations_path, "w", encoding="utf-8") as f:
        json.dump(final_payload, f, indent=2, ensure_ascii=False)

    dynamodb_items = build_dynamodb_items(meta, stations, state_code=state_code, state_name=state_name)
    dynamo_path = os.path.join(ac_folder, "08_dynamodb_items.json")
    with open(dynamo_path, "w", encoding="utf-8") as f:
        json.dump(dynamodb_items, f, indent=2, ensure_ascii=False)

    ndjson_path = os.path.join(ac_folder, "08_dynamodb_items.ndjson")
    with open(ndjson_path, "w", encoding="utf-8") as f:
        for it in dynamodb_items:
            f.write(json.dumps(it, ensure_ascii=False) + "\n")

    bundle_data = build_bundle_json(meta, stations, summary, state_code=state_code, state_name=state_name)
    bundle_path = os.path.join(ac_folder, f"AC{ac_no:03d}.json")
    with open(bundle_path, "w", encoding="utf-8") as f:
        json.dump(bundle_data, f, indent=2, ensure_ascii=False)

    save_dur = time.time() - t_save_start
    print(
        f"[+] Saved {len(stations)} stations in {save_dur:.2f}s to {ac_folder}/ "
        f"(07_final, 08_dynamo, bundle)"
    )
    return final_payload


def _build_recovery_prompt(
    prompt_template: str,
    r_start: int,
    r_end: int,
    total_stations: int,
) -> str:
    """Builds an emphatic prompt targeted at recovering specific missed stations.

    Args:
        prompt_template: Base prompt template.
        r_start: Start station number to recover.
        r_end: End station number to recover.
        total_stations: Expected total polling station count.

    Returns:
        Formatted prompt with recovery directive appended.
    """
    base = format_prompt(prompt_template, r_start, r_end, total_stations)
    directive = (
        f"\n\n---\n"
        f"## ⚠️ PRIORITY RECOVERY DIRECTIVE\n"
        f"Polling station(s) {r_start} to {r_end} were missing or omitted in previous extraction.\n"
        f"Locate and extract EXACTLY polling station(s) from number {r_start} to {r_end} "
        f"from the document table. Do NOT skip any station in this range.\n"
    )
    return base + directive


def _recover_single_range(
    chat: Any,
    file_upload: Any,
    prompt_template: str,
    output_path: str,
    meta: Dict[str, Any],
    stations: List[Dict[str, Any]],
    r_start: int,
    r_end: int,
    total_stations: int,
    metrics: Optional[Dict[str, Any]] = None,
) -> Tuple[bool, Any]:
    """Queries and merges a single missing range during recovery.

    Args:
        chat: Active chat instance.
        file_upload: Uploaded PDF handle.
        prompt_template: Base prompt template.
        output_path: Output JSON destination path.
        meta: Constituency metadata dictionary.
        stations: Master station list.
        r_start: Range start station number.
        r_end: Range end station number.
        total_stations: Expected total polling stations.
        metrics: Optional performance metrics dictionary.

    Returns:
        Tuple of (is_exhausted, extracted_data).
    """
    prompt = _build_recovery_prompt(prompt_template, r_start, r_end, total_stations)
    timings: Dict[str, Any] = {}
    t0 = time.time()
    data, is_exhausted = execute_chunk_request(chat, file_upload, prompt, timings=timings)

    if data and data.get("stations"):
        new_added = merge_extracted_stations(stations, data["stations"])
        save_extracted_results(output_path, meta, stations, total_stations)
        dur = time.time() - t0
        api_dur = timings.get("api_time", 0.0)
        print(
            f"[⏱️ Recovery {r_start}-{r_end}] Added {new_added} station(s) in {dur:.2f}s "
            f"(LLM API: {api_dur:.2f}s)"
        )
        if metrics is not None:
            metrics["api_time"] = metrics.get("api_time", 0.0) + api_dur
            metrics["parse_time"] = metrics.get("parse_time", 0.0) + timings.get("parse_time", 0.0)
            metrics["total_time"] = metrics.get("total_time", 0.0) + dur

    return is_exhausted, data


def _recover_missing_stations(
    chat: Any,
    file_upload: Any,
    prompt_template: str,
    output_path: str,
    meta: Dict[str, Any],
    stations: List[Dict[str, Any]],
    total_stations: int,
    metrics: Optional[Dict[str, Any]] = None,
    max_retries: int = 2,
    keys: Optional[List[str]] = None,
    resolved_pdf: Optional[str] = None,
    model: Optional[str] = None,
) -> List[int]:
    """Performs targeted re-extraction for any stations skipped during main pass.

    Args:
        chat: Active Gemini chat.
        file_upload: Uploaded PDF handle.
        prompt_template: Prompt template string.
        output_path: Path to output JSON.
        meta: Constituency metadata.
        stations: Master station list.
        total_stations: Ground truth total stations.
        metrics: Optional performance metrics dictionary.
        max_retries: Maximum number of recovery attempts (default: 2).
        keys: Optional list of API keys for rotation.
        resolved_pdf: Local path to PDF file.
        model: Gemini model identifier.

    Returns:
        List of any still-missing station numbers after recovery.
    """
    key_idx = 0
    if not chat or not total_stations:
        return []

    for attempt in range(1, max_retries + 1):
        missing = find_missing_stations(stations, total_stations)
        if not missing:
            print("[+] All stations accounted for. Recovery complete.")
            return []

        print(
            f"\n[*] Initiating Recovery Pass {attempt}/{max_retries} for {len(missing)} missed station(s): "
            f"{missing[:10]}{'...' if len(missing) > 10 else ''}"
        )

        for r_start, r_end in group_numbers_into_ranges(missing, max_chunk=15):
            print(f"[*] Targeted recovery for missing station(s) {r_start} to {r_end}...")
            is_exhausted, _ = _recover_single_range(
                chat,
                file_upload,
                prompt_template,
                output_path,
                meta,
                stations,
                r_start,
                r_end,
                total_stations,
                metrics=metrics,
            )

            if is_exhausted:
                if keys and resolved_pdf and model:
                    key_idx, _, file_upload, chat = _handle_exhausted_key(
                        keys, key_idx, resolved_pdf, model=model
                    )
                    if not chat:
                        print("[!] All API keys exhausted during recovery.")
                        return find_missing_stations(stations, total_stations)
                else:
                    return find_missing_stations(stations, total_stations)

    return find_missing_stations(stations, total_stations)


def _extract_chunk_step(
    chat: Any,
    file_upload: Any,
    prompt_template: str,
    output_path: str,
    meta: Dict[str, Any],
    stations: List[Dict[str, Any]],
    curr_start: int,
    curr_end: int,
    total_stations: Optional[int],
    metrics: Optional[Dict[str, Any]] = None,
) -> Tuple[Optional[Dict[str, Any]], bool, bool]:
    """Executes a single extraction chunk step.

    Args:
        chat: Active chat instance.
        file_upload: Uploaded PDF file handle.
        prompt_template: Extraction prompt template.
        output_path: Path to output JSON file.
        meta: Master metadata dictionary.
        stations: Master stations list.
        curr_start: Start station number for this chunk.
        curr_end: End station number for this chunk.
        total_stations: Optional ground truth total station count.
        metrics: Optional performance metrics dictionary.

    Returns:
        Tuple of (meta, is_exhausted, has_data).
    """
    chunk_t0 = time.time()
    prompt = format_prompt(prompt_template, curr_start, curr_end, total_stations)
    print(f"[*] Requesting stations {curr_start} to {curr_end}...")

    timings: Dict[str, Any] = {}
    data, is_exhausted = execute_chunk_request(chat, file_upload, prompt, timings=timings)
    if is_exhausted:
        return meta, True, False
    if not data:
        return meta, False, False

    updated_meta = meta if meta else data.get("meta", {})
    t_norm = time.time()
    new_added = merge_extracted_stations(stations, data.get("stations", []))
    norm_dur = time.time() - t_norm

    t_save = time.time()
    save_extracted_results(output_path, updated_meta, stations, total_stations)
    save_dur = time.time() - t_save
    total_chunk_dur = time.time() - chunk_t0

    api_time = timings.get("api_time", 0.0)
    parse_time = timings.get("parse_time", 0.0)
    model_name = timings.get("model_name", "unknown")

    print(
        f"[⏱️ Chunk {curr_start}-{curr_end}] Total: {total_chunk_dur:.2f}s | "
        f"LLM API: {api_time:.2f}s ({model_name}) | Parse: {parse_time:.3f}s | "
        f"Normalize: {norm_dur:.3f}s | Save: {save_dur:.2f}s"
    )
    print(f"[+] Added {new_added} stations. Total so far: {len(stations)}")

    if metrics is not None:
        metrics["api_time"] = metrics.get("api_time", 0.0) + api_time
        metrics["parse_time"] = metrics.get("parse_time", 0.0) + parse_time
        metrics["norm_time"] = metrics.get("norm_time", 0.0) + norm_dur
        metrics["save_time"] = metrics.get("save_time", 0.0) + save_dur
        metrics["total_time"] = metrics.get("total_time", 0.0) + total_chunk_dur
        metrics["chunk_count"] = metrics.get("chunk_count", 0) + 1

    return updated_meta, False, True


def _handle_exhausted_key(
    keys: List[str],
    key_idx: int,
    pdf_path: str,
    model: str,
) -> Tuple[int, Optional[Any], Optional[Any], Optional[Any]]:
    """Rotates to next API key when current key is exhausted.

    Args:
        keys: Available API keys.
        key_idx: Current key index.
        pdf_path: Local PDF path.
        model: Gemini model identifier.

    Returns:
        Tuple of (next_key_idx, client, file_upload, chat).
    """
    next_idx = key_idx + 1
    if next_idx >= len(keys):
        print("[!] All API keys exhausted. Saving current progress and stopping.")
        return next_idx, None, None, None
    client, file_upload, chat = init_gemini_session(keys, next_idx, pdf_path, model=model)
    return next_idx, client, file_upload, chat


def _auto_import_if_requested(auto_import_db: bool, ac_id: int, output_path: str) -> None:
    """Imports extracted file into DynamoDB if requested.

    Args:
        auto_import_db: Whether to trigger import.
        ac_id: Constituency number.
        output_path: Path to extracted JSON file or directory.
    """
    if not auto_import_db:
        return
    print(f"[*] Auto-importing AC {ac_id} into DynamoDB table...")
    from import_polling_stations import PollingStationImporter
    importer = PollingStationImporter()
    target = output_path
    if os.path.isdir(output_path):
        ndjson = os.path.join(output_path, "08_dynamodb_items.ndjson")
        target = ndjson if os.path.exists(ndjson) else output_path
    importer.import_single_file(target)


def ensure_api_keys() -> List[str]:
    """Retrieves API keys, attempting to load from local environment files if missing.

    Returns:
        List of valid API key strings.

    Raises:
        ValueError: If no valid Gemini API key is configured.
    """
    keys = get_api_keys()
    if keys:
        return keys

    try:
        from dotenv import load_dotenv
        search_dirs = [
            os.path.join(os.path.dirname(__file__), "..", ".env.local"),
            os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"),
            ".env.local",
        ]
        for env_path in search_dirs:
            if os.path.exists(env_path):
                load_dotenv(dotenv_path=env_path)
                break
        keys = get_api_keys()
    except ImportError:
        pass

    if not keys:
        raise ValueError("GOOGLE_GEMINI_API_KEY environment variable is not set.")
    return keys


def _run_extraction_loop(
    chat: Any,
    file_upload: Any,
    prompt_template: str,
    output_path: str,
    meta: Dict[str, Any],
    stations: List[Dict[str, Any]],
    keys: List[str],
    resolved_pdf: str,
    model: str,
    curr_start: int,
    chunk_size: int,
    total_stations: Optional[int],
    metrics: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, Any], Any]:
    """Runs sequential chunk requests across station ranges.

    Args:
        chat: Active Gemini chat instance.
        file_upload: Uploaded PDF file handle.
        prompt_template: Prompt template text.
        output_path: Path to target output JSON.
        meta: Constituency metadata dictionary.
        stations: Master station list.
        keys: Available Gemini API keys.
        resolved_pdf: Local PDF file path.
        model: Gemini model identifier.
        curr_start: Initial start station number.
        chunk_size: Stations to query per chunk.
        total_stations: Total stations expected.
        metrics: Optional performance metrics dictionary.

    Returns:
        Tuple of (updated_meta_dict, active_chat_instance).
    """
    key_idx = 0
    consecutive_empty = 0

    while not (total_stations and curr_start > total_stations):
        curr_end = curr_start + chunk_size - 1
        if total_stations:
            curr_end = min(curr_end, total_stations)

        meta, is_exhausted, has_data = _extract_chunk_step(
            chat,
            file_upload,
            prompt_template,
            output_path,
            meta,
            stations,
            curr_start,
            curr_end,
            total_stations,
            metrics=metrics,
        )
        if is_exhausted:
            key_idx, _, file_upload, chat = _handle_exhausted_key(keys, key_idx, resolved_pdf, model=model)
            if not chat:
                break
            continue

        consecutive_empty = 0 if has_data else consecutive_empty + 1
        if consecutive_empty >= 2:
            print("[!] Consecutive empty responses. Halting extraction loop.")
            break

        if total_stations and curr_end >= total_stations:
            break
        curr_start = curr_end + 1

    return meta, chat


def print_performance_summary(metrics: Dict[str, Any]) -> None:
    """Prints a structured performance breakdown table of extraction execution.

    Args:
        metrics: Dictionary containing elapsed times for all pipeline phases.
    """
    total_elapsed = time.time() - metrics.get("start_time", time.time())
    chunk_count = metrics.get("chunk_count", 0)
    api_time = metrics.get("api_time", 0.0)
    parse_time = metrics.get("parse_time", 0.0)
    norm_time = metrics.get("norm_time", 0.0)
    save_time = metrics.get("save_time", 0.0)

    avg_chunk = (total_elapsed / chunk_count) if chunk_count > 0 else 0.0

    def _pct(t: float) -> str:
        pct = (t / total_elapsed * 100) if total_elapsed > 0 else 0.0
        return f"{pct:5.1f}%"

    print("\n" + "=" * 62)
    print("           ⏱️  EXTRACTION PERFORMANCE BREAKDOWN")
    print("=" * 62)
    print(f"Total Pipeline Runtime : {total_elapsed:.2f}s across {chunk_count} chunk(s)")
    if chunk_count > 0:
        print(f"Average Time Per Chunk : {avg_chunk:.2f}s")
    print("-" * 62)
    print(f"{'Execution Phase':<28} {'Time (s)':>12} {'Share (%)':>14}")
    print("-" * 62)
    print(f"{'Gemini API (LLM inference)':<28} {api_time:>11.2f}s {_pct(api_time):>14}")
    print(f"{'JSON Parse & Repair':<28} {parse_time:>11.3f}s {_pct(parse_time):>14}")
    print(f"{'Demarcation Normalization':<28} {norm_time:>11.3f}s {_pct(norm_time):>14}")
    print(f"{'Disk Save & Dynamo I/O':<28} {save_time:>11.2f}s {_pct(save_time):>14}")
    other_time = max(0.0, total_elapsed - (api_time + parse_time + norm_time + save_time))
    print(f"{'PDF Upload / Processing / Wait':<28} {other_time:>11.2f}s {_pct(other_time):>14}")
    print("=" * 62 + "\n")


def extract_polling_station_details(
    ac_id: int,
    pdf_path: Optional[str] = None,
    total_stations: Optional[int] = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    auto_import_db: bool = False,
    model: str = DEFAULT_MODEL,
    max_recovery_retries: int = 2,
) -> Dict[str, Any]:
    """Main pipeline loop extracting all polling station demarcations from PDF.

    Args:
        ac_id: Assembly constituency number (1-234).
        pdf_path: Optional path to the local List of Polling Stations PDF.
        total_stations: Total number of stations in constituency.
        chunk_size: Number of stations to extract per Gemini query.
        output_dir: Directory where JSON output should be saved.
        auto_import_db: If True, writes results to DynamoDB upon completion.
        model: Gemini model identifier to use.
        max_recovery_retries: Maximum recovery retry passes for missed stations.

    Returns:
        Extracted and validated data dictionary.

    Raises:
        FileNotFoundError: If PDF or prompt template does not exist.
        ValueError: If no API key is available.
    """
    pipeline_t0 = time.time()
    resolved_model = resolve_model_name(model)
    metrics: Dict[str, Any] = {
        "start_time": pipeline_t0,
        "api_time": 0.0,
        "parse_time": 0.0,
        "norm_time": 0.0,
        "save_time": 0.0,
        "chunk_count": 0,
    }

    resolved_pdf = get_pdf_path(ac_id, pdf_path)
    if not os.path.exists(DEFAULT_PROMPT_PATH):
        raise FileNotFoundError(f"Prompt template not found at {DEFAULT_PROMPT_PATH}")

    # Determine total stations: parameter takes priority, else auto-detect from PDF
    if total_stations is None:
        detected = detect_total_stations_from_pdf(resolved_pdf)
        if detected:
            total_stations = detected
            print(f"[*] Auto-detected expected total polling stations from PDF: {total_stations}")
    else:
        print(f"[*] Using provided expected total polling stations parameter: {total_stations}")

    keys = ensure_api_keys()
    ac_folder = os.path.join(output_dir, f"AC{ac_id:03d}")
    os.makedirs(ac_folder, exist_ok=True)
    stations, meta, curr_start = load_resumed_state(ac_folder)
    meta["ac_no"] = ac_id

    with open(DEFAULT_PROMPT_PATH, "r", encoding="utf-8") as f:
        prompt_template = f.read()

    _, file_upload, chat = init_gemini_session(keys, 0, resolved_pdf, model=resolved_model)
    if not chat:
        raise RuntimeError("Failed to start Gemini session.")

    meta, chat = _run_extraction_loop(
        chat,
        file_upload,
        prompt_template,
        ac_folder,
        meta,
        stations,
        keys,
        resolved_pdf,
        resolved_model,
        curr_start,
        chunk_size,
        total_stations,
        metrics=metrics,
    )

    print("\n[*] Verifying polling station count against expected total...")
    verification = verify_station_count(stations, total_stations, verbose=True)

    if verification["missing"] and chat:
        target_total = total_stations or verification["expected"]
        print(f"[*] Extracting {len(verification['missing'])} missed station(s)...")
        _recover_missing_stations(
            chat,
            file_upload,
            prompt_template,
            ac_folder,
            meta,
            stations,
            target_total,
            metrics=metrics,
            max_retries=max_recovery_retries,
            keys=keys,
            resolved_pdf=resolved_pdf,
            model=resolved_model,
        )
        print("\n[*] Post-recovery station count re-verification:")
        verification = verify_station_count(stations, total_stations, verbose=True)

    t_final_save = time.time()
    result = save_extracted_results(ac_folder, meta, stations, total_stations)
    result["verification"] = verification
    metrics["save_time"] = metrics.get("save_time", 0.0) + (time.time() - t_final_save)

    print_performance_summary(metrics)

    _auto_import_if_requested(auto_import_db, ac_id, ac_folder)
    return result


def main():
    """CLI entrypoint for extracting polling station details from PDF."""
    parser = argparse.ArgumentParser(
        description="Extract polling station demarcations, areas, and buildings from ECI PDF."
    )
    parser.add_argument("ac_id", type=int, help="Assembly Constituency Number (1-234)")
    parser.add_argument(
        "--pdf-path",
        "-p",
        default=None,
        help="Optional explicit path to PDF (defaults to assets/polling_stations/pdf/AC<ac_id>.pdf)",
    )
    model_group = parser.add_mutually_exclusive_group()
    model_group.add_argument(
        "--lite",
        "--light",
        dest="lite",
        action="store_true",
        help="Shortcut to use Gemini 3.1 Flash-Lite (gemini-3.1-flash-lite)",
    )
    model_group.add_argument(
        "--latest",
        action="store_true",
        help="Shortcut to use latest Gemini 3.8 Flash (gemini-3.8-flash)",
    )
    parser.add_argument(
        "--model",
        "-m",
        default=None,
        help=(
            f"Gemini model identifier or alias ('latest', '3.1-lite', '3.1 light', 'flash', 'pro', etc. "
            f"Default: {DEFAULT_MODEL})"
        ),
    )
    parser.add_argument(
        "--total-stations",
        "--total",
        "-t",
        dest="total_stations",
        type=int,
        default=None,
        help="Expected total number of polling stations in the constituency (e.g. 344)",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=2,
        help="Maximum recovery retry passes for missed stations (default: 2)",
    )
    parser.add_argument(
        "--chunk-size",
        "-c",
        type=int,
        default=DEFAULT_CHUNK_SIZE,
        help="Number of stations per extraction query (default: 25)",
    )
    parser.add_argument(
        "--auto-import-db",
        action="store_true",
        help="Automatically import extracted data into DynamoDB knowyourmla_polling_stations",
    )
    args = parser.parse_args()

    selected_model = resolve_model_name(
        model_arg=args.model,
        is_lite=args.lite,
        is_latest=args.latest,
    )

    extract_polling_station_details(
        ac_id=args.ac_id,
        pdf_path=args.pdf_path,
        total_stations=args.total_stations,
        chunk_size=args.chunk_size,
        auto_import_db=args.auto_import_db,
        model=selected_model,
        max_recovery_retries=args.max_retries,
    )


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="/Users/ideas2it/Projects/personal/knowyourmla/scraper/.env.local")
    main()
