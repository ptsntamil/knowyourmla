"""Script to run polling station extraction and verify/correct JSON files against PDFs.

This script automates running helper/polling_station_extracter.py for constituencies,
parses the Form 20 PDF programmatically to extract ground truth values, compares
the generated JSON, logs any mismatches, and corrects the JSON file with the PDF values.
"""

import os
import sys
import re
import json
import time
import subprocess
from typing import Dict, List, Tuple, Any, Optional, Union
import pdfplumber

# Configuration
BASE_DIR = "/Users/ideas2it/Projects/personal/knowyourmla/scraper"
ASSETS_DIR = os.path.join(BASE_DIR, "assets/2026/ac/polling")
PDF_DIR = os.path.join(ASSETS_DIR, "pdf")


def extract_numbers_from_line(line: str) -> List[Union[int, float]]:
    """Extracts all integer and float numbers from a line of text."""
    tokens = re.findall(r"\b\d+(?:\.\d+)?\b", line)
    numbers = []
    for t in tokens:
        if "." in t:
            numbers.append(float(t))
        else:
            numbers.append(int(t))
    return numbers


def find_candidate_votes(
    numbers: List[Union[int, float]], num_candidates: int
) -> Optional[Dict[str, Any]]:
    """Finds the contiguous segment of candidate votes matching the sum invariants.

    Returns the start index, candidate votes list, and indices for valid, nota,
    rejected, and total votes if found.
    """
    C = num_candidates
    if len(numbers) < C + 3:
        return None

    # Slide window of size C
    for s in range(len(numbers) - C):
        V = numbers[s : s + C]
        sum_V = sum(V)
        post_elements = numbers[s + C :]

        # Search for i_valid matching sum_V
        for i_valid in range(len(post_elements)):
            if abs(post_elements[i_valid] - sum_V) > 0.1:
                continue

            # Look for i_nota, i_rej, and i_total
            for i_nota in range(len(post_elements)):
                for i_rej in range(len(post_elements)):
                    for i_total in range(len(post_elements)):
                        if i_total in (i_valid, i_nota, i_rej):
                            continue

                        val_valid = post_elements[i_valid]
                        val_nota = post_elements[i_nota]
                        val_rej = post_elements[i_rej]
                        val_total = post_elements[i_total]

                        if abs(val_valid + val_nota + val_rej - val_total) < 0.1:
                            return {
                                "start_idx": s,
                                "candidate_votes": V,
                                "valid": int(val_valid),
                                "nota": int(val_nota),
                                "rej": int(val_rej),
                                "total": int(val_total),
                                "post_elements": post_elements,
                                "i_total": i_total,
                            }
    return None


def resolve_ps_number(
    numbers: List[Union[int, float]], start_idx: int, expected_ps: int
) -> int:
    """Resolves the polling station number from numbers list with noise-correction."""
    potential_ps = []
    if start_idx > 0:
        potential_ps.append(int(numbers[start_idx - 1]))
    if start_idx > 1:
        potential_ps.append(int(numbers[start_idx - 2]))
    potential_ps.append(int(numbers[0]))
    return min(potential_ps, key=lambda x: abs(x - expected_ps))


# Keywords that always appear (at least partially) in summary row text even after OCR
_SUMMARY_KEYWORDS = ["total", "postal", "ballot", "recorded", "evm"]


def _has_summary_keyword(lower_line: str) -> bool:
    """Returns True if the line contains any known summary keyword."""
    return any(k in lower_line for k in _SUMMARY_KEYWORDS)


def _looks_like_summary_ps(candidate_votes: List[Union[int, float]], expected_ps: int) -> bool:
    """Heuristic: if the resolved PS-number candidate would be far above the expected
    next station number, the row is almost certainly a summary aggregate row."""
    # Summary row candidate-vote sums are typically in the tens-of-thousands
    total_candidate_votes = sum(candidate_votes)
    # Any row whose total candidate votes exceed a realistic single-station maximum
    # (we use 5000 as a safe upper bound for any single booth) is a summary row.
    return total_candidate_votes > 5000


def get_summary_type(lower_line: str) -> Optional[str]:
    """Determines the summary type of a line based on keyword matching."""
    if (
        "total no.of votes" in lower_line
        or "recorded at polling" in lower_line
        or "total evm" in lower_line
        or lower_line.strip().startswith("evm")
    ):
        return "EVM"
    if "postal" in lower_line or "ballot" in lower_line:
        return "POSTAL"
    if "total votes" in lower_line or "total polled" in lower_line or "votes" in lower_line:
        if (
            "polled" in lower_line
            or "grand" in lower_line
            or "votes" in lower_line
            or (
                "total" in lower_line
                and "evm" not in lower_line
                and "postal" not in lower_line
            )
        ):
            return "TOTAL"
    return None


def parse_pdf_data(
    pdf_path: str, num_candidates: int
) -> Tuple[
    List[Dict[str, Any]],
    Optional[Dict[str, Any]],
    Optional[Dict[str, Any]],
    Optional[Dict[str, Any]],
]:
    """Parses Form 20 PDF and returns polling stations and summary rows."""
    stations = []
    summary_evm = None
    summary_postal = None
    summary_total = None
    expected_ps = 1

    with pdfplumber.open(pdf_path) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text:
                continue

            for line in text.split("\n"):
                numbers = extract_numbers_from_line(line)
                match = find_candidate_votes(numbers, num_candidates)
                if not match:
                    continue

                lower_line = line.lower()
                is_summary = any(
                    k in lower_line
                    for k in ["total", "postal", "ballot", "recorded"]
                )

                v_dict = {
                    str(k + 1): int(v)
                    for k, v in enumerate(match["candidate_votes"])
                }
                entry = {
                    "v": v_dict,
                    "valid": match["valid"],
                    "nota": match["nota"],
                    "rej": match["rej"],
                    "total": match["total"],
                    "tendered": (
                        int(match["post_elements"][match["i_total"] + 1])
                        if match["i_total"] + 1 < len(match["post_elements"])
                        else 0
                    ),
                }

def _classify_row(
    lower_line: str,
    candidate_votes: List[Union[int, float]],
    expected_ps: int,
) -> str:
    """Classifies a matched PDF row as 'station', 'EVM', 'POSTAL', 'TOTAL', or 'unknown'.

    Args:
        lower_line: Lowercased full text of the matched row.
        candidate_votes: The extracted candidate vote values for this row.
        expected_ps: The next expected polling station number.

    Returns:
        One of: 'station', 'EVM', 'POSTAL', 'TOTAL', 'unknown'.
    """
    # 1. Keyword-based check first (most reliable when OCR is clean)
    if _has_summary_keyword(lower_line):
        summary_type = get_summary_type(lower_line)
        if summary_type:
            return summary_type
        # Has a summary keyword but couldn't map to a type — treat as unknown summary
        return "unknown"

    # 2. Volume heuristic: single-booth totals cannot exceed ~5000 votes
    if _looks_like_summary_ps(candidate_votes, expected_ps):
        # Determine which summary row this is by position: the first aggregate
        # row seen (after all stations) is EVM, second is POSTAL, third is TOTAL.
        # We return 'unknown' and let the caller resolve by insertion order.
        return "unknown"

    return "station"


def parse_pdf_data(
    pdf_path: str, num_candidates: int
) -> Tuple[
    List[Dict[str, Any]],
    Optional[Dict[str, Any]],
    Optional[Dict[str, Any]],
    Optional[Dict[str, Any]],
]:
    """Parses Form 20 PDF and returns polling stations and summary rows."""
    stations = []
    summary_evm = None
    summary_postal = None
    summary_total = None
    expected_ps = 1
    # Track aggregate rows that could not be keyword-classified (OCR-scrambled)
    unknown_summaries: List[Dict[str, Any]] = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text:
                continue

            for line in text.split("\n"):
                numbers = extract_numbers_from_line(line)
                match = find_candidate_votes(numbers, num_candidates)
                if not match:
                    continue

                lower_line = line.lower()
                candidate_votes = match["candidate_votes"]
                row_class = _classify_row(lower_line, candidate_votes, expected_ps)

                v_dict = {
                    str(k + 1): int(v)
                    for k, v in enumerate(candidate_votes)
                }
                entry = {
                    "v": v_dict,
                    "valid": match["valid"],
                    "nota": match["nota"],
                    "rej": match["rej"],
                    "total": match["total"],
                    "tendered": (
                        int(match["post_elements"][match["i_total"] + 1])
                        if match["i_total"] + 1 < len(match["post_elements"])
                        else 0
                    ),
                }

                if row_class == "station":
                    ps_no = resolve_ps_number(numbers, match["start_idx"], expected_ps)
                    # Guard: a legitimate station cannot be more than 10 ahead of
                    # the expected next PS number. If it is, the row is an aggregate
                    # summary whose leading number was mistaken for a PS number.
                    if ps_no > expected_ps + 10:
                        unknown_summaries.append(entry)
                    else:
                        entry["ps"] = ps_no
                        stations.append(entry)
                        expected_ps = ps_no + 1
                elif row_class == "EVM":
                    summary_evm = entry
                elif row_class == "POSTAL":
                    summary_postal = entry
                elif row_class == "TOTAL":
                    summary_total = entry
                else:
                    # unknown: defer — assign by insertion order after all rows processed
                    unknown_summaries.append(entry)

    # Resolve unknown summaries by insertion order: EVM → POSTAL → TOTAL
    for entry in unknown_summaries:
        if summary_evm is None:
            summary_evm = entry
        elif summary_postal is None:
            summary_postal = entry
        elif summary_total is None:
            summary_total = entry

    return stations, summary_evm, summary_postal, summary_total


def check_stations_match(
    json_stations: List[Dict[str, Any]], pdf_stations: List[Dict[str, Any]]
) -> bool:
    """Verifies that json stations match pdf stations."""
    if len(json_stations) != len(pdf_stations):
        return False
    for js, ps in zip(json_stations, pdf_stations):
        if (
            js.get("ps") != ps.get("ps")
            or js.get("v") != ps.get("v")
            or js.get("total") != ps.get("total")
        ):
            return False
    return True


def check_mismatch(
    json_data: Dict[str, Any],
    pdf_stations: List[Dict[str, Any]],
    pdf_postal: Optional[Dict[str, Any]],
    pdf_total: Optional[Dict[str, Any]],
) -> bool:
    """Checks if there's any mismatch between JSON data and PDF parsed data."""
    json_stations = json_data.get("stations", [])
    if not check_stations_match(json_stations, pdf_stations):
        print("[!] Station count/value mismatch.")
        return True

    json_postal = json_data.get("postal")
    if not json_postal or json_postal.get("total", 0) == 0:
        print("[!] JSON postal data is missing or empty.")
        return True
    if pdf_postal and json_postal.get("total") != pdf_postal.get("total"):
        print("[!] Postal total mismatch.")
        return True

    json_summary = json_data.get("polling_station_summary")
    if not json_summary or json_summary.get("total", 0) == 0:
        print("[!] JSON summary data is missing or empty.")
        return True
    if pdf_total and json_summary.get("total") != pdf_total.get("total"):
        print("[!] Summary total mismatch.")
        return True

    return False


def apply_json_corrections(
    json_data: Dict[str, Any],
    pdf_stations: List[Dict[str, Any]],
    pdf_postal: Optional[Dict[str, Any]],
    pdf_total: Optional[Dict[str, Any]],
    json_path: str,
):
    """Applies corrections to JSON data and saves it to json_path."""
    # Preserve ps_name and electors from existing json stations if available
    ps_metadata = {
        s["ps"]: {k: s[k] for k in ("ps_name", "electors") if k in s}
        for s in json_data.get("stations", [])
        if "ps" in s
    }

    corrected_stations = []
    for ps in pdf_stations:
        station_entry = ps.copy()
        ps_num = station_entry.get("ps")
        if ps_num in ps_metadata:
            station_entry.update(ps_metadata[ps_num])
        corrected_stations.append(station_entry)

    json_data["stations"] = corrected_stations
    if pdf_postal:
        json_data["postal"] = {
            "v": pdf_postal["v"],
            "nota": pdf_postal["nota"],
            "rejected": pdf_postal["rej"],
            "valid": pdf_postal["valid"],
            "total": pdf_postal["total"],
        }
    if pdf_total:
        json_data["polling_station_summary"] = {
            "v": pdf_total["v"],
            "valid": pdf_total["valid"],
            "rej": pdf_total["rej"],
            "nota": pdf_total["nota"],
            "total": pdf_total["total"],
            "tendered": pdf_total["tendered"],
        }
    json_data["validation"] = {
        "range_complete": True,
        "actual_station_count": len(pdf_stations),
    }
    with open(json_path, "w") as f:
        json.dump(json_data, f, indent=2)


def verify_and_correct_json(ac_id: int) -> bool:
    """Compares the generated JSON against the PDF and corrects any mismatches."""
    json_path = os.path.join(ASSETS_DIR, f"{ac_id:03d}.json")
    pdf_path = os.path.join(PDF_DIR, f"AC{ac_id:03d}.pdf")

    if not os.path.exists(json_path) or not os.path.exists(pdf_path):
        print(f"[!] File missing: {json_path} or {pdf_path}")
        return False

    with open(json_path, "r") as f:
        json_data = json.load(f)

    candidates = json_data.get("candidates", {})
    num_candidates = len(candidates)
    if num_candidates == 0:
        print("[!] No candidates found in JSON metadata.")
        return False

    print(f"[*] Parsing PDF ground truth for AC {ac_id}...")
    pdf_stations, _, pdf_postal, pdf_total = parse_pdf_data(
        pdf_path, num_candidates
    )

    mismatch = check_mismatch(json_data, pdf_stations, pdf_postal, pdf_total)

    if mismatch:
        print(f"[*] Correcting JSON file for AC {ac_id} with PDF values...")
        apply_json_corrections(
            json_data, pdf_stations, pdf_postal, pdf_total, json_path
        )
        print(f"[+] Corrected JSON saved successfully.")
    else:
        print(f"[+] Verification passed for AC {ac_id}. JSON matches PDF perfectly.")

    return True


def run_ac(ac_id: int) -> bool:
    """Runs extraction for a constituency and verifies the results."""
    print(f"\n==========================================")
    print(f"[*] Processing AC {ac_id}...")
    print(f"==========================================")

    json_path = os.path.join(ASSETS_DIR, f"{ac_id:03d}.json")

    # Clean up incomplete JSON files
    if os.path.exists(json_path):
        try:
            with open(json_path, "r") as f:
                json_data = json.load(f)
            if not json_data.get("candidates"):
                print(f"[*] Deleting corrupted/incomplete JSON for AC {ac_id}...")
                os.remove(json_path)
        except Exception:
            print(f"[*] Deleting unreadable JSON for AC {ac_id}...")
            os.remove(json_path)

    # Run extraction with retry for 503/errors
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        # Delete corrupted/incomplete JSON before the attempt so it starts fresh
        if os.path.exists(json_path):
            try:
                with open(json_path, "r") as f:
                    jd = json.load(f)
                if not jd.get("candidates"):
                    print(
                        f"[*] Deleting corrupted/incomplete JSON for AC {ac_id} before attempt {attempt}..."
                    )
                    os.remove(json_path)
            except Exception:
                print(f"[*] Deleting unreadable JSON for AC {ac_id} before attempt {attempt}...")
                os.remove(json_path)

        cmd = [
            "/Users/ideas2it/Projects/personal/knowyourmla/venv/bin/python",
            "helper/polling_station_extracter.py",
            str(ac_id),
        ]
        print(f"[*] Running (Attempt {attempt}/{max_attempts}): {' '.join(cmd)}")
        result = subprocess.run(cmd, cwd=BASE_DIR, capture_output=True, text=True)

        print(result.stdout)
        if result.stderr:
            print(f"[stderr]:\n{result.stderr}")

        if "RESOURCE_EXHAUSTED" in result.stdout or "RESOURCE_EXHAUSTED" in result.stderr:
            print(f"\n[!!!] API key exhausted while processing AC {ac_id}!")
            return False

        # Verify that candidates were successfully extracted
        if os.path.exists(json_path):
            try:
                with open(json_path, "r") as f:
                    jd = json.load(f)
                if jd.get("candidates"):
                    break  # Success!
            except Exception:
                pass

        print("[*] Extraction failed or candidates missing. Retrying in 10 seconds...")
        time.sleep(10)

    # 2. Verify and Correct
    return verify_and_correct_json(ac_id)


def main():
    if len(sys.argv) < 2:
        print("Usage: python helper/run_and_verify.py <start_ac> [end_ac]")
        sys.exit(1)

    start_ac = int(sys.argv[1])
    end_ac = int(sys.argv[2]) if len(sys.argv) > 2 else 234

    print(f"[*] Starting extraction & verification from AC {start_ac} to {end_ac}")

    for ac in range(start_ac, end_ac + 1):
        success = run_ac(ac)
        if not success:
            print(
                f"\n[STOP] Key exhausted or error occurred at AC {ac}. Please update the API key and resume."
            )
            sys.exit(1)

    print("\n[+] All constituencies completed successfully!")


if __name__ == "__main__":
    main()
