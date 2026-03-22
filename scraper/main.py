import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import json
import pandas as pd
import argparse
from typing import List, Dict
from scraper.config import logger, BASE_URL, STATE_SLUGS, DATA_DIR
from scraper.fetcher import AsyncFetcher
from scraper.parser import MynetaParser
from scraper.models import CandidateData
from bs4 import BeautifulSoup

class MynetaScraper:
    def __init__(self):
        self.fetcher = AsyncFetcher()
        self.parser = MynetaParser()
        self.all_data = []

    async def detect_election_years(self) -> List[str]:
        """Detect available Tamil Nadu election years from the homepage."""
        html = await self.fetcher.fetch(BASE_URL)
        if not html:
            return ["TamilNadu2021", "tamilnadu2016", "tamilnadu2011", "tn2006"] # Fallback

        soup = BeautifulSoup(html, "lxml")
        years = []
        links = soup.find_all("a", href=True)
        for link in links:
            href = link["href"].strip("/")
            if any(slug in href for slug in STATE_SLUGS) and any(char.isdigit() for char in href):
                if href not in years and "Test" not in href:
                    years.append(href)
        
        logger.info(f"Detected election years: {years}")
        return years if years else ["TamilNadu2021", "tamilnadu2016", "tamilnadu2011", "tn2006"]

    async def scrape_year(self, year_slug: str, limit: int = None):
        """Scrape all candidates for a specific election year."""
        year_url = f"{BASE_URL}/{year_slug}/index.php?action=show_winners&sort=default"
        html = await self.fetcher.fetch(year_url)
        if not html:
            return

        candidate_stubs = self.parser.get_winner_links(html, year_slug)
        logger.info(f"Found {len(candidate_stubs)} winner stubs for {year_slug}")
        
        if limit:
            candidate_stubs = candidate_stubs[:limit]

        # Determine election type (Simplified: default is Assembly, unless 'loksabha' in slug)
        election_type = "Lok Sabha" if "loksabha" in year_slug.lower() or "ls" in year_slug.lower() else "Assembly"
        details_context = {"election_type": election_type}

        year_results = []
        for stub in candidate_stubs:
            c_html = await self.fetcher.fetch(stub["url"])
            if c_html:
                details = self.parser.parse_candidate_details(c_html, stub["url"], year_slug, details=details_context)
                if details:
                    try:
                        validated_data = CandidateData(**details)
                        year_results.append(validated_data.model_dump())
                    except Exception as e:
                        logger.error(f"Validation error for {stub['name']}: {e}")

        # Save year-specific CSV
        if year_results:
            df = pd.DataFrame(year_results)
            csv_path = DATA_DIR / f"{year_slug}_candidates.csv"
            df.to_csv(csv_path, index=False)
            logger.info(f"Saved {len(year_results)} candidates to {csv_path}")
            self.all_data.extend(year_results)

    async def run(self, years: List[str] = None, limit_per_year: int = None):
        """Main entry point for the scraper."""
        if not years:
            years = await self.detect_election_years()

        for year in years:
            logger.info(f"Starting scrape for {year}")
            await self.scrape_year(year, limit=limit_per_year)

        # Save combined JSON
        if self.all_data:
            json_path = DATA_DIR / "combined_candidates.json"
            with open(json_path, "w") as f:
                json.dump(self.all_data, f, default=str, indent=4)
            logger.info(f"Saved all data to {json_path}")

    def compute_bonus_metrics(self):
        """Compute bonus metrics from scraped data."""
        if not self.all_data:
            logger.warning("No data available to compute metrics.")
            return

        df = pd.DataFrame(self.all_data)
        metrics = {
            "average_vote_percentage": df["vote_percentage"].mean(),
            "highest_margin": df["winning_margin"].max(),
            "total_candidates": len(df),
            "party_distribution": df["party"].value_counts().to_dict()
        }
        # Note: Win % and Asset Growth require multi-year/result parsing which we'll refine
        logger.info(f"Bonus Metrics: {metrics}")
        return metrics

async def main():
    parser = argparse.ArgumentParser(description="Myneta Tamil Nadu Scraper")
    parser.add_argument("--years", nargs="+", help="Specific election years to scrape")
    parser.add_argument("--limit", type=int, help="Limit candidates per year for testing")
    args = parser.parse_args()

    scraper = MynetaScraper()
    try:
        await scraper.run(years=args.years, limit_per_year=args.limit)
        scraper.compute_bonus_metrics()
    finally:
        await scraper.fetcher.close()

if __name__ == "__main__":
    asyncio.run(main())
