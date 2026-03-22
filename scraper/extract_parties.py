#!/usr/bin/env python3

import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os
import logging
import sys
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timezone

# Add the current directory to sys.path to import utils
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scraper.utils import normalize_name

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "https://www.myneta.info/party/"
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
OUTPUT_FILE = os.path.join(ASSETS_DIR, "political_parties.json")

# DynamoDB Configuration
TABLE_NAME = "knowyourmla_political_parties"
REGION_NAME = "ap-south-2"

def normalize_state(state: str) -> str:
    """Normalize state name to STATE#slug format."""
    if not state:
        return ""
    slug = state.strip().lower().replace(" ", "_")
    return f"STATE#{slug}"

def extract_pincode(address: str) -> str:
    """Extract 6-digit pincode from address."""
    if not address:
        return ""
    # Search for 6 digits at the end or near the end
    match = re.search(r'(\d{6})', address.strip())
    if match:
        return match.group(1)
    return ""

def get_party_details(party_url: str) -> dict:
    """Scrape details for a single party."""
    try:
        response = requests.get(party_url, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Party Name and Short Name
        header = soup.find('h3')
        full_text = header.get_text(strip=True) if header else ""
        
        # Regex to extract "Name (SHORT)"
        name_match = re.match(r'^(.*?)\s*\((.*?)\)$', full_text)
        if name_match:
            name = name_match.group(1).strip()
            short_name = name_match.group(2).strip()
        else:
            name = full_text
            short_name = ""
            
        # Logo
        img = soup.find('img', src=re.compile(r'lib/img/party/'))
        logo_url = ""
        if img:
            logo_src = img.get('src')
            if logo_src.startswith('http'):
                logo_url = logo_src
            else:
                logo_url = f"https://www.myneta.info/party/{logo_src}"
        
        # Type, Registered State, Address
        party_type = ""
        state_registered = ""
        address = ""
        
        for b in soup.find_all('b'):
            label = b.get_text(strip=True).lower()
            value_node = b.next_sibling
            
            # Extract text value carefully
            value = ""
            if value_node:
                if isinstance(value_node, str):
                    value = value_node.strip(': ').strip()
                elif hasattr(value_node, 'get_text'):
                    value = value_node.get_text(strip=True).strip(': ').strip()
            
            if "type" in label:
                party_type = value
            elif "state in which registered" in label:
                state_registered = normalize_state(value)
            elif "address" in label:
                address = value
        
        normalized = normalize_name(name)
        
        return {
            "PK": f"PARTY#{normalized}",
            "SK": "METADATA",
            "name": name,
            "short_name": short_name,
            "normalized_name": normalized,
            "type": party_type,
            "state_registered": state_registered,
            "full_address": address,
            "pincode": extract_pincode(address),
            "logo_url": logo_url,
            "myneta_url": party_url
        }
    except Exception as e:
        logger.error(f"Error scraping {party_url}: {e}")
        return None

def sync_to_dynamodb(parties: list):
    """Sync parties to DynamoDB, checking for existence first."""
    logger.info(f"Syncing {len(parties)} parties to DynamoDB table {TABLE_NAME}...")
    dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
    table = dynamodb.Table(TABLE_NAME)
    
    now_ts = int(datetime.now(tz=timezone.utc).timestamp())
    
    success_count = 0
    skip_count = 0
    
    for party in parties:
        pk = party['PK']
        sk = party['SK']
        
        try:
            # Check if exists
            response = table.get_item(Key={'PK': pk, 'SK': sk})
            if 'Item' in response:
                logger.info(f"Skip: {party['name']} already exists in DynamoDB.")
                skip_count += 1
                continue
            
            # Put item
            item = {
                **party,
                "created_at": now_ts,
                "updated_at": now_ts
            }
            table.put_item(Item=item)
            logger.info(f"Uploaded: {party['name']} to DynamoDB.")
            success_count += 1
        except ClientError as e:
            logger.error(f"DynamoDB Error for {party['name']}: {e.response['Error']['Message']}")
            
    logger.info(f"Sync complete. Uploaded: {success_count}, Skipped: {skip_count}")

def main():
    if not os.path.exists(ASSETS_DIR):
        os.makedirs(ASSETS_DIR)
        
    extracted_parties = []
    
    # Check if we already have the JSON
    if os.path.exists(OUTPUT_FILE):
        logger.info(f"Loading existing party data from {OUTPUT_FILE}")
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            # Verify if it has myneta_url
            if existing_data and 'myneta_url' in existing_data[0]:
                extracted_parties = existing_data
            else:
                logger.info("Existing data is missing 'myneta_url'. Re-scraping...")
    
    if not extracted_parties:
        logger.info(f"Scraping party list from {BASE_URL}")
        try:
            response = requests.get(BASE_URL, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            party_links = []
            for a in soup.find_all('a', class_='w3-button'):
                text = a.get_text(strip=True)
                if "Financials Summary" in text:
                    href = a.get('href')
                    if href:
                        if not href.startswith('http'):
                            if href.startswith('/'):
                                href = f"https://www.myneta.info{href}"
                            else:
                                href = f"https://www.myneta.info/party/{href}"
                        party_links.append(href)
            
            logger.info(f"Found {len(party_links)} party links")
            
            for i, link in enumerate(party_links):
                logger.info(f"[{i+1}/{len(party_links)}] Scraping {link}")
                details = get_party_details(link)
                if details:
                    extracted_parties.append(details)
                time.sleep(0.5) # Slight rate limiting
                
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(extracted_parties, f, indent=4, ensure_ascii=False)
            logger.info(f"Saved {len(extracted_parties)} parties to {OUTPUT_FILE}")
            
        except Exception as e:
            logger.error(f"Main execution error: {e}")
            return

    # Sync to DynamoDB
    if extracted_parties:
        sync_to_dynamodb(extracted_parties)

if __name__ == "__main__":
    main()
