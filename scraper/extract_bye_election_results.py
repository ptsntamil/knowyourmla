#!/usr/bin/env python3

"""
ECI Bye-Election Results Scraper and OpenCity CSV Generator
===========================================================

Extracts assembly bye-election results from the Election Commission of India (ECI)
results portal and outputs a CSV matching the OpenCity / TCPD schema supported by
`scraper/import_election_csv.py`.

Key Features:
- Extracts State, Assembly Constituency Name, and AC Number from `.page-title`
- Parses candidate results table (Candidate, Party, EVM, Postal, Total, % Votes)
- Calculates valid votes, margins, ENOP, turnout, and deposit status
- Enriches records with electors and demographics from local assets
"""

import os
import re
import csv
import sys
import json
import logging
import argparse
import urllib.request
from typing import Dict, Any, List, Tuple

from bs4 import BeautifulSoup

# Ensure repository root is on path for module imports
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scraper.helper.opencity_constants import OPENCITY_HEADERS, ROW_DEFAULTS
from scraper.utils import normalize_name

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("bye_election_extractor")

DEFAULT_TARGET_URLS = [
    "https://results.eci.gov.in/ResultAcByeOct2026/ConstituencywiseS2235.htm",
    "https://results.eci.gov.in/ResultAcByeOct2026/ConstituencywiseS22101.htm"
]


def clean_int(val: Any) -> int:
    """Extracts an integer from a numeric or string value.

    Args:
        val: The input value to convert.

    Returns:
        Integer representation of cleaned digits, or 0.
    """
    if not val:
        return 0
    cleaned = re.sub(r"\D", "", str(val))
    return int(cleaned) if cleaned else 0


def clean_float(val: Any) -> float:
    """Extracts a float from a numeric or string value.

    Args:
        val: The input value to convert.

    Returns:
        Float representation, or 0.0 on failure.
    """
    if not val:
        return 0.0
    try:
        return float(str(val).replace("%", "").replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0


def parse_election_date(date_str: str) -> Tuple[int, int, int]:
    """Parses date string in YYYY/MM/DD or YYYY-MM-DD format.

    Args:
        date_str: Formatted date string (e.g., '2026/10/6').

    Returns:
        Tuple of (year, month, day) as integers.

    Raises:
        ValueError: If format is invalid or integers cannot be parsed.
    """
    parts = date_str.strip().replace("-", "/").split("/")
    if len(parts) != 3:
        raise ValueError(f"Invalid date format '{date_str}'. Expected YYYY/MM/DD.")
    return int(parts[0]), int(parts[1]), int(parts[2])


def extract_page_title_info(soup: BeautifulSoup) -> Dict[str, Any]:
    """Extracts constituency number, name, state, and election title from .page-title.

    Args:
        soup: BeautifulSoup parsed object of the ECI page.

    Returns:
        Dictionary containing constituency_no, constituency_name, state_name,
        raw_state, and election_title.

    Raises:
        ValueError: If .page-title or required title elements cannot be found.
    """
    page_title = soup.find(class_="page-title")
    if not page_title:
        raise ValueError("Could not find .page-title in HTML")

    h1_elem = page_title.find("h1")
    election_title = h1_elem.get_text(separator=" ", strip=True) if h1_elem else ""

    h2_elem = page_title.find("h2")
    if not h2_elem:
        raise ValueError("Could not find <h2> in .page-title")

    text = h2_elem.get_text(separator=" ", strip=True)
    pattern = r"Assembly\s+Constituency\s*[:\-]?\s*(\d+)\s*-\s*([^(]+?)\s*\(([^)]+)\)"
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        raise ValueError(f"Failed to parse constituency from title: '{text}'")

    raw_state = match.group(3).strip()
    return {
        "constituency_no": int(match.group(1).strip()),
        "constituency_name": match.group(2).strip().upper(),
        "state_name": raw_state.replace(" ", "_"),
        "raw_state": raw_state,
        "election_title": election_title
    }


def extract_table_results(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extracts candidate vote rows from the ECI results table.

    Args:
        soup: BeautifulSoup object of the constituency results page.

    Returns:
        List of candidate dictionaries with votes and percentages.

    Raises:
        ValueError: If no valid results table or rows are found.
    """
    table = soup.find("table")
    if not table or not table.find("tbody"):
        raise ValueError("No valid results table with <tbody> found in HTML")

    rows = table.find("tbody").find_all("tr")
    candidates: List[Dict[str, Any]] = []

    for idx, row in enumerate(rows):
        cells = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cells) < 7:
            continue

        raw_name = cells[1].strip()
        raw_party = cells[2].strip()
        is_nota = raw_name.upper() in ["NOTA", "NONE OF THE ABOVE"]

        cand_name = "None Of The Above" if is_nota else raw_name
        party_name = "None of the Above" if is_nota else raw_party

        candidates.append({
            "candidate": cand_name,
            "party": party_name,
            "is_nota": is_nota,
            "evm_votes": clean_int(cells[3]),
            "postal_votes": clean_int(cells[4]),
            "total_votes": clean_int(cells[5]),
            "vote_share": clean_float(cells[6])
        })

    if not candidates:
        raise ValueError("No candidate records found in results table")
    return candidates


def load_constituency_metadata_fallback() -> Dict[str, Dict[str, Any]]:
    """Loads constituency metadata (Electors, District, Type) from existing local assets.

    Returns:
        Dictionary mapping uppercase constituency name to metadata dictionary.
    """
    metadata_map: Dict[str, Dict[str, Any]] = {
        "MADURANTAKAM": {"electors": 212639, "district": "CHENGALPATTU", "type": "SC"},
        "DHARAPURAM": {"electors": 222406, "district": "TIRUPPUR", "type": "SC"}
    }
    csv_path = os.path.join(SCRIPT_DIR, "assets", "OpenCity_TN_Assembly_Election_2026.csv")
    if os.path.exists(csv_path):
        try:
            with open(csv_path, mode="r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    name = row.get("Constituency_Name", "").strip().upper()
                    if name and name not in metadata_map:
                        metadata_map[name] = {
                            "electors": clean_int(row.get("Electors")),
                            "district": row.get("District_Name", "").strip().upper(),
                            "type": row.get("Constituency_Type", "GEN").strip().upper()
                        }
        except Exception as exc:
            logger.warning(f"Error loading OpenCity metadata fallback: {exc}")
    return metadata_map


def load_candidate_demographics_fallback() -> Dict[Tuple[str, str], Dict[str, Any]]:
    """Loads candidate demographics (Age, Gender) from tn_bye_election_candidates.json.

    Returns:
        Dictionary mapping (normalized_name, normalized_constituency) to demographic data.
    """
    demographics_map: Dict[Tuple[str, str], Dict[str, Any]] = {}
    json_path = os.path.join(SCRIPT_DIR, "tn_bye_election_candidates.json")
    if not os.path.exists(json_path):
        return demographics_map

    try:
        with open(json_path, mode="r", encoding="utf-8") as f:
            for cand in json.load(f):
                c_name, c_const = cand.get("name"), cand.get("constituency")
                if c_name and c_const:
                    key = (normalize_name(c_name), normalize_name(c_const))
                    extracted = cand.get("extracted_data") or {}
                    age_val = clean_int(cand.get("Age") or extracted.get("age"))
                    gender = cand.get("Gender") or extracted.get("gender") or ""
                    demographics_map[key] = {
                        "age": age_val,
                        "sex": gender.capitalize() if gender else ""
                    }
    except Exception as exc:
        logger.warning(f"Error loading candidate demographics fallback: {exc}")
    return demographics_map


def calculate_metrics(candidates: List[Dict[str, Any]], electors: int) -> Tuple[int, float, float]:
    """Calculates valid votes, turnout percentage, and ENOP for candidates.

    Args:
        candidates: List of candidate dictionaries with 'total_votes'.
        electors: Total electors in the constituency.

    Returns:
        Tuple of (valid_votes, turnout_percentage, enop).
    """
    valid_votes = sum(c["total_votes"] for c in candidates)
    turnout_pct = round((valid_votes / electors * 100), 2) if electors > 0 else 0.0

    sum_share_sq = sum((c["total_votes"] / valid_votes) ** 2 for c in candidates if valid_votes > 0)
    enop = round(1 / sum_share_sq, 2) if sum_share_sq > 0 else 0.0
    return valid_votes, turnout_pct, enop


def calculate_margin(pos: int, votes: int, sorted_cands: List[Dict[str, Any]]) -> int:
    """Calculates vote margin for a candidate position.

    Args:
        pos: 1-based rank position.
        votes: Candidate total votes.
        sorted_cands: Candidates sorted descending by total votes.

    Returns:
        Vote margin integer.
    """
    n_cand = len(sorted_cands)
    if pos == 1:
        return votes - (sorted_cands[1]["total_votes"] if n_cand > 1 else 0)
    idx = pos - 1
    return votes - (sorted_cands[idx + 1]["total_votes"] if pos < n_cand else 0)


def build_opencity_row(
    cand: Dict[str, Any],
    pos: int,
    sorted_cands: List[Dict[str, Any]],
    title_info: Dict[str, Any],
    valid_votes: int,
    electors: int,
    turnout_pct: float,
    enop: float,
    const_meta: Dict[str, Any],
    demographics: Dict[Tuple[str, str], Dict[str, Any]],
    year: int,
    month: int
) -> Dict[str, Any]:
    """Constructs an OpenCity-formatted row dictionary for a candidate.

    Args:
        cand: Extracted candidate record.
        pos: 1-based rank position.
        sorted_cands: Sorted candidate list.
        title_info: Extracted constituency title info.
        valid_votes: Total valid votes in constituency.
        electors: Total electors.
        turnout_pct: Turnout percentage.
        enop: Effective Number of Parties score.
        const_meta: Constituency metadata (district, type).
        demographics: Candidate demographics map.
        year: Election year.
        month: Election month.

    Returns:
        Dictionary conforming to OPENCITY_HEADERS.
    """
    votes = cand["total_votes"]
    margin = calculate_margin(pos, votes, sorted_cands)
    margin_pct = round((margin / valid_votes * 100), 2) if valid_votes > 0 else 0.0
    deposit_lost = "yes" if (votes / valid_votes) <= (1 / 6) else "no"

    c_name = title_info["constituency_name"]
    demo_key = (normalize_name(cand["candidate"]), normalize_name(c_name))
    cand_demo = demographics.get(demo_key, {})

    vote_share = cand["vote_share"]
    if vote_share == 0.0 and valid_votes > 0:
        vote_share = round((votes / valid_votes * 100), 2)

    row = dict(ROW_DEFAULTS)
    row.update({
        "State_Name": title_info["state_name"],
        "Constituency_No": title_info["constituency_no"],
        "Year": year,
        "month": month,
        "Position": pos,
        "Candidate": cand["candidate"],
        "Sex": cand_demo.get("sex", ""),
        "Party": cand["party"],
        "Votes": votes,
        "Age": cand_demo.get("age", 0),
        "Valid_Votes": valid_votes,
        "Electors": electors,
        "Constituency_Name": c_name,
        "Constituency_Type": const_meta.get("type", "GEN"),
        "District_Name": const_meta.get("district", ""),
        "N_Cand": len(sorted_cands),
        "Turnout_Percentage": turnout_pct,
        "Vote_Share_Percentage": vote_share,
        "Deposit_Lost": deposit_lost,
        "Margin": margin,
        "Margin_Percentage": margin_pct,
        "ENOP": enop
    })
    return row


def fetch_html(source: str) -> str:
    """Fetches HTML from an HTTP(S) URL or reads from a local file.

    Args:
        source: URL or local filepath.

    Returns:
        HTML string content.

    Raises:
        FileNotFoundError: If local file is missing.
        urllib.error.URLError: If HTTP request fails.
    """
    if os.path.exists(source):
        with open(source, mode="r", encoding="utf-8") as f:
            return f.read()

    req = urllib.request.Request(
        source,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def process_constituency_page(
    html_content: str,
    year: int,
    month: int,
    metadata_map: Dict[str, Dict[str, Any]],
    demographics_map: Dict[Tuple[str, str], Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Parses a single constituency results page into OpenCity rows.

    Args:
        html_content: Raw HTML text of the page.
        year: Election year.
        month: Election month.
        metadata_map: Constituency metadata map.
        demographics_map: Candidate demographics map.

    Returns:
        List of OpenCity row dictionaries.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    title_info = extract_page_title_info(soup)
    raw_candidates = extract_table_results(soup)

    c_name = title_info["constituency_name"]
    const_meta = metadata_map.get(c_name, {"electors": 0, "district": "", "type": "GEN"})
    electors = const_meta.get("electors", 0)

    sorted_cands = sorted(raw_candidates, key=lambda x: x["total_votes"], reverse=True)
    valid_votes, turnout_pct, enop = calculate_metrics(sorted_cands, electors)

    rows: List[Dict[str, Any]] = []
    for idx, cand in enumerate(sorted_cands):
        pos = idx + 1
        row = build_opencity_row(
            cand=cand,
            pos=pos,
            sorted_cands=sorted_cands,
            title_info=title_info,
            valid_votes=valid_votes,
            electors=electors,
            turnout_pct=turnout_pct,
            enop=enop,
            const_meta=const_meta,
            demographics=demographics_map,
            year=year,
            month=month
        )
        rows.append(row)

    logger.info(
        f"Extracted {len(rows)} candidates for AC {title_info['constituency_no']} "
        f"({c_name}, {title_info['raw_state']}). Winner: {rows[0]['Candidate']} ({rows[0]['Party']})"
    )
    return rows


def write_opencity_csv(rows: List[Dict[str, Any]], output_path: str) -> None:
    """Exports rows to CSV matching OPENCITY_HEADERS.

    Args:
        rows: List of dictionary records.
        output_path: Target CSV file path.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=OPENCITY_HEADERS)
        writer.writeheader()
        writer.writerows(rows)
    logger.info(f"Successfully generated CSV with {len(rows)} rows: {output_path}")


def main():
    """Main CLI handler."""
    parser = argparse.ArgumentParser(
        description="Extract ECI bye-election results and generate OpenCity CSV."
    )
    parser.add_argument("--urls", nargs="+", default=DEFAULT_TARGET_URLS, help="ECI URLs or local HTML files.")
    parser.add_argument("--date", default="2026/10/6", help="Election date in YYYY/MM/DD format (default: 2026/10/6).")
    parser.add_argument("--year", type=int, default=None, help="Year override (defaults to year from --date).")
    parser.add_argument(
        "--output",
        default=os.path.join(SCRIPT_DIR, "assets", "OpenCity_TN_Assembly_Bye_Election_202610.csv"),
        help="Destination path for the output CSV."
    )

    args = parser.parse_args()
    date_year, date_month, _ = parse_election_date(args.date)
    year = args.year if args.year is not None else date_year

    logger.info(f"Processing bye-election results for Date: {args.date} (Year: {year}, Month: {date_month})")

    meta_map = load_constituency_metadata_fallback()
    demo_map = load_candidate_demographics_fallback()

    all_rows: List[Dict[str, Any]] = []
    for target in args.urls:
        try:
            logger.info(f"Fetching {target}...")
            html = fetch_html(target)
            rows = process_constituency_page(
                html_content=html,
                year=year,
                month=date_month,
                metadata_map=meta_map,
                demographics_map=demo_map
            )
            all_rows.extend(rows)
        except Exception as exc:
            logger.error(f"Failed processing '{target}': {exc}", exc_info=True)

    if all_rows:
        write_opencity_csv(all_rows, args.output)
    else:
        logger.error("No election results extracted. CSV output skipped.")


if __name__ == "__main__":
    main()
