import os
import re
import json
import time
import argparse
import requests
from google import genai
from google.genai import types
from json_repair import repair_json

# Configuration
BASE_URL = "https://www.elections.tn.gov.in/Form20_TNLA2026.aspx"
ASSETS_DIR = "/Users/ideas2it/Projects/personal/knowyourmla/scraper/assets/2026/ac/polling"
PDF_DIR = os.path.join(ASSETS_DIR, "pdf")
PROMPT_FILE = "/Users/ideas2it/Projects/personal/knowyourmla/scraper/assets/polling_extraction_prompt.txt"

def get_all_api_keys():
    """Retrieves all available Gemini API keys from environment variables or .env.local."""
    keys = [os.environ.get("GOOGLE_GEMINI_API_KEY")]
    return keys

def get_pdf_link(ac_id):
    """Finds the PDF link for a given constituency ID from the TN Elections website."""
    print(f"[*] Fetching Form 20 page to find link for AC {ac_id}...")
    response = requests.get(BASE_URL, timeout=30)
    response.raise_for_status()
    ac_pattern = f"AC{int(ac_id):03d}.pdf"
    
    match = re.search(fr'https?://www.elections.tn.gov.in/Form20_TNLA2026/dt\d+/{ac_pattern}', response.text)
    if not match:
        match = re.search(fr'/Form20_TNLA2026/dt\d+/{ac_pattern}', response.text)
        if match: return "https://www.elections.tn.gov.in" + match.group(0)
        match = re.search(fr'href="([^"]*?{ac_pattern})"', response.text)
        if match:
            link = match.group(1)
            if not link.startswith("http"):
                link = "https://www.elections.tn.gov.in" + (link if link.startswith("/") else "/" + link)
            return link
        raise ValueError(f"Could not find PDF link for constituency {ac_id}")
    return match.group(0)

def download_pdf(url, ac_id):
    """Downloads the PDF and returns the local path."""
    os.makedirs(PDF_DIR, exist_ok=True)
    dest_path = os.path.join(PDF_DIR, f"AC{int(ac_id):03d}.pdf")
    print(f"[*] Downloading PDF from {url} to {dest_path}...")
    response = requests.get(url, stream=True, timeout=60)
    response.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print("[+] Download complete.")
    return dest_path

def _init_gemini_chat(api_keys, key_index, pdf_path):
    """Initializes Gemini client and chat session."""
    if key_index >= len(api_keys): return None, None, None
    try:
        client = genai.Client(api_key=api_keys[key_index])
        print(f"[*] Using API key index {key_index}...")
        file_upload = client.files.upload(file=pdf_path)
        while file_upload.state == "PROCESSING":
            time.sleep(2)
            file_upload = client.files.get(name=file_upload.name)
        return client, file_upload, client.chats.create(model="gemini-3.1-flash-lite")
    except Exception as e:
        print(f"[!] Init error: {e}"); return None, None, None

def _parse_json_response(text):
    """Cleans and parses JSON."""
    try:
        raw = re.sub(r'^```json\s*|\s*```$', '', text.strip(), flags=re.MULTILINE)
        return json.loads(repair_json(raw))
    except Exception: return {}

def is_data_valid(data):
    """Checks if the postal or summary data is actually present (not just a null skeleton)."""
    if not data or not isinstance(data, dict): return False
    # If it doesn't have 'v', it's definitely the wrong format
    if "v" not in data: return False
    
    # Check if 'v' contains actual numbers
    v_data = data["v"]
    if not isinstance(v_data, dict): return False
    if any(val is not None for val in v_data.values()): return True
    
    # Also check top level fields like valid, nota, total
    for k in ["valid", "nota", "total", "total_votes_polled"]:
        if data.get(k) is not None: return True
        
    return False

def _update_stations(stations_data, all_stations, current_state):
    """Updates the stations list from extracted chunk data."""
    new_found = 0
    for s in stations_data:
        if not isinstance(s, dict): continue
        if "ps" in s:
            if not any(existing["ps"] == s["ps"] for existing in all_stations):
                all_stations.append(s)
                new_found += 1
        elif "postal" in s or ("nota" in s and "rejected" in s):
            if is_data_valid(s): current_state["postal_data"] = s
        elif "party_votes" in s or "polling_station_summary" in s:
            if is_data_valid(s): current_state["summary_data"] = s
    return new_found

def _update_extracted_data(data, all_stations, candidates_dict, meta_dict, current_state):
    """Updates metadata, candidates, and stations from chunk data."""
    if not candidates_dict and "candidates" in data:
        candidates_dict.update(data["candidates"])
    if not meta_dict and "meta" in data:
        meta_dict.update(data["meta"])
    
    new_found = _update_stations(data.get("stations", []), all_stations, current_state)
    
    if "postal" in data and is_data_valid(data["postal"]):
        current_state["postal_data"] = data["postal"]
    if "polling_station_summary" in data and is_data_valid(data["polling_station_summary"]):
        current_state["summary_data"] = data["polling_station_summary"]
        
    return new_found

def _determine_next_range(data, start_ps, end_ps, candidates, new_found, consecutive_empty):
    """Calculates the next range to extract."""
    next_range = data.get("next_range")
    if next_range and isinstance(next_range, dict) and next_range.get("start", 0) > start_ps:
        ce = consecutive_empty + 1 if new_found == 0 else 0
        if ce >= 2:
            print("[!] Stopping: 2 consecutive empty ranges."); return None, None, ce
        return next_range["start"], next_range["end"], ce
        
    if new_found > 0:
        ns = end_ps + 1
        chunk = 30 if len(candidates) > 30 else (50 if len(candidates) > 20 else 75)
        return ns, ns + chunk - 1, 0
    return None, None, consecutive_empty

def _run_recovery_prompt(chat, file_upload, prompt):
    """Sends a recovery prompt to Gemini."""
    try:
        response = chat.send_message(
            message=[file_upload, prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return _parse_json_response(response.text)
    except Exception as e:
        print(f"[!] Recovery error: {e}"); return {}

def _perform_dedicated_recovery(chat, file_upload, state, candidates, max_retries):
    """Attempts to recover missing postal/summary data."""
    print("[*] Missing data recovery...")
    cand_str = "\n".join([f"{k}: {v}" for k, v in candidates.items()])
    
    for _ in range(max_retries):
        has_p = is_data_valid(state["postal_data"])
        has_s = is_data_valid(state["summary_data"])
        
        prompt = f"""Go to the end of the Form-20 PDF. Extract 'Postal Votes' and 'Polling Station Summary'.
Candidate ID mapping:
{cand_str}

Return EXACTLY this JSON structure:
{{
  "postal": {{
    "v": {{ "1": <votes>, "2": <votes>, ... }},
    "nota": <nota>,
    "rejected": <rejected>,
    "valid": <total_valid>,
    "total": <grand_total>
  }},
  "polling_station_summary": {{
    "v": {{ "1": <votes>, "2": <votes>, ... }},
    "valid": <total_valid>,
    "rej": <rejected>,
    "nota": <nota>,
    "total": <grand_total>,
    "tendered": <tendered>
  }}
}}
"""
        data = _run_recovery_prompt(chat, file_upload, prompt)
        if not has_p:
            cand_data = data.get("postal")
            if is_data_valid(cand_data): state["postal_data"] = cand_data
        if not has_s:
            cand_data = data.get("polling_station_summary")
            if is_data_valid(cand_data): state["summary_data"] = cand_data
            
        if is_data_valid(state["postal_data"]) and is_data_valid(state["summary_data"]): 
            print("[+] Recovery successful with correct pattern.")
            break
        time.sleep(2)

def _try_extract_chunk(chat, file_upload, prompt, api_keys, key_index):
    """Attempts a single Gemini extraction chunk with error handling."""
    try:
        resp = chat.send_message(message=[file_upload, prompt], 
                               config=types.GenerateContentConfig(response_mime_type="application/json"))
        return _parse_json_response(resp.text), False
    except Exception as e:
        msg = str(e)
        if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
            print(f"[!] Key {key_index} exhausted."); return None, True
        print(f"[!] Error: {e}"); return None, False

def extract_polling_data(pdf_path, ac_id):
    """Main extraction loop."""
    keys = get_all_api_keys()
    if not keys: raise ValueError("No keys.")
    
    start, end, all_st, cand, meta, ce = 1, 75, [], {}, {}, 0
    state = {"postal_data": None, "summary_data": None}
    
    out_path = os.path.join(ASSETS_DIR, f"{int(ac_id):03d}.json")
    if os.path.exists(out_path):
        print(f"[*] Found existing data for AC {ac_id}. Resuming...")
        try:
            with open(out_path, "r") as f:
                existing = json.load(f)
                all_st = existing.get("stations", [])
                cand = existing.get("candidates", {})
                meta = existing.get("meta", {})
                state["postal_data"] = existing.get("postal")
                state["summary_data"] = existing.get("polling_station_summary")
                if all_st:
                    max_ps = max(int(s["ps"]) for s in all_st if "ps" in s)
                    start = max_ps + 1
                    chunk = 30 if len(cand) > 30 else (50 if len(cand) > 20 else 75)
                    end = start + chunk - 1
                    print(f"[*] Resuming from station {start}...")
        except Exception as e: print(f"[!] Resume error: {e}")

    with open(PROMPT_FILE, "r") as f: pt = f.read()
    
    ki, client, file_up, chat, tried_spec, stop = 0, None, None, None, False, False
    while not stop:
        if not client:
            client, file_up, chat = _init_gemini_chat(keys, ki, pdf_path)
            if not client: break
        
        ctx = {"START_PS": start, "END_PS": end, "start_ps": start, "end_ps": end}
        prompt = pt.replace("{{START_PS}}", str(start)).replace("{{END_PS}}", str(end))
        prompt = re.sub(r'\{\{(.*?)\}\}', lambda m: str(eval(m.group(1), {}, ctx)), prompt)
        print(f"[*] Extracting stations {start} to {end}...")

        data, key_exhausted = _try_extract_chunk(chat, file_up, prompt, keys, ki)
        if key_exhausted:
            ki += 1; client = None; continue
        if not data: break

        new = _update_extracted_data(data, all_st, cand, meta, state)
        ns, ne, ce = _determine_next_range(data, start, end, cand, new, ce)
        
        if ns: start, end = ns, ne
        elif is_data_valid(state["postal_data"]) and is_data_valid(state["summary_data"]): stop = True
        elif not tried_spec:
            print("[*] Requesting postal/summary specifically..."); tried_spec = True
        else: stop = True
        if start > 1000: break

    if (not is_data_valid(state["postal_data"]) or not is_data_valid(state["summary_data"])) and client:
        _perform_dedicated_recovery(chat, file_up, state, cand, 3)
    
    res = {"meta": meta, "candidates": cand, "stations": all_st, "postal": state["postal_data"], 
           "polling_station_summary": state["summary_data"], "validation": {"actual_station_count": len(all_st)}}
    with open(out_path, "w") as f: json.dump(res, f, indent=2)
    print(f"[+] Saved to {out_path}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("ac_id")
    args = parser.parse_args()
    try:
        path = download_pdf(get_pdf_link(args.ac_id), args.ac_id)
        extract_polling_data(path, args.ac_id)
    except Exception as e: print(f"[ERROR] {e}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="/Users/ideas2it/Projects/personal/knowyourmla/scraper/.env.local")
    main()
