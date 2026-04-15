import json
import os
import re
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
METADATA_FILE = os.path.join(SCRIPT_DIR, "tn_2026_candidates.json")

def normalize(s):
    """Strips 'Party:' and 'Constituency:' prefixes and cleans whitespace."""
    if not s:
        return ""
    # Strip Party/Constituency prefixes case-insensitively
    s = re.sub(r'(Party|Constituency)\s*:\s*', '', s, flags=re.IGNORECASE)
    # Generic cleanup: collapse whitespace and strip
    s = ' '.join(s.split()).strip()
    return s

def get_record_score(record):
    """Calculates a score for a record to determine the best version during deduplication."""
    score = 0
    # Prefer records with files
    if record.get('affidavite_file_location') and os.path.exists(record.get('affidavite_file_location')):
        score += 100
    elif record.get('affidavite_file_location'):
        score += 50
        
    if record.get('photo_path') and os.path.exists(record.get('photo_path')):
        score += 20
    elif record.get('photo_path'):
        score += 10
        
    # Prefer records with successful extraction
    if record.get('extraction_status') == 'success':
        score += 200
    
    # Prefer records with more metadata
    if record.get('age'):
        score += 5
    if record.get('address'):
        score += 5
    if record.get("Father's / Husband's Name"):
        score += 5
        
    return score

def clean_and_deduplicate():
    """Performs the cleanup and deduplication of the JSON metadata file."""
    if not os.path.exists(METADATA_FILE):
        print(f"Error: {METADATA_FILE} not found.")
        return

    try:
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {METADATA_FILE}: {e}")
        return

    initial_count = len(data)
    print(f"Scanning {initial_count} records...")

    # Normalize all records
    for record in data:
        record['party_name'] = normalize(record.get('party_name', ''))
        record['constituency'] = normalize(record.get('constituency', ''))

    # Group by composite key
    grouped = defaultdict(list)
    for record in data:
        name = record.get('name', '').strip().lower()
        # Handle small variations in name if needed, but for now exact name + seats
        key = (
            name,
            record.get('constituency', '').strip().lower(),
            record.get('party_name', '').strip().lower()
        )
        grouped[key].append(record)

    cleaned_data = []
    duplicates_resolved = 0
    
    for key, variants in grouped.items():
        if len(variants) == 1:
            cleaned_data.append(variants[0])
        else:
            # Pick the best record among variants
            best_record = max(variants, key=get_record_score)
            cleaned_data.append(best_record)
            duplicates_resolved += (len(variants) - 1)
            print(f"Merged {len(variants)} records for '{key[0]}' in '{key[1]}'")

    print(f"\nCleanup Summary:")
    print(f"- Initial records: {initial_count}")
    print(f"- Duplicates resolved: {duplicates_resolved}")
    print(f"- Final unique records: {len(cleaned_data)}")

    try:
        # Backup before overwrite
        with open(f"{METADATA_FILE}.bak", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            
        with open(METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(cleaned_data, f, indent=4, ensure_ascii=False)
        print(f"\nSuccessfully updated {METADATA_FILE}")
    except Exception as e:
        print(f"Error saving {METADATA_FILE}: {e}")

if __name__ == "__main__":
    clean_and_deduplicate()
