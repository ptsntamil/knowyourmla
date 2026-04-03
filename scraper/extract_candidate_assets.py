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

async def extract_candidate_assets(candidate_id: int, year: int = 2021, update_db: bool = False, dry_run: bool = False, skip_existing: bool = False):
    """Fetch and parse candidate asset details using the print-friendly version.

    Args:
        candidate_id: MyNeta candidate ID.
        year: Election year (default: 2021).
        update_db: Whether to update DynamoDB with extracted assets.
        dry_run: If True, only log the update without writing to DynamoDB.
        skip_existing: If True, skip extraction if assets already exist in DB.
    """
    if skip_existing and update_db:
        from scraper.update_candidate_assets_db import AssetDBUpdater
        updater = AssetDBUpdater()
        pk = f"AFFIDAVIT#{year}#{candidate_id}"
        try:
            resp = updater.table.get_item(Key={"PK": pk, "SK": "DETAILS"}, ProjectionExpression="gold_assets, vehicle_assets, land_assets")
            item = resp.get("Item", {})
            if item.get("gold_assets") and item.get("vehicle_assets") and item.get("land_assets"):
                logger.info(f"Skipping candidate {candidate_id} ({year}) as assets already exist.")
                return
        except Exception as e:
            logger.warning(f"Error checking existing assets for candidate {candidate_id}: {e}")

    fetcher = AsyncFetcher()
    
    # Determine the year slug for the URL
    if year == 2021:
        year_slug = "tamilnadu2021"
    elif year == 2016:
        year_slug = "tamilnadu2016"
    elif year == 2011:
        year_slug = "tamilnadu2011"
    elif year == 2006:
        year_slug = "tn2006"
    else:
        year_slug = f"tamilnadu{year}"

    # Using the print version which is not obfuscated
    url = f"https://www.myneta.info/{year_slug}/candidate.php?candidate_id={candidate_id}&print=true"
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
            "silver": assets["silver"],
            "vehicle": assets["vehicle"],
            "land": assets["land"]
        }
        
        # Only print for single candidate, avoid flooding for batch
        if not update_db or not getattr(asyncio.current_task(), 'is_batch_run', False):
            print(json.dumps(output, indent=2, ensure_ascii=False))
        
        # Update DynamoDB if requested
        if update_db:
            from scraper.update_candidate_assets_db import AssetDBUpdater
            updater = AssetDBUpdater()
            success = updater.update_assets(candidate_id, year, output, dry_run=dry_run)
            if success:
                logger.info(f"DynamoDB update successful for candidate {candidate_id} ({year})")
            else:
                logger.error(f"DynamoDB update failed for candidate {candidate_id} ({year})")
        
    finally:
        await fetcher.close()

async def process_batch(year: int, update_db: bool, dry_run: bool, limit: Optional[int] = None, skip_existing: bool = False, start_from: Optional[int] = None):
    """Process all candidates for a given year by listing them from the database.

    Args:
        year: Election year to process.
        update_db: Whether to update the database for each candidate.
        dry_run: Whether to perform a dry run for database updates.
        limit: Optional limit on the number of candidates to process.
        skip_existing: Whether to skip candidates who already have asset data.
        start_from: MyNeta candidate ID to start from.
    """
    from scraper.update_candidate_assets_db import AssetDBUpdater
    updater = AssetDBUpdater()
    
    candidate_ids = updater.list_candidates_by_year(year, skip_existing=skip_existing)
    if not candidate_ids:
        logger.warning(f"No candidates found for year {year} in database (or all skipped).")
        return
        
    # Sort IDs to make start_from meaningful
    candidate_ids.sort()
    
    if start_from:
        logger.info(f"Filtering candidates to start from ID: {start_from}")
        candidate_ids = [cid for cid in candidate_ids if cid >= start_from]
        
    if limit:
        logger.info(f"Limiting batch processing to first {limit} candidates.")
        candidate_ids = candidate_ids[:limit]
        
    logger.info(f"Starting batch process for {len(candidate_ids)} candidates in {year}")
    
    # Mark task as batch run to suppress output flooding
    asyncio.current_task().is_batch_run = True
    
    for i, cid in enumerate(candidate_ids):
        logger.info(f"Processing {i+1}/{len(candidate_ids)}: Candidate {cid}")
        await extract_candidate_assets(cid, year=year, update_db=update_db, dry_run=dry_run)
        # Add a small delay to be polite to the server
        await asyncio.sleep(1)

def main():
    parser = argparse.ArgumentParser(description="Extract candidate assets from MyNeta.")
    parser.add_argument("--candidate_id", type=int, help="MyNeta candidate ID")
    parser.add_argument("--year", type=int, default=2021, help="Election year (e.g., 2021, 2016)")
    parser.add_argument("--all", action="store_true", help="Update all candidates for the specified year from the database")
    parser.add_argument("--start_from", type=int, help="MyNeta candidate ID to start processing from (for batch update)")
    parser.add_argument("--limit", type=int, help="Limit number of candidates for batch update")
    parser.add_argument("--skip_existing", action="store_true", help="Skip candidates who already have asset data in the database")
    parser.add_argument("--update_db", action="store_true", help="Update DynamoDB with extracted assets")
    parser.add_argument("--dry_run", action="store_true", help="Perform a dry run for DynamoDB update (no actual write)")
    args = parser.parse_args()
    
    if args.all:
        asyncio.run(process_batch(args.year, args.update_db, args.dry_run, args.limit, args.skip_existing, args.start_from))
    elif args.candidate_id:
        asyncio.run(extract_candidate_assets(args.candidate_id, year=args.year, update_db=args.update_db, dry_run=args.dry_run, skip_existing=args.skip_existing))
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
