#!/usr/bin/env python3

import os
import sys
import json
import re
import httpx
import boto3
from bs4 import BeautifulSoup
from typing import List, Dict
from datetime import datetime, timezone

# Add the current directory to sys.path to import utils
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scraper.utils import normalize_name

BASE_URL = "https://www.myneta.info/TamilNadu2021/"
STATE_ID = "STATE#tamilnadu"
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "assets", "districts.json")
DISTRICTS_TABLE = "knowyourmla_districts"
REGION_NAME = "ap-south-2"

def fetch_html(url: str) -> str:
    print(f"Fetching {url}...")
    resp = httpx.get(url, timeout=30)
    resp.raise_for_status()
    return resp.text

def extract_districts(html: str) -> List[Dict[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    districts = []
    seen_names = set()

    # The user provided example shows districts are in <button> elements
    # with class "dropbtnJS" and text in uppercase.
    buttons = soup.find_all("button", class_="dropbtnJS")
    
    for btn in buttons:
        name_text = btn.get_text(strip=True)
        # Filter out noise like "ALL CONSTITUENCIES" if it appears in a button
        if not name_text or name_text.upper() == "ALL CONSTITUENCIES":
            continue
            
        normalized = normalize_name(name_text)
        if normalized in seen_names:
            continue
            
        # Extract ID from onclick="handle_dropdown('item', '3')"
        onclick = btn.get("onclick", "")
        match = re.search(r"'item',\s*'(\d+)'", onclick)
        district_id = match.group(1) if match else "UNKNOWN"
        
        seen_names.add(normalized)
        districts.append({
            "PK": f"DISTRICT#{normalized}",
            "SK": "METADATA",
            "id": district_id,
            "name": name_text,
            "normalized_name": normalized,
            "alias": [], 
            "state_id": STATE_ID
        })
        print(f"Extracted: {name_text} (ID: {district_id}) -> {normalized}")

    return districts

def write_to_dynamodb(items: List[Dict[str, str]]) -> None:
    """Upsert district records into the knowyourmla_districts table."""
    print(f"\nWriting {len(items)} items to DynamoDB table {DISTRICTS_TABLE}...")
    dynamodb = boto3.resource("dynamodb", region_name=REGION_NAME)
    table = dynamodb.Table(DISTRICTS_TABLE)

    now_ts = int(datetime.now(tz=timezone.utc).timestamp())

    with table.batch_writer(overwrite_by_pkeys=["PK", "SK"]) as batch:
        for item in items:
            db_item = {
                **item,
                "created_at": now_ts,
            }
            batch.put_item(Item=db_item)
    print("DynamoDB upload complete.")

def main():
    try:
        html = fetch_html(BASE_URL)
        districts = extract_districts(html)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(districts, f, indent=2)
            
        print(f"\nSuccessfully extracted {len(districts)} districts.")
        print(f"Local results saved to {OUTPUT_FILE}")
        
        # Write into DynamoDB
        write_to_dynamodb(districts)
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
