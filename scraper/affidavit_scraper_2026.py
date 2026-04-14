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
CHECKPOINT_FILE = os.path.join(SCRIPT_DIR, "crawl_checkpoint.json")
USER_DATA_DIR = os.path.join(tempfile.gettempdir(), "eci_playwright_profile")
file_lock = threading.Lock()
checkpoint_lock = threading.Lock()

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
        "--disable-dev-shm-usage"
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

# Function modifies candidate dict in-place to preserve existing fields like person_id
def download_candidate_pdf(page, candidate, skip_pdf=False):
    """Enriches candidate data, downloads the affidavit and profile picture using an existing page."""
    try:
        # 1. Navigate to Profile
        page.goto(candidate['profile_url'], wait_until="load", timeout=45000)
        time.sleep(random.uniform(2, 4))
        
        # 2. Dynamic Metadata extraction (Preserves person_id by modifying in-place)
        try:
            groups = page.query_selector_all("div.detail-person .form-group")
            for group in groups:
                label_el = group.query_selector("label")
                value_el = group.query_selector("div")
                if label_el and value_el:
                    label = label_el.inner_text().strip().replace(":", "").strip()
                    if not label:
                        continue
                        
                    value = value_el.inner_text().strip()
                    
                    # Prevent duplicate 'name' keys and clean up labels
                    clean_label = label
                    if clean_label.lower() == "name":
                        if "name" not in candidate:
                            candidate["name"] = value
                        continue
                    
                    candidate[clean_label] = value
            logger.info(f"Extracted metadata fields for {candidate.get('name')}")
        except Exception as e:
            logger.warning(f"Metadata extraction failed for {candidate.get('name', 'Unknown')}: {e}")

        # 3. Profile Picture Extraction
        try:
            # Support both class and ID selectors for maximum compatibility
            photo_el = page.query_selector("div#imagePreview img") or page.query_selector("div.imagePreview img")
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

        # 4. Affidavit Download (Native Download Handler)
        if not skip_pdf:
            download_btn = page.query_selector("a:has-text('Affidavit')") or page.query_selector("div.aside-af a")
            
            if download_btn:
                logger.info(f"[↓] Downloading: {candidate['name']}")
                
                try:
                    # Use Playwright's native download listener
                    with page.expect_download(timeout=60000) as download_info:
                        # Multi-method click to ensure trigger
                        try:
                            page.evaluate("el => el.click()", download_btn)
                        except:
                            download_btn.click(force=True, timeout=10000)
                    
                    download = download_info.value
                    original_filename = download.suggested_filename
                    unique_name = f"{sanitize_filename(candidate['constituency'])}_{sanitize_filename(candidate['name'])}_{original_filename}"
                    local_path = os.path.join(ASSETS_DIR, unique_name)
                    
                    # Native save_as (Handles moving from temp dir)
                    download.save_as(local_path)
                    candidate["affidavite_file_location"] = f"assets/2026/affidavits/{unique_name}"
                    logger.info(f"[✔] Downloaded: {unique_name}")
                    
                except Exception as e:
                    logger.error(f"Failed to capture download for {candidate['name']} after 60s: {e}")
            else:
                logger.warning(f"Affidavit download button not found for {candidate['name']}")
        else:
            logger.info(f"Skipping affidavit download for {candidate['name']} as requested.")

        return candidate
    except Exception as e:
        logger.error(f"[!] Error processing {candidate['name']}: {e}")
        return candidate

def main():
    parser = argparse.ArgumentParser(description="ECI Affidavit Scraper 2026")
    parser.add_argument("--mode", type=str, default="full", choices=["full", "crawl", "enrich"], help="Scraping mode (full, crawl, enrich)")
    parser.add_argument("--headless", type=str, default="True", help="Run browser in headless mode (True/False)")
    parser.add_argument("--max-workers", type=int, default=5, help="Number of concurrent downloaders")
    parser.add_argument("--limit", type=int, default=None, help="Maximum candidates to process")
    parser.add_argument("--start-page", type=int, default=1, help="Page number to start crawling from")
    parser.add_argument("--proxy", type=str, default=None, help="Proxy URL")
    parser.add_argument("--skip-file-download", action="store_true", help="Skip affidavit PDF download")
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
                
                # Check for checkpoint if starting from default page 1
                if page_num == 1 and args.mode in ["full", "crawl"]:
                    if os.path.exists(CHECKPOINT_FILE):
                        try:
                            with open(CHECKPOINT_FILE, "r") as f:
                                checkpoint = json.load(f)
                                page_num = checkpoint.get("last_page", 1)
                                logger.info(f"Resuming crawl from checkpoint: page {page_num}")
                        except Exception as e:
                            logger.warning(f"Failed to read checkpoint: {e}")

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
                    
                    # Save checkpoint after each page
                    with checkpoint_lock:
                        try:
                            with open(CHECKPOINT_FILE, "w") as f:
                                json.dump({"last_page": page_num}, f)
                        except Exception as e:
                            logger.warning(f"Failed to save checkpoint: {e}")
                            
                    if not next_btn or not next_btn.is_visible():
                        break
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
        
        # Determine candidates that need processing (missing affidavit or missing photo)
        candidates_to_enrich = []
        if args.mode == "full":
            candidates_to_enrich = [c for c in all_candidates if not c.get("photo_path") or not c.get("affidavite_file_location")]
        else:
            candidates_to_enrich = [c for c in processed_results if not c.get("photo_path")]
            
        if args.limit:
            candidates_to_enrich = candidates_to_enrich[:args.limit]
        
        if not candidates_to_enrich:
            logger.info("No candidates identified for enrichment in this run.")
        else:
            logger.info(f"Processing {len(candidates_to_enrich)} candidates for enrichment using {args.max_workers} threads.")
            
            def enrich_worker(candidate):
                """Worker function for threading."""
                with sync_playwright() as p:
                    context = None
                    temp_dir = None
                    try:
                        context, page, temp_dir = init_browser(p, headless=headless_bool, proxy=proxy_dict)
                        
                        logger.info(f"--- Processing {candidate.get('name', 'Unknown')} ---")
                        success = False
                        for attempt in range(2):
                            try:
                                res = download_candidate_pdf(page, candidate, skip_pdf=args.skip_file_download)
                                if (args.skip_file_download or candidate.get("affidavite_file_location")) and candidate.get("photo_path"):
                                    success = True
                                    break
                            except Exception as e:
                                logger.error(f"Attempt {attempt + 1} failed for {candidate.get('name', 'Unknown')}: {e}")
                                time.sleep(random.uniform(2, 5))
                        
                        # Incremental save after each candidate (Thread-safe)
                        with file_lock:
                            try:
                                # Reload and update to avoid overwriting other threads' progress if multiple files were used
                                # But here we are updating the objects in the shared processed_results list
                                with open(METADATA_FILE, "w", encoding="utf-8") as f:
                                    json.dump(processed_results, f, indent=4, ensure_ascii=False)
                            except Exception as e:
                                logger.error(f"Error saving updated metadata: {e}")
                                
                        if not success:
                            logger.warning(f"Failed to fully enrich {candidate.get('name', 'Unknown')} after 2 attempts.")
                            
                    except Exception as e:
                        logger.error(f"Critical error in worker for {candidate.get('name', 'Unknown')}: {e}")
                    finally:
                        if context: context.close()
                        if temp_dir and os.path.exists(temp_dir):
                            shutil.rmtree(temp_dir, ignore_errors=True)

            with ThreadPoolExecutor(max_workers=args.max_workers) as executor:
                executor.map(enrich_worker, candidates_to_enrich)
    
    logger.info(f"Scraping complete in mode '{args.mode}'. Total candidates in database: {len(processed_results)}")

if __name__ == "__main__":
    main()
