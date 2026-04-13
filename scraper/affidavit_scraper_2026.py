import os
import re
import json
import time
import argparse
import logging
import random
import shutil
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# Constants
BASE_URL = "https://affidavit.eci.gov.in"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(SCRIPT_DIR, "assets/2026/affidavits")
PHOTOS_DIR = os.path.join(SCRIPT_DIR, "assets/2026/photos")
METADATA_FILE = os.path.join(SCRIPT_DIR, "tn_2026_candidates.json")
USER_DATA_DIR = os.path.join(tempfile.gettempdir(), "eci_playwright_profile")
file_lock = threading.Lock()

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("affidavit_download.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def sanitize_filename(name):
    """Sanitizes strings for safe filesystem usage."""
    return re.sub(r'[\\/*?:"<>|]', "", name).replace(" ", "_").strip("_")

def normalize_value(val):
    """Strips Party/Constituency prefixes and cleans whitespace."""
    if not val: return "Unknown"
    val = re.sub(r'(Party|Constituency)\s*:\s*', '', val, flags=re.IGNORECASE)
    return ' '.join(val.split()).strip()

def get_composite_key(cand):
    """Generates a consistent normalized composite key for a candidate."""
    name = cand.get('name', '').strip().lower()
    const = normalize_value(cand.get('constituency', '')).lower()
    party = normalize_value(cand.get('party_name', '')).lower()
    return f"{name}|{const}|{party}"

def init_browser(p, headless=True, proxy=None):
    """Initializes a new browser instance with preferences to force PDF downloads."""
    profile_dir = f"{USER_DATA_DIR}_{random.randint(1000, 9999)}"
    if os.path.exists(profile_dir):
        shutil.rmtree(profile_dir, ignore_errors=True)
        
    # Pre-configure preferences to force PDF downloads
    pref_dir = os.path.join(profile_dir, "Default")
    os.makedirs(pref_dir, exist_ok=True)
    try:
        with open(os.path.join(pref_dir, "Preferences"), "w") as f:
            json.dump({
                "plugins": {"always_open_pdf_externally": True},
                "download": {"prompt_for_download": False, "open_pdf_in_system_reader": False}
            }, f)
    except Exception as e:
        logger.warning(f"Failed to pre-set browser preferences: {e}")

    launch_args = [
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--window-size=1920,1080",
        "--no-sandbox",
        "--disable-dev-shm-usage",
    ]

    context = p.chromium.launch_persistent_context(
        user_data_dir=profile_dir,
        headless=headless,
        args=launch_args,
        proxy=proxy if proxy else None,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        viewport={"width": 1920, "height": 1080},
        ignore_default_args=["--enable-automation"],
        accept_downloads=True
    )
    
    page = context.pages[0] if context.pages else context.new_page()
    stealth = Stealth()
    stealth.apply_stealth_sync(page)
    
    page.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
        Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
    """)
    
    return context, page, profile_dir

def select_filters(page):
    """Navigates to the portal and applies filters with human-like timing."""
    logger.info("Opening ECI Affidavit Portal...")
    page.goto(BASE_URL, wait_until="load", timeout=90000)

    # Check for immediate Access Denied
    body_text = (page.query_selector("body").inner_text() if page.query_selector("body") else "")
    if "Access Denied" in page.title() or "Access Denied" in body_text:
        logger.error("!!! DETECTED BY WAF (Access Denied) !!!")
        raise Exception("Blocked by WAF (Access Denied)")

    time.sleep(random.uniform(3, 5))

    logger.info("Selecting Election Name...")
    page.wait_for_selector("select#electionType", timeout=30000)
    
    election_options = page.query_selector_all("select#electionType option")
    target_election = None
    for opt in election_options:
        if "2026" in opt.inner_text():
            target_election = opt.inner_text().strip()
            break
            
    if target_election:
        page.select_option("select#electionType", label=target_election)
    else:
        page.select_option("select#electionType", label="Assembly GEN-BYE-Election-MAR-MAY-2026")
    
    time.sleep(2)
    
    logger.info("Waiting for Election Type dropdown...")
    page.wait_for_function("() => document.querySelectorAll('select#election option').length > 1", timeout=15000)
    page.select_option("select#election", label="AC - GENERAL")
    time.sleep(1)

    logger.info("Selecting State...")
    page.wait_for_function("() => document.querySelectorAll('select#states option').length > 1", timeout=15000)
    
    state_options = page.query_selector_all("select#states option")
    target_state = None
    for opt in state_options:
        if "Tamil Nadu" in opt.inner_text():
            target_state = opt.inner_text().strip()
            break
            
    if target_state:
        page.select_option("select#states", label=target_state)
    else:
        page.select_option("select#states", label="Tamil Nadu")
    
    time.sleep(random.uniform(2, 4))
    
    logger.info("Applying basic filters...")
    filter_btn = page.wait_for_selector("button.search.btn-primary")
    filter_btn.click()
    page.wait_for_load_state("domcontentloaded")
    
    time.sleep(random.uniform(3, 5))
    
    logger.info("Filtering for 'Contesting' candidates...")
    contesting_box = page.wait_for_selector("button:has-text('Contesting')", timeout=20000)
    contesting_box.click()
    page.wait_for_load_state("domcontentloaded")
    
    time.sleep(random.uniform(3, 5))

def extract_candidates_from_page(page):
    """Extracts candidate metadata from the current cards list."""
    candidates = []
    cards = page.query_selector_all("div.card-body table tbody tr")
    logger.info(f"Found {len(cards)} candidates on this page.")
    
    for card in cards:
        try:
            name_el = card.query_selector("div.details-name h4")
            party_el = card.query_selector("div.left-party p:nth-of-type(1)")
            const_el = card.query_selector("div.right-party p:nth-of-type(2)")
            profile_link_el = card.query_selector("div.right-party a:has-text('View more')")
            
            if name_el and profile_link_el:
                name = name_el.inner_text().strip()
                party = normalize_value(party_el.inner_text()) if party_el else "Unknown"
                constituency = normalize_value(const_el.inner_text()) if const_el else "Unknown"
                profile_url = urljoin(BASE_URL, profile_link_el.get_attribute("href"))
                
                candidates.append({
                    "name": name,
                    "party_name": party,
                    "constituency": constituency,
                    "profile_url": profile_url
                })
        except Exception as e:
            logger.warning(f"Error parsing candidate card: {e}")
    return candidates

def download_candidate_pdf(candidate, headless=True, proxy=None):
    """Enriches candidate data, downloads the affidavit and profile picture."""
    with sync_playwright() as p:
        context = None
        temp_dir = None
        try:
            context, page, temp_dir = init_browser(p, headless=headless, proxy=proxy)
            page.goto(candidate['profile_url'], wait_until="load", timeout=45000)
            time.sleep(random.uniform(2, 4))
            
            # Metadata extraction
            try:
                candidate["Father's / Husband's Name"] = page.inner_text("div.detail-person .form-group:nth-of-type(1) div").strip()
                candidate["address"] = page.inner_text("div.detail-person .form-group:nth-of-type(5) div").strip()
                candidate["sex"] = page.inner_text("div.detail-person .form-group:nth-of-type(6) div").strip()
                candidate["age"] = page.inner_text("div.detail-person .form-group:nth-of-type(7) div").strip()
            except Exception as e:
                logger.warning(f"Metadata extraction failed for {candidate['name']}: {e}")

            # Profile Picture Extraction
            try:
                # Use user-suggested selector div.imagePreview img
                photo_el = page.query_selector("div.imagePreview img")
                logger.info(f"Photo element found: {photo_el is not None}")
                if photo_el:
                    photo_src = photo_el.get_attribute("src")
                    if photo_src:
                        photo_url = urljoin(BASE_URL, photo_src)
                        photo_filename = f"{sanitize_filename(candidate['constituency'])}_{sanitize_filename(candidate['name'])}.jpg"
                        photo_path = os.path.join(PHOTOS_DIR, photo_filename)
                        
                        response = page.request.get(photo_url)
                        if response.status == 200:
                            with open(photo_path, "wb") as f:
                                f.write(response.body())
                            candidate["photo_path"] = f"assets/2026/photos/{photo_filename}"
                            logger.info(f"[📷] Photo saved: {photo_filename}")
            except Exception as e:
                logger.warning(f"Photo download failed for {candidate['name']}: {e}")

            # Affidavit Download
            download_btn = page.wait_for_selector("div.aside-af div.info.info-wrap:last-of-type a", timeout=15000)
            if download_btn:
                logger.info(f"[↓] Downloading: {candidate['name']}")
                
                download = None
                popup_page = None
                
                try:
                    # Combined approach: listen for both download and popup events
                    with page.context.expect_page(timeout=10000) as page_info: # New tab/popup
                        with page.expect_download(timeout=10000) as download_info: # Direct download
                            download_btn.click()
                    
                    # If we got here, it means one of the events triggered. 
                    # Playwright events are tricky to wait for in parallel like this if they don't both happen.
                    # We'll check which one we got.
                    download = download_info.value
                except Exception:
                    # If direct download didn't trigger, check for popup
                    try:
                        popup_page = page_info.value
                    except Exception:
                        pass

                # Case 1: Standard Download Event
                if download:
                    original_filename = download.suggested_filename
                    unique_name = f"{sanitize_filename(candidate['constituency'])}_{sanitize_filename(candidate['name'])}_{original_filename}"
                    local_path = os.path.join(ASSETS_DIR, unique_name)
                    download.save_as(local_path)
                    candidate["affidavite_file_location"] = f"assets/2026/affidavits/{unique_name}"
                    logger.info(f"[✔] Saved (Direct): {unique_name}")
                
                # Case 2: Opened in New Tab
                elif popup_page:
                    popup_page.wait_for_load_state("load")
                    pdf_url = popup_page.url
                    logger.info(f"PDF opened in new tab: {pdf_url}")
                    
                    response = page.request.get(pdf_url)
                    if response.status == 200:
                        filename = f"{sanitize_filename(candidate['constituency'])}_{sanitize_filename(candidate['name'])}_Affidavit.pdf"
                        local_path = os.path.join(ASSETS_DIR, filename)
                        with open(local_path, "wb") as f:
                            f.write(response.body())
                        candidate["affidavite_file_location"] = f"assets/2026/affidavits/{filename}"
                        logger.info(f"[✔] Saved (Popup): {filename}")
                    popup_page.close()
                else:
                    logger.error(f"Failed to capture download or popup for {candidate['name']}")
            else:
                logger.warning(f"Affidavit download button not found for {candidate['name']}")

            return candidate
        except Exception as e:
            logger.error(f"[!] Error processing {candidate['name']}: {e}")
            return candidate
        finally:
            if context: context.close()
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)

def main():
    parser = argparse.ArgumentParser(description="ECI Affidavit Scraper 2026")
    parser.add_argument("--mode", type=str, default="full", choices=["full", "crawl", "enrich"], help="Scraping mode (full, crawl, enrich)")
    parser.add_argument("--headless", type=str, default="True", help="Run browser in headless mode (True/False)")
    parser.add_argument("--max-workers", type=int, default=5, help="Number of concurrent downloaders")
    parser.add_argument("--limit", type=int, default=None, help="Maximum candidates to process")
    parser.add_argument("--start-page", type=int, default=1, help="Page number to start crawling from")
    parser.add_argument("--proxy", type=str, default=None, help="Proxy URL")
    args = parser.parse_args()

    headless_bool = args.headless.lower() == "true"
    proxy_dict = {"server": args.proxy} if args.proxy else None

    # Load existing metadata for deduplication
    processed_results = []
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                processed_results = json.load(f)
            logger.info(f"Loaded {len(processed_results)} existing candidates from {METADATA_FILE}")
        except Exception as e:
            logger.error(f"Error loading existing metadata: {e}")

    existing_keys = {get_composite_key(c) for c in processed_results if 'name' in c}

    os.makedirs(ASSETS_DIR, exist_ok=True)
    os.makedirs(PHOTOS_DIR, exist_ok=True)
    
    # 1. Crawl Phase
    all_candidates = []
    if args.mode in ["full", "crawl"]:
        logger.info("Starting Crawl Phase...")
        with sync_playwright() as p:
            context = None
            temp_main_dir = None
            try:
                context, page, temp_main_dir = init_browser(p, headless=headless_bool, proxy=proxy_dict)
                
                page_num = args.start_page
                if page_num > 1:
                    # Hardcoded URL as requested for jumping
                    jump_url = f"https://affidavit.eci.gov.in/CandidateCustomFilter?electionType=32-AC-GENERAL-3-60&election=32-AC-GENERAL-3-60&states=S22&phase=2&submitName=100&page={page_num}"
                    logger.info(f"Jumping directly to page {page_num}: {jump_url}")
                    page.goto(jump_url, wait_until="load", timeout=60000)
                    time.sleep(random.uniform(3, 5))
                else:
                    select_filters(page)

                while True:
                    logger.info(f"Scraping results page {page_num}...")
                    current_candidates = extract_candidates_from_page(page)
                    if not current_candidates: break
                    
                    new_on_page = 0
                    for cand in current_candidates:
                        key = get_composite_key(cand)
                        if key not in existing_keys:
                            all_candidates.append(cand)
                            existing_keys.add(key)
                            new_on_page += 1
                    
                    if new_on_page > 0:
                        logger.info(f"-> Page {page_num}: Found {new_on_page} new candidates.")
                    else:
                        logger.info(f"-> Page {page_num}: 0 new (skipped {len(current_candidates)} existing).")
                    
                    if args.limit and len(all_candidates) >= args.limit:
                        logger.info(f"Reached discovery limit of {args.limit} new candidates.")
                        all_candidates = all_candidates[:args.limit]
                        break
                    
                    next_btn = page.query_selector('nav[aria-label="Pagination Navigation"] a:last-child')
                    if next_btn and next_btn.is_visible():
                        logger.info("Advancing to next page...")
                        try:
                            next_btn.scroll_into_view_if_needed()
                            time.sleep(random.uniform(2, 4))
                            next_btn.click()
                            # Increased timeout and switched to 'load' for more resilience
                            page.wait_for_load_state("load", timeout=60000)
                            time.sleep(random.uniform(4, 6))
                            page_num += 1
                        except Exception as e:
                            logger.warning(f"Timeout or error advancing to page {page_num + 1}: {e}")
                            # Final attempt to recover via page parameter
                            page_num += 1
                            recovery_url = f"https://affidavit.eci.gov.in/CandidateCustomFilter?electionType=32-AC-GENERAL-3-60&election=32-AC-GENERAL-3-60&states=S22&phase=2&submitName=100&page={page_num}"
                            logger.info(f"Attempting recovery by navigating to: {recovery_url}")
                            page.goto(recovery_url, wait_until="load", timeout=60000)
                    else: break
            except Exception as e:
                logger.error(f"Critical error during crawl: {e}")
                if args.mode == "full": raise
            finally:
                if context: context.close()
                if temp_main_dir and os.path.exists(temp_main_dir):
                    shutil.rmtree(temp_main_dir, ignore_errors=True)
        
        # Immediate save for crawl results
        if all_candidates:
            logger.info(f"Saving {len(all_candidates)} newly discovered candidates...")
            with file_lock:
                processed_results.extend(all_candidates)
                try:
                    with open(METADATA_FILE, "w", encoding="utf-8") as f:
                        json.dump(processed_results, f, indent=4, ensure_ascii=False)
                except Exception as e:
                    logger.error(f"Error saving basic metadata: {e}")
        else:
            logger.info("No new candidates discovered in this run.")

    # 2. Enrich Phase
    if args.mode in ["full", "enrich"]:
        logger.info("Starting Enrich Phase...")
        
        candidates_to_enrich = []
        if args.mode == "full":
            # In full mode, only enrich candidates found in the current run
            candidates_to_enrich = all_candidates
        else:
            # In enrich mode, pick existing entries missing affidavits
            candidates_to_enrich = [c for c in processed_results if not c.get("affidavite_file_location")]
            if args.limit:
                candidates_to_enrich = candidates_to_enrich[:args.limit]
        
        if not candidates_to_enrich:
            logger.info("No candidates identified for enrichment in this run.")
        else:
            logger.info(f"Processing {len(candidates_to_enrich)} candidates for enrichment.")
            
            with ThreadPoolExecutor(max_workers=args.max_workers) as executor:
                def process_with_retry(cand):
                    res = None
                    for i in range(2):
                        res = download_candidate_pdf(cand, headless=headless_bool, proxy=proxy_dict)
                        if res.get("affidavite_file_location"): 
                            break
                        time.sleep(random.uniform(5, 10))
                    
                    # Incremental save with thread safety
                    if res:
                        with file_lock:
                            try:
                                with open(METADATA_FILE, "w", encoding="utf-8") as f:
                                    json.dump(processed_results, f, indent=4, ensure_ascii=False)
                            except Exception as e:
                                logger.error(f"Error saving updated metadata: {e}")
                    return res

                list(executor.map(process_with_retry, candidates_to_enrich))
    
    logger.info(f"Scraping complete in mode '{args.mode}'. Total candidates in database: {len(processed_results)}")

if __name__ == "__main__":
    main()
