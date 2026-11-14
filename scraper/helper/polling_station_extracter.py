#!/usr/bin/env python3
"""Extract Form-20 polling station results using Gemini AI."""

import os
import re
import json
import time
import argparse
from typing import Dict, List, Any, Optional, Tuple, Union

import requests
from google import genai
from google.genai import types
from json_repair import repair_json

# Configuration
BASE_URL = "https://www.elections.tn.gov.in/Form20_BE2026_35_101.aspx"
ASSETS_DIR = "/Users/ideas2it/Projects/personal/knowyourmla/scraper/assets/202610/ac/polling"
PDF_DIR = os.path.join(ASSETS_DIR, "pdf")
PROMPT_FILE = "/Users/ideas2it/Projects/personal/knowyourmla/scraper/assets/polling_extraction_prompt.txt"


def get_all_api_keys() -> List[str]:
    """Retrieves all available Gemini API keys from environment variables.

    Returns:
        List of valid API key strings.
    """
    key = os.environ.get("GOOGLE_GEMINI_API_KEY")
    return [key] if key else []


def get_pdf_link(ac_id: Union[int, str]) -> str:
    """Finds the PDF link for a given constituency ID from the TN Elections website.

    Args:
        ac_id: Constituency number/ID.

    Returns:
        The URL of the Form-20 PDF.

    Raises:
        ValueError: If the PDF link cannot be found.
    """
    print(f"[*] Fetching Form 20 page to find link for AC {ac_id}...")
    response = requests.get(BASE_URL, timeout=30)
    response.raise_for_status()
    ac_pattern = f"AC{int(ac_id):03d}.pdf"

    match = re.search(fr"https?://www.elections.tn.gov.in/Form20_TNLA2026/dt\d+/{ac_pattern}", response.text)
    if match:
        return match.group(0)

    match = re.search(fr"/Form20_TNLA2026/dt\d+/{ac_pattern}", response.text)
    if match:
        return "https://www.elections.tn.gov.in" + match.group(0)

    match = re.search(fr'href="([^"]*?{ac_pattern})"', response.text)
    if match:
        link = match.group(1)
        if not link.startswith("http"):
            link = "https://www.elections.tn.gov.in" + (link if link.startswith("/") else "/" + link)
        return link

    raise ValueError(f"Could not find PDF link for constituency {ac_id}")


def download_pdf(url: str, ac_id: Union[int, str], force: bool = False) -> str:
    """Downloads the PDF and returns the local path.

    Args:
        url: Direct link to the Form-20 PDF.
        ac_id: Constituency number/ID.
        force: If True, re-downloads even if the PDF exists locally.

    Returns:
        Local path where the PDF was saved.
    """
    os.makedirs(PDF_DIR, exist_ok=True)
    dest_path = os.path.join(PDF_DIR, f"AC{int(ac_id):03d}.pdf")
    if not force and os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
        print(f"[*] Local PDF already exists at {dest_path}. Skipping download.")
        return dest_path

    print(f"[*] Downloading PDF from {url} to {dest_path}...")
    response = requests.get(url, stream=True, timeout=60)
    response.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print("[+] Download complete.")
    return dest_path


def get_pdf_path(ac_id: Union[int, str], force: bool = False) -> str:
    """Gets local PDF path, downloading from website only if needed or forced.

    Args:
        ac_id: Constituency number/ID.
        force: If True, always re-downloads a fresh copy from the website.

    Returns:
        Local path where the PDF is available.
    """
    dest_path = os.path.join(PDF_DIR, f"AC{int(ac_id):03d}.pdf")
    if not force and os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
        print(f"[*] Local PDF already exists at {dest_path}. Skipping download.")
        return dest_path

    url = get_pdf_link(ac_id)
    return download_pdf(url, ac_id, force=force)


def _init_gemini_chat(
    api_keys: List[str], key_index: int, pdf_path: str
) -> Tuple[Optional[genai.Client], Optional[Any], Optional[Any]]:
    """Initializes Gemini client and chat session.

    Args:
        api_keys: List of Gemini API keys.
        key_index: Index of API key to use.
        pdf_path: Local path to the PDF to upload.

    Returns:
        Tuple of (client, file_upload, chat_session) or (None, None, None).
    """
    if key_index >= len(api_keys):
        return None, None, None
    try:
        client = genai.Client(api_key=api_keys[key_index])
        print(f"[*] Using API key index {key_index}...")
        file_upload = client.files.upload(file=pdf_path)
        while file_upload.state == "PROCESSING":
            time.sleep(2)
            file_upload = client.files.get(name=file_upload.name)
        return client, file_upload, client.chats.create(model="gemini-3.1-flash-lite")
    except Exception as e:
        print(f"[!] Init error: {e}")
        return None, None, None


def _parse_json_response(text: str) -> Dict[str, Any]:
    """Cleans and parses raw JSON response text.

    Args:
        text: Raw response string from Gemini.

    Returns:
        Parsed dictionary, or empty dictionary on failure.
    """
    try:
        raw = re.sub(r"^```json\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
        return json.loads(repair_json(raw))
    except Exception:
        return {}


def is_data_valid(data: Optional[Dict[str, Any]]) -> bool:
    """Checks if the postal or summary data is actually present.

    Args:
        data: Postal or summary dictionary to inspect.

    Returns:
        True if valid data with numbers is present, False otherwise.
    """
    if not data or not isinstance(data, dict):
        return False
    if "v" not in data:
        return False

    v_data = data["v"]
    if not isinstance(v_data, dict):
        return False
    if any(val is not None for val in v_data.values()):
        return True

    for k in ["valid", "nota", "total", "total_votes_polled"]:
        if data.get(k) is not None:
            return True

    return False


def _has_completed_summary_and_postal(state: Dict[str, Any]) -> bool:
    """Checks whether both postal and summary data are validly present.

    Args:
        state: State dictionary holding postal_data and summary_data.

    Returns:
        True if both postal and summary data are valid, False otherwise.
    """
    return is_data_valid(state.get("postal_data")) and is_data_valid(state.get("summary_data"))


def _update_stations(
    stations_data: List[Dict[str, Any]],
    all_stations: List[Dict[str, Any]],
    current_state: Dict[str, Any],
) -> int:
    """Updates the stations list from extracted chunk data.

    Args:
        stations_data: Stations extracted in current chunk.
        all_stations: Master list of unique stations.
        current_state: Dictionary holding postal_data and summary_data.

    Returns:
        Number of newly added polling stations.
    """
    new_found = 0
    for s in stations_data:
        if not isinstance(s, dict):
            continue
        if "ps" in s:
            if not any(existing.get("ps") == s["ps"] for existing in all_stations):
                all_stations.append(s)
                new_found += 1
        elif "postal" in s or ("nota" in s and "rejected" in s):
            if is_data_valid(s):
                current_state["postal_data"] = s
        elif "party_votes" in s or "polling_station_summary" in s:
            if is_data_valid(s):
                current_state["summary_data"] = s
    return new_found


def _update_extracted_data(
    data: Dict[str, Any],
    all_stations: List[Dict[str, Any]],
    candidates_dict: Dict[str, Any],
    meta_dict: Dict[str, Any],
    current_state: Dict[str, Any],
) -> int:
    """Updates metadata, candidates, and stations from chunk data.

    Args:
        data: Parsed chunk JSON from Gemini.
        all_stations: Master list of polling stations.
        candidates_dict: Master candidates mapping.
        meta_dict: Master metadata dictionary.
        current_state: State dictionary holding postal/summary data.

    Returns:
        Number of new stations added in this chunk.
    """
    if not candidates_dict and "candidates" in data:
        candidates_dict.update(data["candidates"])
    if not meta_dict and "meta" in data:
        meta_dict.update(data["meta"])

    new_found = _update_stations(data.get("stations", []), all_stations, current_state)

    if "postal" in data and is_data_valid(data["postal"]):
        current_state["postal_data"] = data["postal"]
    if "polling_station_summary" in data and is_data_valid(data["polling_station_summary"]):
        current_state["summary_data"] = data["polling_station_summary"]

    return new_found


def _calculate_chunk_size(candidates_count: Optional[int], candidates: Dict[str, Any]) -> int:
    """Calculates polling station chunk size based on candidate count.

    Args:
        candidates_count: Optional ground truth candidate count.
        candidates: Currently extracted candidate dictionary.

    Returns:
        Number of stations to extract in a single chunk (30, 50, or 75).
    """
    count = candidates_count if candidates_count is not None else len(candidates)
    if count > 30:
        return 30
    if count > 20:
        return 50
    return 75


def _determine_next_range(
    data: Dict[str, Any],
    start_ps: int,
    end_ps: int,
    candidates: Dict[str, Any],
    new_found: int,
    consecutive_empty: int,
    station_count: Optional[int] = None,
    candidates_count: Optional[int] = None,
) -> Tuple[Optional[int], Optional[int], int]:
    """Calculates the next polling station range to extract.

    Args:
        data: Extracted JSON data chunk from Gemini.
        start_ps: Current start station number.
        end_ps: Current end station number.
        candidates: Discovered candidates dictionary.
        new_found: Number of new stations found in current chunk.
        consecutive_empty: Count of consecutive empty extraction chunks.
        station_count: Optional total polling station count.
        candidates_count: Optional total candidate count.

    Returns:
        Tuple of (next_start_ps, next_end_ps, consecutive_empty_count).
    """
    if station_count is not None and end_ps >= station_count:
        return None, None, 0

    next_range = data.get("next_range")
    if isinstance(next_range, dict) and next_range.get("start", 0) > start_ps:
        ce = consecutive_empty + 1 if new_found == 0 else 0
        if ce >= 2:
            print("[!] Stopping: 2 consecutive empty ranges.")
            return None, None, ce
        n_start = next_range["start"]
        n_end = next_range.get("end", n_start + 74)
        if station_count is not None:
            if n_start > station_count:
                return None, None, 0
            n_end = min(n_end, station_count)
        return n_start, n_end, ce

    if new_found > 0:
        ns = end_ps + 1
        if station_count is not None and ns > station_count:
            return None, None, 0
        chunk = _calculate_chunk_size(candidates_count, candidates)
        ne = ns + chunk - 1
        if station_count is not None:
            ne = min(ne, station_count)
        return ns, ne, 0

    return None, None, consecutive_empty


def _run_recovery_prompt(chat: Any, file_upload: Any, prompt: str) -> Dict[str, Any]:
    """Sends a recovery prompt to Gemini.

    Args:
        chat: Active Gemini chat session.
        file_upload: Uploaded file handle.
        prompt: Recovery prompt string.

    Returns:
        Parsed recovery JSON dictionary.
    """
    try:
        response = chat.send_message(
            message=[file_upload, prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        return _parse_json_response(response.text)
    except Exception as e:
        print(f"[!] Recovery error: {e}")
        return {}


def _perform_dedicated_recovery(
    chat: Any,
    file_upload: Any,
    state: Dict[str, Any],
    candidates: Dict[str, Any],
    max_retries: int,
    candidates_count: Optional[int] = None,
) -> None:
    """Attempts to recover missing postal/summary data from the end of the PDF.

    Args:
        chat: The active Gemini chat session.
        file_upload: The uploaded file reference.
        state: State dictionary containing 'postal_data' and 'summary_data'.
        candidates: Candidate mapping dictionary.
        max_retries: Maximum number of recovery attempts.
        candidates_count: Optional expected number of candidates.
    """
    print("[*] Missing data recovery...")
    cand_str = "\n".join([f"{k}: {v}" for k, v in candidates.items()])
    expected_clause = ""
    if candidates_count:
        expected_clause = f"\nNote: There are exactly {candidates_count} candidates in this constituency."

    for _ in range(max_retries):
        has_p = is_data_valid(state["postal_data"])
        has_s = is_data_valid(state["summary_data"])

        prompt = f"""Go to the end of the Form-20 PDF. Extract 'Postal Votes' and 'Polling Station Summary'.{expected_clause}
Candidate ID mapping:
{cand_str}

Return EXACTLY this JSON structure:
{{
  "postal": {{
    "v": {{ "1": <votes>, "2": <votes>, ... }},
    "nota": <nota>,
    "rejected": <rejected>,
    "valid": <total_valid>,
    "total": <grand_total>
  }},
  "polling_station_summary": {{
    "v": {{ "1": <votes>, "2": <votes>, ... }},
    "valid": <total_valid>,
    "rej": <rejected>,
    "nota": <nota>,
    "total": <grand_total>,
    "tendered": <tendered>
  }}
}}
"""
        data = _run_recovery_prompt(chat, file_upload, prompt)
        if not has_p:
            cand_data = data.get("postal")
            if is_data_valid(cand_data):
                state["postal_data"] = cand_data
        if not has_s:
            cand_data = data.get("polling_station_summary")
            if is_data_valid(cand_data):
                state["summary_data"] = cand_data

        if _has_completed_summary_and_postal(state):
            print("[+] Recovery successful with correct pattern.")
            break
        time.sleep(2)


def _ensure_summary_and_postal_recovery(
    chat: Any,
    file_upload: Any,
    state: Dict[str, Any],
    candidates: Dict[str, Any],
    candidates_count: Optional[int] = None,
) -> None:
    """Performs dedicated recovery if postal or summary data is missing.

    Args:
        chat: Active chat session.
        file_upload: Uploaded PDF file handle.
        state: State dictionary.
        candidates: Discovered candidates dictionary.
        candidates_count: Optional expected candidates count.
    """
    if not chat or not file_upload:
        return
    if not _has_completed_summary_and_postal(state):
        _perform_dedicated_recovery(
            chat, file_upload, state, candidates, 3, candidates_count=candidates_count
        )


def _try_extract_chunk(
    chat: Any, file_upload: Any, prompt: str, api_keys: List[str], key_index: int
) -> Tuple[Optional[Dict[str, Any]], bool]:
    """Attempts a single Gemini extraction chunk with error handling.

    Args:
        chat: Active chat session.
        file_upload: Uploaded PDF file handle.
        prompt: Chunk extraction prompt.
        api_keys: List of configured API keys.
        key_index: Current key index.

    Returns:
        Tuple of (parsed_json_dict, is_key_exhausted).
    """
    try:
        resp = chat.send_message(
            message=[file_upload, prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        return _parse_json_response(resp.text), False
    except Exception as e:
        msg = str(e)
        if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
            print(f"[!] Key {key_index} exhausted.")
            return None, True
        print(f"[!] Error: {e}")
        return None, False


def _build_constituency_constraints(
    candidates_count: Optional[int], station_count: Optional[int]
) -> str:
    """Builds ground truth constraint text to guide the extraction agent.

    Args:
        candidates_count: Optional expected candidate count.
        station_count: Optional expected polling station count.

    Returns:
        Formatted constraint instructions for the prompt.
    """
    lines = []
    if candidates_count is not None:
        lines.append(
            f"* TOTAL CANDIDATES IN CONSTITUENCY: EXACTLY {candidates_count} candidates.\n"
            f"  - The 'candidates' mapping MUST contain keys '1' through '{candidates_count}'.\n"
            f"  - Each station's 'v' map MUST contain vote counts for candidates '1' through '{candidates_count}'.\n"
            f"  - Candidate columns terminate at candidate {candidates_count}. Subsequent columns (Total Valid Votes, NOTA, Rejected, Total) MUST NOT be treated as candidates."
        )
    else:
        lines.append(
            "* TOTAL CANDIDATES IN CONSTITUENCY: Not specified. Identify all contesting candidate columns from the Form-20 header (Candidate 1 to Candidate N)."
        )

    if station_count is not None:
        lines.append(
            f"* TOTAL POLLING STATIONS IN CONSTITUENCY: EXACTLY {station_count} polling stations (numbered 1 to {station_count}).\n"
            f"  - Station numbers range from 1 to {station_count}. No stations exist beyond {station_count}.\n"
            f"  - The last polling station in this constituency is station {station_count}."
        )
    else:
        lines.append(
            "* TOTAL POLLING STATIONS IN CONSTITUENCY: Not specified. Extract all sequential polling stations until the final station listed in the Form-20."
        )

    return "\n".join(lines)


def _format_extraction_prompt(
    template: str,
    start: int,
    end: int,
    candidates_count: Optional[int] = None,
    station_count: Optional[int] = None,
) -> str:
    """Formats the extraction prompt with range, counts, and constraints.

    Args:
        template: The raw prompt template string.
        start: Starting polling station number.
        end: Ending polling station number.
        candidates_count: Optional ground truth candidate count.
        station_count: Optional ground truth station count.

    Returns:
        The fully formatted prompt string.
    """
    constraints_text = _build_constituency_constraints(candidates_count, station_count)

    cand_str = str(candidates_count) if candidates_count is not None else "Not specified"
    st_str = str(station_count) if station_count is not None else "Not specified"
    cand_json = str(candidates_count) if candidates_count is not None else "null"
    st_json = str(station_count) if station_count is not None else "null"

    ctx = {
        "START_PS": start,
        "END_PS": end,
        "start_ps": start,
        "end_ps": end,
        "CANDIDATES_COUNT": cand_str,
        "candidates_count": cand_str,
        "STATION_COUNT": st_str,
        "station_count": st_str,
        "CANDIDATES_COUNT_JSON": cand_json,
        "TOTAL_STATIONS_JSON": st_json,
        "CONSTITUENCY_CONSTRAINTS": constraints_text,
    }

    prompt = template
    for key, val in ctx.items():
        prompt = prompt.replace(f"{{{{{key}}}}}", str(val))

    eval_ctx = {
        "START_PS": start,
        "END_PS": end,
        "start_ps": start,
        "end_ps": end,
        "station_count": station_count,
        "candidates_count": candidates_count,
    }
    prompt = re.sub(r"\{\{(.*?)\}\}", lambda m: str(eval(m.group(1), {}, eval_ctx)), prompt)
    return prompt


def _load_resumed_state(
    out_path: str,
    ac_id: Union[int, str],
    candidates_count: Optional[int] = None,
    station_count: Optional[int] = None,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any], Dict[str, Any], Dict[str, Any], int, int]:
    """Loads existing extraction state if available to resume progress.

    Args:
        out_path: Path to the output JSON file.
        ac_id: Assembly constituency ID.
        candidates_count: Optional expected candidate count.
        station_count: Optional expected station count.

    Returns:
        Tuple of (all_stations, candidates, meta, state, start_ps, end_ps).
    """
    all_st: List[Dict[str, Any]] = []
    cand: Dict[str, Any] = {}
    meta: Dict[str, Any] = {}
    state: Dict[str, Any] = {"postal_data": None, "summary_data": None}
    start = 1
    chunk = _calculate_chunk_size(candidates_count, cand)
    end = start + chunk - 1
    if station_count is not None:
        end = min(end, station_count)

    if os.path.exists(out_path):
        print(f"[*] Found existing data for AC {ac_id}. Resuming...")
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
                all_st = existing.get("stations", [])
                cand = existing.get("candidates", {})
                meta = existing.get("meta", {})
                state["postal_data"] = existing.get("postal")
                state["summary_data"] = existing.get("polling_station_summary")
                if all_st:
                    max_ps = max(int(s["ps"]) for s in all_st if "ps" in s)
                    start = max_ps + 1
                    chunk = _calculate_chunk_size(candidates_count, cand)
                    end = start + chunk - 1
                    if station_count is not None:
                        end = min(end, station_count)
                    print(f"[*] Resuming from station {start}...")
        except Exception as e:
            print(f"[!] Resume error: {e}")

    return all_st, cand, meta, state, start, end


def get_expected_candidate_count(
    candidates_count: Optional[int], candidates: Dict[str, Any]
) -> int:
    """Determines expected candidate count from argument or candidates dictionary.

    Args:
        candidates_count: Optional explicit candidate count.
        candidates: Extracted candidates dictionary.

    Returns:
        Expected number of candidates as an integer (0 if unknown).
    """
    if candidates_count is not None and candidates_count > 0:
        return candidates_count
    return len(candidates)


def is_station_candidate_count_valid(
    station: Dict[str, Any],
    expected_candidates: int,
    candidates: Optional[Dict[str, Any]] = None,
) -> bool:
    """Checks if a polling station has the expected candidate vote count.

    Args:
        station: Polling station data dictionary.
        expected_candidates: Expected number of candidates.
        candidates: Optional dictionary of candidates for checking keys.

    Returns:
        True if the station's vote mapping has exactly expected_candidates, False otherwise.
    """
    if expected_candidates <= 0:
        return True
    if not isinstance(station, dict):
        return False
    votes = station.get("v")
    if not isinstance(votes, dict):
        return False
    if len(votes) != expected_candidates:
        return False
    if candidates and len(candidates) == expected_candidates:
        return all(k in votes for k in candidates.keys())
    return True


def find_mismatched_candidate_stations(
    stations: List[Dict[str, Any]],
    expected_candidates: int,
    candidates: Optional[Dict[str, Any]] = None,
) -> List[int]:
    """Finds station numbers where candidate vote count does not match expected count.

    Args:
        stations: List of extracted polling stations.
        expected_candidates: Expected candidate count.
        candidates: Optional dictionary of candidates for key validation.

    Returns:
        Sorted list of polling station numbers that failed verification.
    """
    if expected_candidates <= 0:
        return []
    mismatched: List[int] = []
    for s in stations:
        if isinstance(s, dict) and "ps" in s:
            if not is_station_candidate_count_valid(s, expected_candidates, candidates):
                try:
                    mismatched.append(int(s["ps"]))
                except (ValueError, TypeError):
                    continue
    return sorted(list(set(mismatched)))


def group_station_numbers_into_ranges(
    station_numbers: List[int], max_chunk_size: int = 30
) -> List[Tuple[int, int]]:
    """Groups a sorted list of station numbers into (start, end) ranges.

    Args:
        station_numbers: List of polling station numbers.
        max_chunk_size: Maximum span for a single extraction range.

    Returns:
        List of (start_station, end_station) tuples.
    """
    if not station_numbers:
        return []
    sorted_ps = sorted(list(set(station_numbers)))
    ranges: List[Tuple[int, int]] = []
    r_start = sorted_ps[0]
    r_end = sorted_ps[0]

    for ps in sorted_ps[1:]:
        if ps == r_end + 1 and (ps - r_start + 1) <= max_chunk_size:
            r_end = ps
        else:
            ranges.append((r_start, r_end))
            r_start = ps
            r_end = ps
    ranges.append((r_start, r_end))
    return ranges


def _format_rerun_prompt(
    prompt_template: str,
    start: int,
    end: int,
    candidates_count: int,
    station_count: Optional[int],
    candidates: Dict[str, Any],
) -> str:
    """Formats targeted rerun prompt with candidate mapping and precision instructions.

    Args:
        prompt_template: Base extraction prompt template.
        start: Starting polling station number.
        end: Ending polling station number.
        candidates_count: Expected candidate count.
        station_count: Optional expected station count.
        candidates: Currently known candidate dictionary.

    Returns:
        Formatted prompt string tailored for rerun verification.
    """
    base_prompt = _format_extraction_prompt(
        prompt_template, start, end, candidates_count, station_count
    )
    cand_lines = [
        f"  {k}: {v}"
        for k, v in sorted(
            candidates.items(),
            key=lambda x: int(x[0]) if str(x[0]).isdigit() else 999,
        )
    ]
    cand_str = "\n".join(cand_lines)
    mapping_section = f"\nCandidate ID mapping:\n{cand_str}" if cand_str else ""

    rerun_instruction = (
        f"\n\n---"
        f"\n## CRITICAL RERUN INSTRUCTION"
        f"\nPolling station(s) {start} to {end} had missing or incomplete candidate votes."
        f"\nYou MUST extract vote counts for ALL {candidates_count} candidates (keys '1' to '{candidates_count}')"
        f" for each station in 'v'. Do NOT skip any candidate columns."
        f"{mapping_section}"
    )
    return base_prompt + rerun_instruction


def _extract_rerun_range(
    chat: Any,
    file_upload: Any,
    keys: List[str],
    key_index: int,
    pdf_path: str,
    prompt: str,
) -> Tuple[Optional[Dict[str, Any]], Any, Any, int]:
    """Sends a rerun prompt to Gemini, handling key exhaustion if needed.

    Args:
        chat: Active Gemini chat session.
        file_upload: Uploaded PDF file handle.
        keys: List of available API keys.
        key_index: Current API key index.
        pdf_path: Path to local PDF.
        prompt: Rerun prompt string.

    Returns:
        Tuple of (parsed_data, chat, file_upload, key_index).
    """
    current_chat = chat
    current_file_up = file_upload
    current_ki = key_index

    while current_ki < len(keys):
        if not current_chat:
            _, current_file_up, current_chat = _init_gemini_chat(
                keys, current_ki, pdf_path
            )
            if not current_chat:
                return None, None, None, current_ki

        data, key_exhausted = _try_extract_chunk(
            current_chat, current_file_up, prompt, keys, current_ki
        )
        if key_exhausted:
            current_ki += 1
            current_chat = None
            current_file_up = None
            continue
        return data, current_chat, current_file_up, current_ki

    return None, current_chat, current_file_up, current_ki


def _merge_new_candidates(candidates: Dict[str, Any], new_candidates: Any) -> None:
    """Merges newly discovered candidate mappings into master candidates dictionary.

    Args:
        candidates: Master candidates mapping.
        new_candidates: Dictionary of candidates to merge.
    """
    if isinstance(new_candidates, dict):
        for k, v in new_candidates.items():
            if k not in candidates and v:
                candidates[k] = v


def _replace_or_append_station(
    all_stations: List[Dict[str, Any]], new_station: Dict[str, Any]
) -> None:
    """Replaces an existing station by 'ps' in list, or appends it.

    Args:
        all_stations: Master list of stations.
        new_station: Extracted station dictionary.
    """
    ps_num = new_station.get("ps")
    for idx, existing in enumerate(all_stations):
        if existing.get("ps") == ps_num:
            all_stations[idx] = new_station
            return
    all_stations.append(new_station)


def _apply_rerun_chunk_results(
    data: Optional[Dict[str, Any]],
    all_stations: List[Dict[str, Any]],
    candidates: Dict[str, Any],
    expected_candidates: int,
) -> int:
    """Updates master stations list with re-extracted valid stations.

    Args:
        data: Parsed JSON data returned from Gemini rerun.
        all_stations: Master polling station list.
        candidates: Master candidates dictionary.
        expected_candidates: Expected number of candidates per station.

    Returns:
        Count of stations successfully updated/corrected.
    """
    if not data or not isinstance(data, dict):
        return 0

    _merge_new_candidates(candidates, data.get("candidates"))

    extracted_stations = data.get("stations", [])
    if not isinstance(extracted_stations, list):
        return 0

    corrected_count = 0
    for s in extracted_stations:
        if is_station_candidate_count_valid(s, expected_candidates, candidates):
            if s.get("ps") is not None:
                _replace_or_append_station(all_stations, s)
                corrected_count += 1

    return corrected_count


def _rerun_mismatched_ranges(
    mismatched_ps: List[int],
    chat: Any,
    file_upload: Any,
    keys: List[str],
    key_index: int,
    pdf_path: str,
    prompt_template: str,
    all_stations: List[Dict[str, Any]],
    candidates: Dict[str, Any],
    expected_candidates: int,
    station_count: Optional[int],
) -> Tuple[Any, Any, int]:
    """Iterates through mismatched station ranges and re-runs extraction.

    Args:
        mismatched_ps: List of mismatched polling station numbers.
        chat: Active Gemini chat.
        file_upload: Uploaded PDF file handle.
        keys: List of API keys.
        key_index: Current API key index.
        pdf_path: Path to local PDF.
        prompt_template: Extraction prompt template.
        all_stations: Master list of stations.
        candidates: Master candidates mapping.
        expected_candidates: Expected candidate count.
        station_count: Optional total station count.

    Returns:
        Tuple of (chat, file_upload, key_index).
    """
    ranges = group_station_numbers_into_ranges(mismatched_ps)
    curr_chat = chat
    curr_file_up = file_upload
    curr_ki = key_index

    for r_start, r_end in ranges:
        print(f"[*] Rerunning extraction for stations {r_start} to {r_end}...")
        prompt = _format_rerun_prompt(
            prompt_template,
            r_start,
            r_end,
            expected_candidates,
            station_count,
            candidates,
        )
        data, curr_chat, curr_file_up, curr_ki = _extract_rerun_range(
            curr_chat, curr_file_up, keys, curr_ki, pdf_path, prompt
        )
        if not data:
            print(f"[!] No data returned for rerun range {r_start}-{r_end}.")
            continue

        corrected = _apply_rerun_chunk_results(
            data, all_stations, candidates, expected_candidates
        )
        print(f"[+] Corrected {corrected} station(s) in range {r_start}-{r_end}.")

    return curr_chat, curr_file_up, curr_ki


def _verify_and_rerun_mismatched_stations(
    chat: Any,
    file_upload: Any,
    keys: List[str],
    key_index: int,
    pdf_path: str,
    prompt_template: str,
    all_stations: List[Dict[str, Any]],
    candidates: Dict[str, Any],
    candidates_count: Optional[int],
    station_count: Optional[int],
    max_retries: int = 2,
) -> Tuple[Any, Any, int]:
    """Verifies that all polling stations have correct candidate count and reruns mismatches.

    Args:
        chat: Active Gemini chat session.
        file_upload: Uploaded PDF file handle.
        keys: List of API keys.
        key_index: Current API key index.
        pdf_path: Local PDF path.
        prompt_template: Extraction prompt template.
        all_stations: Master stations list.
        candidates: Candidates dictionary.
        candidates_count: Optional expected candidate count.
        station_count: Optional expected station count.
        max_retries: Maximum rerun attempts for mismatched stations.

    Returns:
        Tuple of (chat, file_upload, key_index).
    """
    expected = get_expected_candidate_count(candidates_count, candidates)
    if expected <= 0:
        print("[*] Candidate count verification skipped: candidate count unknown.")
        return chat, file_upload, key_index

    curr_chat = chat
    curr_file_up = file_upload
    curr_ki = key_index

    for attempt in range(1, max_retries + 1):
        mismatched = find_mismatched_candidate_stations(all_stations, expected, candidates)
        if not mismatched:
            print(
                f"[+] Candidate count verified: all {len(all_stations)} stations have {expected} candidates."
            )
            break

        preview = str(mismatched[:10]) + ("..." if len(mismatched) > 10 else "")
        print(
            f"[!] Verification attempt {attempt}/{max_retries}: {len(mismatched)} station(s) "
            f"have mismatched candidate count: {preview}"
        )

        curr_chat, curr_file_up, curr_ki = _rerun_mismatched_ranges(
            mismatched,
            curr_chat,
            curr_file_up,
            keys,
            curr_ki,
            pdf_path,
            prompt_template,
            all_stations,
            candidates,
            expected,
            station_count,
        )

    all_stations.sort(
        key=lambda s: int(s["ps"]) if str(s.get("ps", "")).isdigit() else 0
    )
    return curr_chat, curr_file_up, curr_ki


def _save_extraction_results(
    out_path: str,
    meta: Dict[str, Any],
    cand: Dict[str, Any],
    all_st: List[Dict[str, Any]],
    state: Dict[str, Any],
    candidates_count: Optional[int] = None,
    station_count: Optional[int] = None,
) -> Dict[str, Any]:
    """Saves the extracted results to a JSON file and returns the dictionary.

    Args:
        out_path: Destination JSON file path.
        meta: Constituency metadata dictionary.
        cand: Candidate dictionary.
        all_st: List of all extracted polling stations.
        state: State dictionary containing postal and summary data.
        candidates_count: Optional expected candidates count.
        station_count: Optional expected station count.

    Returns:
        The complete extraction results dictionary.
    """
    if station_count is not None:
        meta["total_stations"] = station_count
    if candidates_count is not None:
        meta["total_candidates"] = candidates_count

    expected_c_count = get_expected_candidate_count(candidates_count, cand)
    mismatched = find_mismatched_candidate_stations(all_st, expected_c_count, cand)

    validation_info: Dict[str, Any] = {
        "actual_station_count": len(all_st),
        "mismatched_candidate_stations_count": len(mismatched),
        "candidate_count_per_station_matches": len(mismatched) == 0,
    }
    if mismatched:
        validation_info["mismatched_stations"] = mismatched
    if station_count is not None:
        validation_info["expected_station_count"] = station_count
        validation_info["station_count_matches"] = len(all_st) == station_count
    if candidates_count is not None:
        validation_info["expected_candidate_count"] = candidates_count
        validation_info["candidate_count_matches"] = len(cand) == candidates_count

    res = {
        "meta": meta,
        "candidates": cand,
        "stations": all_st,
        "postal": state["postal_data"],
        "polling_station_summary": state["summary_data"],
        "validation": validation_info,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2)
    print(f"[+] Saved to {out_path}")
    return res


def extract_polling_data(
    pdf_path: str,
    ac_id: Union[int, str],
    candidates_count: Optional[int] = None,
    station_count: Optional[int] = None,
) -> Dict[str, Any]:
    """Main extraction loop for Form-20 polling station data.

    Args:
        pdf_path: Path to the local Form-20 PDF file.
        ac_id: Assembly Constituency number/id.
        candidates_count: Optional ground truth count of contesting candidates.
        station_count: Optional ground truth count of polling stations.

    Returns:
        The extracted polling data dictionary.

    Raises:
        ValueError: If no Gemini API keys are configured.
    """
    keys = get_all_api_keys()
    if not keys:
        raise ValueError("No Gemini API keys found in environment.")

    out_path = os.path.join(ASSETS_DIR, f"{int(ac_id):03d}.json")
    all_st, cand, meta, state, start, end = _load_resumed_state(
        out_path, ac_id, candidates_count, station_count
    )

    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        prompt_template = f.read()

    ki, client, file_up, chat = 0, None, None, None
    ce = 0
    tried_spec = False

    while True:
        if station_count and start > station_count:
            break

        if not client:
            client, file_up, chat = _init_gemini_chat(keys, ki, pdf_path)
            if not client:
                break

        prompt = _format_extraction_prompt(
            prompt_template, start, end, candidates_count, station_count
        )
        print(f"[*] Extracting stations {start} to {end}...")

        data, key_exhausted = _try_extract_chunk(chat, file_up, prompt, keys, ki)
        if key_exhausted:
            ki += 1
            client = None
            continue
        if not data:
            break

        new = _update_extracted_data(data, all_st, cand, meta, state)
        ns, ne, ce = _determine_next_range(
            data, start, end, cand, new, ce, station_count, candidates_count
        )

        if ns:
            start, end = ns, ne
        elif _has_completed_summary_and_postal(state):
            break
        elif not tried_spec:
            print("[*] Requesting postal/summary specifically...")
            tried_spec = True
        else:
            break

        if start > 1000:
            break

    _ensure_summary_and_postal_recovery(chat, file_up, state, cand, candidates_count)

    chat, file_up, ki = _verify_and_rerun_mismatched_stations(
        chat=chat,
        file_upload=file_up,
        keys=keys,
        key_index=ki,
        pdf_path=pdf_path,
        prompt_template=prompt_template,
        all_stations=all_st,
        candidates=cand,
        candidates_count=candidates_count,
        station_count=station_count,
    )

    return _save_extraction_results(
        out_path, meta, cand, all_st, state, candidates_count, station_count
    )


def main():
    """Main CLI entrypoint for Form-20 extraction."""
    parser = argparse.ArgumentParser(
        description="Extract Form-20 polling station results using Gemini AI."
    )
    parser.add_argument("ac_id", help="Assembly Constituency Number (e.g. 128)")
    parser.add_argument(
        "--candidates-count",
        "--candidates",
        "-c",
        dest="candidates_count",
        type=int,
        default=None,
        help="Optional total number of contesting candidates in the constituency",
    )
    parser.add_argument(
        "--station-count",
        "--stations",
        "-s",
        dest="station_count",
        type=int,
        default=None,
        help="Optional total number of polling stations in the constituency",
    )
    parser.add_argument(
        "--force-download",
        action="store_true",
        help="Force re-downloading PDF even if it already exists locally",
    )
    args = parser.parse_args()
    try:
        path = get_pdf_path(args.ac_id, force=args.force_download)
        extract_polling_data(
            path,
            args.ac_id,
            candidates_count=args.candidates_count,
            station_count=args.station_count,
        )
    except Exception as e:
        print(f"[ERROR] {e}")


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="/Users/ideas2it/Projects/personal/knowyourmla/scraper/.env.local")
    main()
