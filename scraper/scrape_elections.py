import requests
from bs4 import BeautifulSoup
import boto3
import os
import time
from typing import Set, Tuple

REGION_NAME = os.getenv("AWS_REGION", "ap-south-2")
TABLE_NAME = "knowyourmla_elections"

def get_table():
    """Returns the DynamoDB table resource."""
    dynamodb = boto3.resource("dynamodb", region_name=REGION_NAME)
    return dynamodb.Table(TABLE_NAME)

def save_election(year: str, election_type: str, category: str):
    """Saves an election record to DynamoDB."""
    table = get_table()
    # Normalize values for PK
    pk_type = election_type.upper().replace(" ", "")
    pk_cat = category.upper().replace("-", "").replace(" ", "")
    pk = f"ELECTION#{year}#{pk_type}#{pk_cat}"
    
    item = {
        "PK": pk,
        "SK": "METADATA",
        "year": int(year),
        "type": election_type,
        "category": category,
        "created_at": int(time.time())
    }
    
    try:
        table.put_item(Item=item)
        print(f"Saved: {pk}")
    except Exception as e:
        print(f"Error saving {pk}: {e}")

def scrape_assembly_general():
    """Scrapes general assembly elections from the TN election portal."""
    url = "https://www.elections.tn.gov.in/generalelections_Completed.aspx"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        
        links = soup.find_all("a")
        for link in links:
            text = link.get_text(strip=True)
            if "General Elections to Tamil Nadu Legislative Assembly" in text:
                parts = text.split()
                year_str = parts[-1]
                if year_str.isdigit() and len(year_str) == 4:
                    save_election(year_str, "Assembly", "General")
    except Exception as e:
        print(f"Error scraping assembly general elections: {e}")

def scrape_loksabha_general():
    """Scrapes Lok Sabha general elections from the TN election portal."""
    url = "https://www.elections.tn.gov.in/LokshabaElections.aspx"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        
        links = soup.find_all("a")
        for link in links:
            text = link.get_text(strip=True)
            if "General Elections to Lok Sabha" in text:
                parts = text.split()
                year_str = parts[-1]
                if year_str.isdigit() and len(year_str) == 4:
                    save_election(year_str, "Lok Sabha", "General")
    except Exception as e:
        print(f"Error scraping Lok Sabha general elections: {e}")

def scrape_bye_elections():
    """Scrapes bye-elections from the TN election portal."""
    url = "https://www.elections.tn.gov.in/bye_elections.aspx"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        
        table = soup.find("table")
        if not table:
            print("Bye-election table not found")
            return
            
        rows = table.find_all("tr")[1:] # Skip header
        seen: Set[Tuple[str, str, str]] = set()
        for row in rows:
            cols = row.find_all("td")
            if len(cols) >= 2:
                name = cols[0].get_text(strip=True)
                year = cols[1].get_text(strip=True)
                
                if not year.isdigit() or len(year) != 4:
                    continue
                    
                election_type = "Lok Sabha" if "PC" in name else "Assembly"
                
                key = (year, election_type, "Bye-Election")
                if key not in seen:
                    save_election(year, election_type, "Bye-Election")
                    seen.add(key)
    except Exception as e:
        print(f"Error scraping bye-elections: {e}")

if __name__ == "__main__":
    print("Scraping Assembly General Elections...")
    scrape_assembly_general()
    print("\nScraping Lok Sabha General Elections...")
    scrape_loksabha_general()
    print("\nScraping Bye-Elections...")
    scrape_bye_elections()
