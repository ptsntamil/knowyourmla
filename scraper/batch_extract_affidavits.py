import os
import json
import time
import argparse
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv
from extract_affidavit_pdf import AffidavitExtractor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("batch_extraction.log"),
        logging.StreamHandler()
    ]
)
# Suppress noisy HTTP request logs from the genai SDK dependencies
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

def save_json_atomic(data: List[Dict[str, Any]], file_path: str):
    """Saves JSON to a temporary file then renames it to ensure atomicity."""
    temp_path = f"{file_path}.tmp"
    with open(temp_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    os.replace(temp_path, file_path)

def batch_process(limit: int = None, input_file: str = "tn_2026_candidates.json"):
    """Processes candidates from the JSON file and extracts affidavit details."""
    load_dotenv(dotenv_path=".env.local")
    #ptsn - AIzaSyAWyaQlLwajtuyZIHJwQQ78HYfLJHpoq5s
    #ptsn1 - AIzaSyDhDmtVkNG0O6nHdC9y8XpZOwAX_2lEI4A
    #krishnaa - AIzaSyCUP-kQRftEP_B9ZKj19HwH6l54mbBHH-U
    #krishnakani - AIzaSyA0vGkr-O73AQsJRt9f6u-S8LNwrWLF8bw
    #adhi101 - AIzaSyDeVY7LZD7ksT3hCYaMpQwSgmOPISwZblE
    # api_key = os.environ.get("GOOGLE_GEMINI_API_KEY", "AIzaSyBEVH77dAIyxjjNRXwpIAFFscpuqvV5_qU")
    api_key = "AIzaSyDhDmtVkNG0O6nHdC9y8XpZOwAX_2lEI4A"
    if not api_key:
        logger.error("GOOGLE_GEMINI_API_KEY not found in .env.local ")
        return

    if not os.path.exists(input_file):
        logger.error(f"Input file {input_file} not found.")
        return

    # Load candidates
    with open(input_file, 'r', encoding='utf-8') as f:
        candidates = json.load(f)

    extractor = AffidavitExtractor(api_key)
    processed_count = 0
    
    logger.info(f"Starting batch process. Total candidates in file: {len(candidates)}")

    for i, candidate in enumerate(candidates):
        if limit is not None and processed_count >= limit:
            logger.info(f"Limit of {limit} reached. Stopping.")
            break

        # Resumption logic: Skip if already has extraction results
        if candidate.get("extraction_status") == "success" or "extracted_data" in candidate:
            continue

        name = candidate.get("name", "Unknown")
        constituency = candidate.get("constituency", "Unknown")
        pdf_path = candidate.get("affidavite_file_location")

        if not pdf_path or not os.path.exists(pdf_path):
            logger.warning(f"Skipping {name} ({constituency}): PDF not found at {pdf_path}")
            candidate["extraction_status"] = "failed_missing_pdf"
            continue

        logger.info(f"[{processed_count+1}/{limit if limit else 'All'}] Extracting data for {name} ({constituency})...")
        
        try:
            # Extract data
            extracted_data = extractor.run(pdf_path, candidate_info=candidate)
            
            # Store extracted data in a separate key to avoid polluting candidate metadata
            candidate["extracted_data"] = extracted_data
            candidate["extraction_status"] = "success"
            candidate["extracted_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            
            processed_count += 1
            
            # Periodic save to prevent data loss
            if processed_count % 5 == 0:
                save_json_atomic(candidates, input_file)
                logger.info(f"Saved progress after {processed_count} extractions.")

        except Exception as e:
            err_msg = str(e)
            logger.error(f"Failed to process {name}: {err_msg}")
            candidate["extraction_status"] = "failed"
            candidate["extraction_error"] = err_msg
            
            # Detect quota exhaustion or high demand and stop
            if any(msg in err_msg for msg in ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE"]):
                logger.warning(f"Stopping batch process due to API limitations ({err_msg}). Progress saved.")
                break
            # We don't increment processed_count here so we can try others
            
        # Small delay to respect rate limits if not using a high-tier key
        time.sleep(2)

    # Final save
    save_json_atomic(candidates, input_file)
    logger.info(f"Batch processing finished. Total new extractions: {processed_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch extract candidate data from affidavits.")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of candidates to process")
    parser.add_argument("--file", type=str, default="tn_2026_candidates.json", help="Path to candidates JSON file")
    
    args = parser.parse_args()
    batch_process(limit=args.limit, input_file=args.file)
