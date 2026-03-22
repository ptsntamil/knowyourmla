#!/usr/bin/env python3

import argparse
import json
import time
import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Dict, Iterable, List, Optional, Tuple

import boto3
import httpx
from bs4 import BeautifulSoup
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
from concurrent.futures import ThreadPoolExecutor, as_completed

from utils import clean_constituency, normalize_name, CONSTITUENCY_ALIAS_MAP


REGION_NAME = "ap-south-2"
CONSTITUENCIES_TABLE = "knowyourmla_constituencies"
CANDIDATES_TABLE = "knowyourmla_candidates"


@dataclass(frozen=True)
class Suggestion:
    alias: str
    canonical: str
    score: float
    example_raw: str


def _ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def scan_constituency_canonicals(
    dynamodb, table_name: str = CONSTITUENCIES_TABLE
) -> List[str]:
    """Return list of canonical normalized_name values from DynamoDB."""
    table = dynamodb.Table(table_name)
    canon: List[str] = []

    scan_kwargs = {
        "FilterExpression": Attr("SK").eq("METADATA"),
        "ProjectionExpression": "normalized_name",
    }

    response = table.scan(**scan_kwargs)
    canon.extend([i["normalized_name"] for i in response.get("Items", []) if i.get("normalized_name")])
    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"], **scan_kwargs)
        canon.extend([i["normalized_name"] for i in response.get("Items", []) if i.get("normalized_name")])

    # de-dupe while preserving order
    seen = set()
    out = []
    for x in canon:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def read_raw_names_file(path: str) -> List[str]:
    raw: List[str] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            raw.append(s)
    return raw

def get_profile_urls(start_id  = 1 , max_id = 4500) -> List[str]:
    URL = "https://myneta.info/tamilnadu2021/candidate.php?candidate_id="
    URLS = []
    for i in range(start_id, max_id):
        URLS.append(URL + str(i))
    return URLS


def scan_candidate_profile_urls(
    dynamodb,
    table_name: str = CANDIDATES_TABLE,
    limit: Optional[int] = 500,
    max_id: int = 5000,
) -> List[str]:
    """Scan candidate table to find which IDs are already processed and return gaps to scrape."""
    # table = dynamodb.Table(table_name)
    # existing_urls = set()

    # # Scan for existing profile_urls
    # scan_kwargs = {
    #     "ProjectionExpression": "profile_url",
    # }
    
    # print(f"Scanning {table_name} for existing candidates...")
    # response = table.scan(**scan_kwargs)
    # for i in response.get("Items", []):
    #     if "profile_url" in i:
    #         existing_urls.add(i["profile_url"])
    
    # while "LastEvaluatedKey" in response:
    #     response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"], **scan_kwargs)
    #     for i in response.get("Items", []):
    #         if "profile_url" in i:
    #             existing_urls.add(i["profile_url"])

    # print(f"Found {len(existing_urls)} existing candidates in DB.")

    # base_url = "https://myneta.info/tamilnadu2021/candidate.php?candidate_id="
    # gap_urls = []
    
    # # Check IDs from 1 to max_id
    # for i in range(1, max_id + 1):
    #     url = base_url + str(i)
    #     if url not in existing_urls:
    #         gap_urls.append(url)
    #         if len(gap_urls) >= limit:
    #             break
                
    # return gap_urls
    return get_profile_urls(max_id=limit)

def _deobfuscate_page(html: str) -> str:
    """Reused from enrichment.py to handle Myneta's Javascript obfuscation."""
    pattern = r'<script[^>]*>(?:(?!</script>).)*?eval\(function\(h,u,n,t,e,r\)\{.*?\}\((.*?),(\d+),"(.*?)",(\d+),(\d+),(\d+)\)\).*?</script>'
    def replace_eval(match):
        try:
            h, u, n, t, r_val, e = (
                match.group(1).strip().strip("'").strip('"'),
                int(match.group(2)),
                match.group(3),
                int(match.group(4)),
                int(match.group(5)),
                int(match.group(6)),
            )
            deobf = _deobfuscate_string(h, u, n, t, r_val, e)
            deobf = (
                deobf.replace("document.write('", "")
                .replace("');", "")
                .replace("document.write(\"", "")
                .replace("\");", "")
                .replace("\\'", "'")
                .replace('\\"', '"')
            )
            return deobf
        except Exception:
            return match.group(0)
    return re.sub(pattern, replace_eval, html, flags=re.DOTALL)


def _deobfuscate_string(h, u, n, t, e, r_param):
    """Core decoding logic for Myneta obfuscation."""
    def base_decode(d, bf, bt):
        alph = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/"
        h_c, i_c, j = alph[0:bf], alph[0:bt], 0
        for idx, c in enumerate(reversed(d)):
            v = h_c.find(c)
            if v != -1:
                j += v * (bf**idx)
        if j == 0:
            return "0"
        k = ""
        while j > 0:
            k = i_c[j % bt] + k
            j = (j - (j % bt)) // bt
        return k

    dec_r, i, delim = "", 0, n[e]
    while i < len(h):
        s = ""
        while i < len(h) and h[i] != delim:
            s += h[i]
            i += 1
        i += 1
        ts = s
        for jj in range(len(n)):
            ts = ts.replace(n[jj], str(jj))
        if ts:
            try:
                dec_r += chr(int(base_decode(ts, e, 10)) - t)
            except Exception:
                pass
    try:
        return dec_r.encode("latin1", errors="ignore").decode("utf-8", errors="ignore")
    except Exception:
        return dec_r


def extract_raw_constituency_strings_from_candidate_page(html: str) -> List[str]:
    """Extract possible constituency strings (raw-ish) from candidate page HTML."""
    if "eval(function(h,u,n,t,e,r)" in html:
        html = _deobfuscate_page(html)
        
    soup = BeautifulSoup(html, "lxml")
    out: List[str] = []

    # Contest constituency from breadcrumb
    crumb_links = soup.select("a[href*='constituency_id']")
    if crumb_links:
        out.append(crumb_links[-1].get_text(strip=True))

    # Voter constituency from the voter enrollment text
    voter_info_tag = soup.find(string=re.compile(r"Enrolled as Voter in", re.I))
    if voter_info_tag:
        container = voter_info_tag.parent.parent
        p_text = container.get_text(strip=True).replace("\xa0", " ")
        voter_match = re.search(
            r"Enrolled as Voter in:\s*(?:\d+,)?\s*(.*?)\s*constituency,\s*at Serial no\s*(\d+)\s*in Part no\s*(\d+)",
            p_text,
            re.I,
        )
        if voter_match:
            out.append(voter_match.group(1).strip())
    
    print(f"Extracted {out}")
    return [x for x in out if x]


def fetch_pages_and_extract_raw_names(
    urls: List[str], concurrency: int = 10, timeout_s: int = 30
) -> List[str]:
    raw_names: List[str] = []

    def worker(client: httpx.Client, url: str) -> List[str]:
        try:
            r = client.get(url, timeout=timeout_s)
            print(f"Fetched {url} with status {r.status_code}")
            r.raise_for_status()
            return extract_raw_constituency_strings_from_candidate_page(r.text)
        except Exception as e:
            # print(f"Error fetching {url}: {e}")
            return []

    with httpx.Client(timeout=timeout_s, follow_redirects=True) as client:
        with ThreadPoolExecutor(max_workers=concurrency) as ex:
            futures = [ex.submit(worker, client, u) for u in urls]
            for f in as_completed(futures):
                raw_names.extend(f.result())

    return raw_names


def best_canonical_match(alias_norm: str, canon_list: List[str]) -> Tuple[Optional[str], float]:
    best = None
    best_score = 0.0
    for c in canon_list:
        s = _ratio(alias_norm, c)
        if s > best_score:
            best = c
            best_score = s
    return best, best_score


def suggest_aliases(
    raw_names: Iterable[str],
    canon_list: List[str],
    threshold: float,
    skip_known: bool = True,
) -> Dict[str, Suggestion]:
    canon_set = set(canon_list)
    suggestions: Dict[str, Suggestion] = {}

    for raw in raw_names:
        cleaned = clean_constituency(raw) or raw.strip()
        alias_norm = normalize_name(cleaned)
        if not alias_norm or len(alias_norm) < 4:
            continue

        if alias_norm in canon_set:
            continue

        if skip_known and alias_norm in CONSTITUENCY_ALIAS_MAP:
            continue

        canonical, score = best_canonical_match(alias_norm, canon_list)
        if not canonical or score < threshold:
            continue

        prev = suggestions.get(alias_norm)
        if not prev or score > prev.score:
            suggestions[alias_norm] = Suggestion(
                alias=alias_norm, canonical=canonical, score=score, example_raw=raw
            )

    return suggestions


def main() -> None:
    ap = argparse.ArgumentParser(description="Suggest constituency alias mappings.")
    ap.add_argument("--region", default=REGION_NAME)
    ap.add_argument("--constituencies-table", default=CONSTITUENCIES_TABLE)
    ap.add_argument("--candidates-table", default=CANDIDATES_TABLE)
    ap.add_argument(
        "--raw-names-file",
        help="Text file with one raw constituency string per line (preferred input).",
    )
    ap.add_argument(
        "--scan-candidates",
        action="store_true",
        help="Scan knowyourmla_candidates.profile_url and scrape pages to extract raw constituency strings.",
    )
    ap.add_argument("--max-pages", type=int, default=200, help="Max candidate pages to scan.")
    ap.add_argument("--concurrency", type=int, default=10, help="Concurrent fetches when scanning pages.")
    ap.add_argument("--threshold", type=float, default=0.90, help="Fuzzy match threshold (0-1).")
    ap.add_argument(
        "--include-known",
        action="store_true",
        help="Include aliases already present in CONSTITUENCY_ALIAS_MAP.",
    )
    ap.add_argument(
        "--output",
        default="suggested_constituency_aliases.json",
        help="Output JSON file path.",
    )
    args = ap.parse_args()

    dynamodb = boto3.resource("dynamodb", region_name=args.region)

    canon_list = scan_constituency_canonicals(dynamodb, table_name=args.constituencies_table)
    if not canon_list:
        raise SystemExit("No canonicals found in knowyourmla_constituencies (SK=METADATA).")

    raw_names: List[str] = []
    sources: List[str] = []

    if args.raw_names_file:
        raw_names.extend(read_raw_names_file(args.raw_names_file))
        sources.append(f"raw_names_file:{args.raw_names_file}")

    if args.scan_candidates:
        try:
            urls = scan_candidate_profile_urls(
                dynamodb, 
                table_name=args.candidates_table, 
                limit=args.max_pages,
                max_id=5000  # Default max range
            )
        except ClientError as e:
            raise SystemExit(f"Failed scanning candidates table: {e}")
            
        if not urls:
            print("No new candidate pages to scan (all within range exist in DB).")
        else:
            print(f"Scraping {len(urls)} gap pages...")
            sources.append(f"scan_candidates:gap_pages={len(urls)}")
            raw_names.extend(fetch_pages_and_extract_raw_names(urls, concurrency=args.concurrency))
            print(f"Extracted {raw_names} raw names.")
    if not raw_names:
        raise SystemExit(
            "No raw names provided. Use --raw-names-file or --scan-candidates."
        )

    suggestions = suggest_aliases(
        raw_names=raw_names,
        canon_list=canon_list,
        threshold=args.threshold,
        skip_known=not args.include_known,
    )

    payload = {
        "generated_at": int(time.time()),
        "region": args.region,
        "sources": sources,
        "threshold": args.threshold,
        "suggestions": [
            {
                "alias": s.alias,
                "canonical": s.canonical,
                "score": round(s.score, 4),
                "example_raw": s.example_raw,
            }
            for s in sorted(suggestions.values(), key=lambda x: (-x.score, x.alias))
        ],
    }

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(payload['suggestions'])} suggestions to {args.output}")


if __name__ == "__main__":
    main()

