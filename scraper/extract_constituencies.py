#!/usr/bin/env python3

import re
import sys
from datetime import datetime, timezone
from typing import List, Dict
from urllib.parse import urljoin, parse_qs, urlparse

import boto3
import httpx
from bs4 import BeautifulSoup
from utils import normalize_name

BASE_URL = "https://www.myneta.info/TamilNadu2021/"
CONSTITUENCIES_TABLE = "knowyourmla_constituencies"
REGION_NAME = "ap-south-2"


def fetch_html(url: str) -> str:
    resp = httpx.get(url, timeout=30)
    resp.raise_for_status()
    return resp.text


def extract_constituencies(html: str) -> List[Dict[str, str]]:
    soup = BeautifulSoup(html, "html.parser")

    results: List[Dict[str, str]] = []

    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "action=show_candidates" not in href:
            continue
        if "constituency_id=" not in href:
            continue

        parsed = urlparse(href)
        qs = parse_qs(parsed.query)
        cid_list = qs.get("constituency_id")
        if not cid_list:
            m = re.search(r"constituency_id=(\d+)", href)
            if not m:
                continue
            constituency_id = m.group(1)
        else:
            constituency_id = cid_list[0]

        constituency_name = a.get_text(strip=True)
        # Skip bye-election entries like "ERODE EAST : BYE ELECTION ON ..."
        if "BYE ELECTION" in constituency_name.upper():
            continue

        # Derive reservation type from name suffix
        upper_name = constituency_name.upper()
        if "(SC)" in upper_name:
            ctype = "SC"
        elif "(ST)" in upper_name:
            ctype = "ST"
        else:
            ctype = "GEN"

        # Remove reservation suffix from display name, e.g. "CHEYYUR (SC)" -> "CHEYYUR"
        clean_name = re.sub(r"\s*\((SC|ST)\)\s*$", "", constituency_name, flags=re.I).strip()

        district_button = a.find_previous("button", class_="dropbtnJS")
        if district_button:
            district = district_button.get_text(strip=True)
        else:
            district = "UNKNOWN"

        full_url = urljoin(BASE_URL, href)

        results.append(
            {
                # Raw scraped fields
                "district": district,
                "name": clean_name,
                "normalized_name": normalize_name(clean_name),
                "id": constituency_id,
                "url": full_url,
                "type": ctype,
            }
        )

    return results


def write_to_dynamodb(items: List[Dict[str, str]]) -> None:
    """Upsert constituency records into the knowyourmla_constituencies table."""
    dynamodb = boto3.resource("dynamodb", region_name=REGION_NAME)
    table = dynamodb.Table(CONSTITUENCIES_TABLE)

    now_ts = int(datetime.now(tz=timezone.utc).timestamp())

    with table.batch_writer(overwrite_by_pkeys=["PK", "SK"]) as batch:
        for item in items:
            normalized_name = item["normalized_name"]
            pk = f"CONSTITUENCY#{normalized_name}"

            db_item = {
                "PK": pk,
                "SK": "METADATA",
                "name": item["name"],
                "normalized_name": normalized_name,
                "district_id": f"DISTRICT#{normalize_name(item['district'])}",
                "type": item["type"],
                "id": item["id"],
                "source_url": item["url"],
                "created_at": now_ts,
            }

            batch.put_item(Item=db_item)


def main() -> None:
    url = BASE_URL
    if len(sys.argv) > 1:
        url = sys.argv[1]

    html = fetch_html(url)
    data = extract_constituencies(html)

    # Write into DynamoDB table knowyourmla_constituencies
    write_to_dynamodb(data)

    # Also print a short summary to stdout
    print(f"Upserted {len(data)} constituencies into {CONSTITUENCIES_TABLE}.")


if __name__ == "__main__":
    main()

