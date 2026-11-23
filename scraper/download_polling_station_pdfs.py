#!/usr/bin/env python3
"""Downloads all 234 Tamil Nadu Assembly Constituency Polling Station List PDFs from ECI / CEO TN."""

import os
import re
import sys
import argparse
from typing import Dict, List, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

BASE_PORTAL_URL = "https://www.elections.tn.gov.in"
INDEX_URL = f"{BASE_PORTAL_URL}/PSLIST_06042026.aspx"
DEFAULT_DOWNLOAD_DIR = "/Users/ideas2it/Projects/personal/knowyourmla/scraper/assets/polling_stations/pdf"


def fetch_pdf_catalog(index_url: str = INDEX_URL, timeout: int = 30) -> Dict[int, str]:
    """Fetches the official polling stations directory page and extracts all English PDF URLs.

    Args:
        index_url: URL to the PSLIST ASPX page.
        timeout: HTTP request timeout in seconds.

    Returns:
        Mapping of AC Number (1 to 234) -> Full PDF URL.

    Raises:
        requests.RequestException: If fetching index page fails.
        ValueError: If no PDF URLs can be identified.
    """
    print(f"[*] Fetching master directory from {index_url}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    response = requests.get(index_url, headers=headers, timeout=timeout)
    response.raise_for_status()

    # Pattern captures: PSLIST_06042026/dt<district_no>/English/AC<ac_no>.pdf
    pattern = r'href=["\'](PSLIST_06042026/dt\d+/English/AC(\d+)\.pdf)["\']'
    matches = re.findall(pattern, response.text, flags=re.IGNORECASE)

    catalog: Dict[int, str] = {}
    for relative_path, ac_str in matches:
        ac_num = int(ac_str)
        full_url = f"{BASE_PORTAL_URL}/{relative_path}" if not relative_path.startswith("http") else relative_path
        catalog[ac_num] = full_url

    if not catalog:
        raise ValueError(f"No English AC PDF URLs found on {index_url}")

    print(f"[+] Discovered {len(catalog)} Assembly Constituency PDF links.")
    return catalog


def download_single_pdf(
    ac_num: int,
    url: str,
    dest_dir: str,
    force: bool = False,
    timeout: int = 60,
) -> Tuple[int, bool, str]:
    """Downloads a single constituency PDF to the destination folder.

    Args:
        ac_num: Assembly constituency number.
        url: Full URL to the remote PDF.
        dest_dir: Target directory path.
        force: If True, re-downloads even if already present locally.
        timeout: HTTP download timeout.

    Returns:
        Tuple of (ac_num, success_flag, message).
    """
    dest_path = os.path.join(dest_dir, f"AC{ac_num:03d}.pdf")
    if not force and os.path.exists(dest_path) and os.path.getsize(dest_path) > 1024:
        return ac_num, True, f"Skipped (already exists: {os.path.basename(dest_path)})"

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        }
        res = requests.get(url, headers=headers, stream=True, timeout=timeout)
        res.raise_for_status()

        temp_path = f"{dest_path}.tmp"
        with open(temp_path, "wb") as f:
            for chunk in res.iter_content(chunk_size=16384):
                if chunk:
                    f.write(chunk)
        os.replace(temp_path, dest_path)
        size_kb = os.path.getsize(dest_path) // 1024
        return ac_num, True, f"Downloaded AC{ac_num:03d}.pdf ({size_kb} KB)"
    except Exception as exc:
        return ac_num, False, f"Failed AC{ac_num:03d}: {exc}"


def download_all_constituency_pdfs(
    start_ac: int = 1,
    end_ac: int = 234,
    dest_dir: str = DEFAULT_DOWNLOAD_DIR,
    max_workers: int = 8,
    force: bool = False,
) -> Dict[str, Any]:
    """Downloads polling station PDFs for a range of assembly constituencies.

    Args:
        start_ac: Starting AC number (default: 1).
        end_ac: Ending AC number (default: 234).
        dest_dir: Local destination folder.
        max_workers: Concurrency level for parallel downloads.
        force: If True, redownload existing files.

    Returns:
        Summary dictionary with downloaded, skipped, and failed lists.
    """
    os.makedirs(dest_dir, exist_ok=True)
    catalog = fetch_pdf_catalog()

    targets = [ac for ac in range(start_ac, end_ac + 1) if ac in catalog]
    print(f"[*] Starting download of {len(targets)} PDFs into {dest_dir} (concurrency: {max_workers})...")

    results = {"success": [], "failed": [], "total": len(targets)}

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_map = {
            executor.submit(
                download_single_pdf,
                ac,
                catalog[ac],
                dest_dir,
                force=force,
            ): ac
            for ac in targets
        }

        for future in as_completed(future_map):
            ac_num, success, message = future.result()
            if success:
                results["success"].append(ac_num)
                print(f"  [+] {message}")
            else:
                results["failed"].append(ac_num)
                print(f"  [!] {message}", file=sys.stderr)

    print(
        f"\n[DONE] Finished download. Success: {len(results['success'])}/{len(targets)}, "
        f"Failed: {len(results['failed'])}"
    )
    return results


def main():
    """CLI entry point for batch PDF downloader."""
    parser = argparse.ArgumentParser(
        description="Download all 234 TN Assembly Constituency Polling Station List PDFs."
    )
    parser.add_argument("--start", "-s", type=int, default=1, help="Start AC number (default: 1)")
    parser.add_argument("--end", "-e", type=int, default=234, help="End AC number (default: 234)")
    parser.add_argument(
        "--output-dir", "-o", default=DEFAULT_DOWNLOAD_DIR, help="Destination directory"
    )
    parser.add_argument(
        "--workers", "-w", type=int, default=8, help="Parallel worker threads (default: 8)"
    )
    parser.add_argument(
        "--force", "-f", action="store_true", help="Force re-download existing files"
    )
    args = parser.parse_args()

    download_all_constituency_pdfs(
        start_ac=args.start,
        end_ac=args.end,
        dest_dir=args.output_dir,
        max_workers=args.workers,
        force=args.force,
    )


if __name__ == "__main__":
    main()
