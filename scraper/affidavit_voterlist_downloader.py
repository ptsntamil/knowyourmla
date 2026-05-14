import asyncio
import json
import os
import re
import logging
import random
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright, Page, BrowserContext
from playwright_stealth import Stealth
try:
    from utils import names_are_similar, normalize_name
except ImportError:
    # Fallback if utils not in path
    def normalize_name(name: str) -> str:
        if not name: return ""
        return re.sub(r'[^a-zA-Z0-9]', '', name).lower()
    
    def names_are_similar(name1: str, name2: str) -> bool:
        return normalize_name(name1) == normalize_name(name2)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("voterlist_download.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

BASE_URL = "https://voterlist.co.in/affidavit/"
DOWNLOAD_DIR = "assets/2026/affidavits"
CANDIDATES_JSON = "tn_2026_candidates.json"

async def scroll_to_bottom(page: Page):
    """Scroll to load all lazy-loaded candidates."""
    logger.info("Scrolling to ensure all candidates are loaded...")
    last_height = await page.evaluate("document.body.scrollHeight")
    while True:
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(2) # Wait for potential load
        new_height = await page.evaluate("document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height

async def select_state_and_constituency(page: Page, constituency_name: str):
    """Navigate to the constituency page using the UI flow."""
    await page.goto(BASE_URL, wait_until="networkidle")
    
    # Select Tamil Nadu
    try:
        await page.click("text=Tamil Nadu", timeout=10000)
    except:
        # Fallback if state list is slow
        await page.wait_for_selector("text=Tamil Nadu")
        await page.click("text=Tamil Nadu")
        
    await asyncio.sleep(1) # Wait for animation/load
    
    # Find constituency using filter input
    logger.info(f"Filtering for constituency: {constituency_name}")
    try:
        filter_input = page.locator('input[placeholder="Filter constituencies"]')
        await filter_input.fill(constituency_name)
        await asyncio.sleep(0.5)
        
        # Click the first matching card
        const_card = page.locator(".card-body", has_text=re.compile(rf"^{constituency_name}$", re.I)).first
        if await const_card.is_visible():
            await const_card.click()
        else:
            # If regex match fails, try any card containing the text
            await page.click(f".card-body:has-text('{constituency_name}')")
            
    except Exception as e:
        logger.error(f"Error selecting constituency {constituency_name}: {e}")
        return False
    
    await page.wait_for_load_state("networkidle")
    return True

async def extract_candidates_from_page(page: Page):
    """Extract candidate names and their affidavit links."""
    await scroll_to_bottom(page)
    candidates = []
    
    # Based on exploration: each candidate is in a card
    cards = await page.locator(".card").all()
    for card in cards:
        name_elem = card.locator("h5")
        if not await name_elem.count():
            continue
            
        name = await name_elem.inner_text()
        
        # Find affidavit links
        links = await card.locator("a.ae-browser__link-button--accent").all()
        affidavits = []
        for link in links:
            href = await link.get_attribute("href")
            label = await link.inner_text()
            affidavits.append({"label": label, "url": href})
            
        candidates.append({
            "name": name.strip(),
            "affidavits": affidavits
        })
        
    return candidates

async def download_file(context: BrowserContext, url: str, filename: str):
    """Download the PDF using a popup listener (handling playwright downloads)."""
    full_path = os.path.join(DOWNLOAD_DIR, filename)
    if os.path.exists(full_path):
        logger.info(f"File already exists: {filename}")
        return full_path

    page = await context.new_page()
    try:
        async with page.expect_download() as download_info:
            await page.goto(url)
        download = await download_info.value
        await download.save_as(full_path)
        logger.info(f"Successfully downloaded: {filename}")
        return full_path
    except Exception as e:
        logger.error(f"Failed to download {url}: {e}")
        return None
    finally:
        await page.close()

async def main():
    if not os.path.exists(DOWNLOAD_DIR):
        os.makedirs(DOWNLOAD_DIR)

    # Load candidates
    with open(CANDIDATES_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Group by constituency for efficiency
    by_constituency = {}
    for c in data:
        # Only process those needing download (optional: refine filter)
        if c.get("extraction_status") == "failed_missing_pdf" or not c.get("affidavite_file_location"):
            const = c.get("constituency")
            if const not in by_constituency:
                by_constituency[const] = []
            by_constituency[const].append(c)

    if not by_constituency:
        logger.info("No candidates found needing download.")
        return

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        main_page = await context.new_page()
        stealth = Stealth()
        await stealth.apply_stealth_async(main_page)

        for const_name, json_candidates in list(by_constituency.items())[:1]:
            logger.info(f"Processing constituency: {const_name}")
            
            if not await select_state_and_constituency(main_page, const_name):
                continue
            
            page_candidates = await extract_candidates_from_page(main_page)
            logger.info(f"Found {len(page_candidates)} candidates on page for {const_name}")
            
            for jc in json_candidates:
                match = None
                for pc in page_candidates:
                    if names_are_similar(jc["name"], pc["name"]):
                        match = pc
                        break
                
                if match and match["affidavits"]:
                    # Defaulting to the first affidavit as discussed
                    target_affidavit = match["affidavits"][0]
                    url = target_affidavit["url"]
                    if not url.startswith("http"):
                        url = "https://voterlist.co.in" + url
                    
                    # Sanitize filename
                    safe_name = re.sub(r'[^\w\s-]', '', jc["name"]).strip().replace(' ', '_')
                    filename = f"{const_name}_{safe_name}_Affidavit.pdf"
                    
                    local_path = await download_file(context, url, filename)
                    if local_path:
                        jc["affidavite_file_location"] = os.path.join(DOWNLOAD_DIR, filename)
                        jc["extraction_status"] = "downloaded_voterlist"
                        # Save progress frequently
                        with open(CANDIDATES_JSON, "w", encoding="utf-8") as f:
                            json.dump(data, f, indent=4)
                else:
                    logger.warning(f"No match found for {jc['name']} in {const_name}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
