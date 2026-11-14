#!/usr/bin/env python3
"""Check which AC polling station data is already imported into DynamoDB."""

import os
import sys
import csv
import glob
import json
import argparse
import logging
from typing import Dict, List, Any, Optional

import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

# Attempt loading environment variables from common project locations
for env_candidate in [
    os.path.join(os.path.dirname(__file__), ".env.local"),
    os.path.join(os.path.dirname(__file__), "..", ".env.local"),
    os.path.join(os.path.dirname(__file__), "..", "frontend", ".env.local"),
]:
    if os.path.exists(env_candidate):
        try:
            from dotenv import load_dotenv
            load_dotenv(env_candidate)
        except ImportError:
            pass

# Add scraper dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils import canonicalize_constituency, DecimalEncoder

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

POLLING_RESULTS_TABLE = "knowyourmla_polling_results"
DEFAULT_REGION = "ap-south-2"
DEFAULT_YEAR = 2026


class PollingImportChecker:
    """Checks imported polling station and AC summary data in DynamoDB."""

    def __init__(
        self,
        table_name: str = POLLING_RESULTS_TABLE,
        region: str = DEFAULT_REGION,
        dynamodb_resource: Optional[Any] = None,
    ):
        """Initializes the checker with DynamoDB table.

        Args:
            table_name: The DynamoDB table name for polling results.
            region: The AWS region where DynamoDB is hosted.
            dynamodb_resource: Optional pre-configured boto3 DynamoDB resource.
        """
        self.table_name = table_name
        self.region = region
        self.dynamodb = dynamodb_resource or boto3.resource("dynamodb", region_name=region)
        self.table = self.dynamodb.Table(table_name)

    def fetch_imported_summaries(self, year: int = DEFAULT_YEAR) -> Dict[str, Dict[str, Any]]:
        """Fetch all AC_SUMMARY records for a given election year.

        Args:
            year: The election year to query.

        Returns:
            Dictionary mapping canonical constituency ID to its summary record.
        """
        logger.info("Scanning %s for AC summaries (year=%d)...", self.table_name, year)
        summaries: Dict[str, Dict[str, Any]] = {}
        exclusive_start_key = None

        scan_kwargs: Dict[str, Any] = {
            "FilterExpression": Attr("SK").eq("AC_SUMMARY") & Attr("year").eq(year),
            "ProjectionExpression": (
                "PK, SK, constituency_id, #yr, total_valid_votes, "
                "total_votes_polled, total_electors, poll_percentage"
            ),
            "ExpressionAttributeNames": {"#yr": "year"},
        }

        while True:
            if exclusive_start_key:
                scan_kwargs["ExclusiveStartKey"] = exclusive_start_key

            response = self.table.scan(**scan_kwargs)
            for item in response.get("Items", []):
                cid = item.get("constituency_id", "").replace("CONSTITUENCY#", "").lower()
                if cid:
                    summaries[cid] = item

            exclusive_start_key = response.get("LastEvaluatedKey")
            if not exclusive_start_key:
                break

        logger.info("Found %d imported constituency summaries in DB.", len(summaries))
        return summaries

    def fetch_station_counts(self, year: int = DEFAULT_YEAR) -> Dict[str, int]:
        """Fetch count of individual polling stations imported per constituency.

        Args:
            year: The election year to query.

        Returns:
            Dictionary mapping canonical constituency ID to count of polling stations.
        """
        logger.info("Scanning %s for station counts (year=%d)...", self.table_name, year)
        counts: Dict[str, int] = {}
        exclusive_start_key = None

        scan_kwargs: Dict[str, Any] = {
            "FilterExpression": Attr("SK").eq("METADATA") & Attr("year").eq(year),
            "ProjectionExpression": "constituency_id",
        }

        while True:
            if exclusive_start_key:
                scan_kwargs["ExclusiveStartKey"] = exclusive_start_key

            response = self.table.scan(**scan_kwargs)
            for item in response.get("Items", []):
                cid = item.get("constituency_id", "").replace("CONSTITUENCY#", "").lower()
                if cid:
                    counts[cid] = counts.get(cid, 0) + 1

            exclusive_start_key = response.get("LastEvaluatedKey")
            if not exclusive_start_key:
                break

        return counts

    @staticmethod
    def load_master_constituencies(csv_path: Optional[str] = None) -> Dict[int, Dict[str, str]]:
        """Load all 234 assembly constituencies from the 2026 election CSV.

        Args:
            csv_path: Optional path to the election CSV.

        Returns:
            Dictionary mapping AC number to constituency details.
        """
        if not csv_path:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(script_dir, "assets", "OpenCity_TN_Assembly_Election_2026.csv")

        ac_map: Dict[int, Dict[str, str]] = {}
        if not os.path.exists(csv_path):
            return ac_map

        with open(csv_path, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                no_str = row.get("Constituency_No", "").strip()
                if no_str.isdigit() and int(no_str) not in ac_map:
                    raw_name = row.get("Constituency_Name", "").strip()
                    canon = canonicalize_constituency(raw_name) or raw_name.lower()
                    ac_map[int(no_str)] = {
                        "name": raw_name,
                        "district": row.get("District_Name", "").strip(),
                        "canonical_id": canon,
                    }
        return ac_map

    @staticmethod
    def load_local_json_files(polling_dir: Optional[str] = None) -> Dict[int, str]:
        """Find all local extracted Form 20 JSON files.

        Args:
            polling_dir: Optional path to directory with Form 20 JSON files.

        Returns:
            Dictionary mapping AC number to local JSON file path.
        """
        if not polling_dir:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            polling_dir = os.path.join(script_dir, "assets", "2026", "ac", "polling")

        local_files: Dict[int, str] = {}
        if not os.path.exists(polling_dir):
            return local_files

        for path in glob.glob(os.path.join(polling_dir, "[0-9][0-9][0-9].json")):
            base = os.path.basename(path)[:3]
            if base.isdigit():
                local_files[int(base)] = path

        return local_files

    def _build_status_item(
        self,
        ac_no: int,
        ac_info: Dict[str, str],
        local_files: Dict[int, str],
        db_summaries: Dict[str, Dict[str, Any]],
        station_counts: Dict[str, int],
    ) -> Dict[str, Any]:
        """Build status item dictionary for a single AC."""
        canon_id = ac_info["canonical_id"]
        has_local = ac_no in local_files
        summary = db_summaries.get(canon_id)

        item: Dict[str, Any] = {
            "ac_no": ac_no,
            "name": ac_info["name"],
            "district": ac_info["district"],
            "canonical_id": canon_id,
            "has_local_json": has_local,
            "local_file": local_files.get(ac_no),
            "is_imported": bool(summary),
        }

        if summary:
            item["turnout_pct"] = float(summary.get("poll_percentage", 0.0))
            item["valid_votes"] = int(summary.get("total_valid_votes", 0))
            if canon_id in station_counts:
                item["station_count"] = station_counts[canon_id]

        return item

    def analyze_status(
        self,
        year: int = DEFAULT_YEAR,
        count_stations: bool = False,
    ) -> Dict[str, Any]:
        """Analyzes import status across all constituencies.

        Args:
            year: Election year to inspect.
            count_stations: Whether to perform detailed scan for station counts.

        Returns:
            Detailed status dictionary with categorized lists.
        """
        masters = self.load_master_constituencies()
        locals_map = self.load_local_json_files()
        summaries = self.fetch_imported_summaries(year=year)
        counts = self.fetch_station_counts(year=year) if count_stations else {}

        imported: List[Dict[str, Any]] = []
        pending: List[Dict[str, Any]] = []
        missing: List[Dict[str, Any]] = []

        for ac_no in sorted(masters.keys() if masters else locals_map.keys()):
            info = masters.get(ac_no, {
                "name": f"AC_{ac_no:03d}",
                "district": "Unknown",
                "canonical_id": f"ac_{ac_no}",
            })
            item = self._build_status_item(ac_no, info, locals_map, summaries, counts)

            if item["is_imported"]:
                imported.append(item)
            elif item["has_local_json"]:
                pending.append(item)
            else:
                missing.append(item)

        return {
            "year": year,
            "total_constituencies": len(masters) or len(locals_map),
            "imported_count": len(imported),
            "pending_import_count": len(pending),
            "missing_count": len(missing),
            "imported": imported,
            "pending_import": pending,
            "missing": missing,
        }


def _matches_ac(row: Dict[str, Any], query: Optional[str]) -> bool:
    """Check if row matches target AC query."""
    if not query:
        return True
    q = query.strip().lower()
    if q.isdigit() and row["ac_no"] == int(q):
        return True
    return q in row["name"].lower() or q in row["canonical_id"]


def _print_section(title: str, rows: List[Dict[str, Any]], status: str, query: Optional[str]):
    """Prints a categorized section table."""
    matching = [r for r in rows if _matches_ac(r, query)]
    if not matching:
        return

    print(f"--- {title} ({len(matching)} ACs) ---")
    print(f"  {'AC':>3} | {'Constituency':<22} | {'District':<16} | {'Status':<16} | Details")
    print("  " + "-" * 76)

    for r in matching:
        extra = ""
        if status == "IMPORTED":
            extra = f"Turnout: {r.get('turnout_pct', 0)}% | Votes: {r.get('valid_votes', 0):,}"
            if "station_count" in r:
                extra += f" | Stations: {r['station_count']}"
        elif status == "PENDING IMPORT":
            extra = f"File: {os.path.basename(r.get('local_file', ''))}"
        else:
            extra = "Needs Form 20 extraction"

        print(f"  {r['ac_no']:>3} | {r['name']:<22} | {r['district']:<16} | {status:<16} | {extra}")
    print()


def print_cli_report(report: Dict[str, Any], only_imp: bool = False, only_mis: bool = False, q: Optional[str] = None):
    """Prints a structured text report to the terminal."""
    total = report["total_constituencies"]
    imp = report["imported_count"]
    pct = (imp / total * 100) if total else 0.0

    print("\n" + "=" * 80)
    print(f"  KNOWYOURMLA POLLING DATA IMPORT STATUS (Year: {report['year']})")
    print("=" * 80)
    print(f"  Total Constituencies:    {total:>3}")
    print(f"  Imported to Database:    {imp:>3} ({pct:.1f}%)")
    print(f"  Pending Import (Local):  {report['pending_import_count']:>3} (Extracted JSON exists)")
    print(f"  Missing Extraction:      {report['missing_count']:>3}")
    print("=" * 80 + "\n")

    if not only_mis:
        _print_section("1. IMPORTED TO DYNAMODB", report["imported"], "IMPORTED", q)
    if not only_imp:
        _print_section("2. PENDING IMPORT (LOCAL JSON READY)", report["pending_import"], "PENDING IMPORT", q)
        _print_section("3. MISSING EXTRACTION", report["missing"], "NOT EXTRACTED", q)


def main():
    """Main CLI entrypoint."""
    parser = argparse.ArgumentParser(description="Check AC polling station import status.")
    parser.add_argument("--year", type=int, default=DEFAULT_YEAR, help="Election year (default: 2026)")
    parser.add_argument("--table", default=POLLING_RESULTS_TABLE, help="DynamoDB table name")
    parser.add_argument("--region", default=DEFAULT_REGION, help="AWS Region (default: ap-south-2)")
    parser.add_argument("--count-stations", action="store_true", help="Count individual polling stations per AC")
    parser.add_argument("--only-imported", action="store_true", help="Display only imported ACs")
    parser.add_argument("--only-missing", action="store_true", help="Display only unimported ACs")
    parser.add_argument("--ac", help="Filter by AC number or name")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    args = parser.parse_args()

    try:
        checker = PollingImportChecker(table_name=args.table, region=args.region)
        report = checker.analyze_status(year=args.year, count_stations=args.count_stations)

        if args.json:
            print(json.dumps(report, indent=2, cls=DecimalEncoder))
        else:
            print_cli_report(report, only_imp=args.only_imported, only_mis=args.only_missing, q=args.ac)

    except ClientError as e:
        logger.error("AWS DynamoDB error: %s", e)
        sys.exit(1)
    except Exception as e:
        logger.error("Unexpected error: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
