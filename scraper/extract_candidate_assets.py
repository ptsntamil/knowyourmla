import asyncio
import json
import argparse
import sys
import os
from bs4 import BeautifulSoup

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scraper.fetcher import AsyncFetcher
from scraper.asset_parser import AssetParser
from scraper.config import logger

async def extract_candidate_assets(candidate_id: int):
    """Fetch and parse candidate asset details using the print-friendly version."""
    fetcher = AsyncFetcher()
    # Using the print version which is not obfuscated
    url = f"https://www.myneta.info/tamilnadu2021/candidate.php?candidate_id={candidate_id}&print=true"
    logger.info(f"Fetching: {url}")
    
    try:
        html = await fetcher.fetch(url)
        if not html:
            logger.error(f"Failed to fetch data for candidate {candidate_id}")
            return
            
        parser = AssetParser(html)
        assets = parser.parse_all()
        
        # Format output to match user request
        output = {
            "gold": assets["gold"],
            "vehicle": assets["vehicle"],
            "land": assets["land"]
        }
        
        print(json.dumps(output, indent=2, ensure_ascii=False))
        
    finally:
        await fetcher.close()

def main():
    parser = argparse.ArgumentParser(description="Extract candidate assets from MyNeta.")
    parser.add_argument("--candidate_id", type=int, default=222, help="MyNeta candidate ID")
    args = parser.parse_args()
    
    asyncio.run(extract_candidate_assets(args.candidate_id))

if __name__ == "__main__":
    main()
