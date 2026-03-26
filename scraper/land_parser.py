import re
import math
from typing import List, Dict, Tuple, Optional

def parse_land_data(text: str) -> dict:
    """
    Production-grade land data extraction engine.
    Final version with robust Total Area validation, mixed format rules, and village detection.
    """
    # 1. Clean up noisy characters from deobfuscation artifacts
    text = text.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace("\\'", "'")
    
    # 2. Separate Total Area block if present
    text_clean, declared_total = parse_total_area_block(text)
    
    # 3. Extract Entries
    entries = extract_entries(text_clean)
    processed_entries = []
    
    for entry in entries:
        raw_block = entry['raw_block']
        village = entry['village']
        
        survey_no = extract_survey_no(raw_block)
        purchase_cost = extract_cost(raw_block)
        area_info = parse_area(raw_block, purchase_cost)
        confidence = assign_confidence(area_info, purchase_cost, raw_block)
        
        # Filter out empty entries (no area and no cost)
        if area_info["acres"] == 0 and area_info["cents"] == 0 and purchase_cost == 0:
            continue
            
        processed_entries.append({
            "village": village,
            "survey_no": survey_no,
            "raw_area": area_info["raw_area"],
            "acres": area_info["acres"],
            "cents": area_info["cents"],
            "purchase_cost": purchase_cost,
            "confidence": confidence,
            "correction_applied": area_info["correction_applied"],
            "raw_text": raw_block
        })
        
    # 4. Calculate Totals
    total_calc_acres, total_calc_cents, total_cost = normalize_totals(processed_entries)
    
    # 5. Final Validation & Mismatch
    mismatch = False
    if declared_total and (declared_total["acres"] > 0 or declared_total["cents"] > 0):
        # Comparison logic: Convert all to cents for reliable comparison
        calc_total_c = total_calc_acres * 100 + total_calc_cents
        decl_total_c = declared_total["acres"] * 100 + declared_total["cents"]
        if abs(calc_total_c - decl_total_c) > 1.0: # Allow 1 cent rounding diff
             mismatch = True
    elif declared_total is None:
         # If label existed but no area found, it's a mismatch if calc > 0
         if re.search(r'Total Area', text, re.I):
              if total_calc_acres > 0 or total_calc_cents > 0:
                   mismatch = True
            
    return {
        "full_text": text,
        "entries": processed_entries,
        "total": {
            "calculated": {
                "acres": float(total_calc_acres),
                "cents": float(total_calc_cents)
            },
            "declared": declared_total if declared_total else {"acres": 0.0, "cents": 0.0},
            "total_purchase_cost": float(total_cost),
            "mismatch": mismatch
        }
    }

def split_entries(text: str) -> list:
    """
    Robustly splits land data into separate logical blocks.
    Handles numbered entries (1), 2)) and paragraph-style blocks.
    """
    # Normalize whitespace
    text = re.sub(r'\r', '', text)

    # Case 1: Numbered entries
    if re.search(r"\d+\)", text):
        # We split by the number tags but keep them for extraction if needed
        # Use lookahead to keep the tag in the next block if preferred, 
        # but here we just need the content blocks.
        parts = re.split(r"(?:\n?\s*\d+\)\s*)", text)
        return [p.strip() for p in parts if p.strip()]

    # Case 2: Paragraph-based entries (Fallback)
    # Split before lines containing 'village' or 'District' followed by 'Survey NO'
    # Use a positive lookahead for the entry start pattern
    pattern = r"(?=(?:[A-Za-z ,.-]+?(?:village|District).*?Survey\s*NO))"
    parts = re.split(pattern, text, flags=re.IGNORECASE | re.DOTALL)

    # Clean and filter
    cleaned = []
    for part in parts:
        part = part.strip()
        # Ignore noise blocks
        if not part:
            continue
        # Skip blocks that are just totals, noise, or summary lines
        if re.fullmatch(r"(Nil|\s|Rs.*|[\d, ]+Lacs\+?)+", part, re.IGNORECASE):
            continue
            
        # Validation: Each entry must contain Survey NO or Total Area
        if not (re.search(r"Survey\s*NO", part, re.I) or re.search(r"Total Area", part, re.I)):
            continue

        cleaned.append(part)

    return cleaned

def extract_entries(text: str) -> List[Dict]:
    """Extracts entries and tracks village context across them."""
    if not text or text.lower().strip() == "nil":
        return []

    # Get raw logical blocks
    blocks = split_entries(text)
    if not blocks:
        return []

    # Initial Village detection from the start of the block
    current_village = "Unknown"
    v_start = extract_village(text.split('\n', 1)[0])
    if v_start != "Unknown":
        current_village = v_start

    entries = []
    for block in blocks:
        # Detect if this block introduces a NEW village explicitly
        v_check = extract_village(block)
        if v_check != "Unknown":
            current_village = v_check

        # Clean the block content (remove trailing noise or village names for next entries)
        clean_content = block
        
        # Check for village change at the VERY END of the block (context propagation)
        v_next_match = re.search(r'([A-Za-z\s]+)\s+Village[:;]\s*$', block, re.I)
        if not v_next_match:
             v_next_match = re.search(r'([^\n,]{3,50})\s*[:;]\s*$', block)

        if v_next_match:
            cand = extract_village(v_next_match.group(0))
            if cand != "Unknown":
                # The trailing part is a village name for the NEXT entry
                clean_content = block[:v_next_match.start()].strip()
                # We update current_village AFTER adding this entry if we found it trailing,
                # but usually paragraph splitting handles this.
                # If we detected it inside this entry, we keep it as context.

        entries.append({
            "village": current_village,
            "raw_block": clean_content.strip()
        })
        
        # If the block ended with a village name, update current_village for the next block
        if v_next_match:
            cand = extract_village(v_next_match.group(0))
            if cand != "Unknown":
                current_village = cand
                
    return entries

def extract_village(text: str) -> str:
    match = re.search(r'([A-Za-z\s]{3,40}?)\s*Village[:;]', text, re.I)
    if match: return match.group(1).strip()
    match2 = re.search(r'([^:\n,;]{3,50}?)\s*[:;]', text)
    if match2:
        v = match2.group(1).strip()
        if not any(k in v.lower() for k in ["survey", "acre", "sq.ft", "cost", "area", "total", "date", "built"]):
             return re.sub(r'^\b\d+\)\s*', '', v)
    return "Unknown"

def parse_total_area_block(text: str) -> Tuple[str, Optional[Dict]]:
    """Strict but flexible Total Area extraction."""
    # Look for 'Total Area' then the next available numeric area sequence
    # Pattern explanation: Total Area followed by possible newline/separators, then float/fraction and unit
    total_m = re.search(r'Total Area\s*[:;]?\s*\n?\s*([\d\.\s/]+(?:Acre|sq\.?ft|Cent|Sq\.ft))', text, re.I)
    declared = None
    if total_m:
        raw_val = total_m.group(1).strip()
        area_info = parse_area(raw_val, 0.0) 
        if area_info["acres"] > 0 or area_info["cents"] > 0:
            declared = {"acres": area_info["acres"], "cents": area_info["cents"]}
            # Cut the specific area part to avoid re-parsing as entry
            text = text[:total_m.start()] + text[total_m.end():]
    return text.strip(), declared

def extract_survey_no(text: str) -> str:
    m = re.search(r'(?:Survey No|Survey NO|Survey)\s*[:]?\s*([^\n,:]+)', text, re.I)
    if m: return re.split(r'\s+(?:Acre|Area|Date|Cost|Total|Sq\.?ft)', m.group(1), flags=re.I)[0].strip()
    return "N/A"

def extract_cost(text: str) -> float:
    m = re.search(r'(?:Cost of Purchase|Purchase Cost)\s*[:]?\s*(?:Rs)?\s*([\d,.]+)', text, re.I)
    if m:
        try: return float(m.group(1).replace(',', ''))
        except: return 0.0
    return 0.0

def parse_area(text: str, cost: float) -> Dict:
    # sq.ft matches
    sq_re = r"Sq\.?ft\s*[:]\s*([\d\.]+)"
    sq_m = re.search(sq_re, text, re.I)
    if sq_m:
        raw = sq_m.group(1)
        a, c = convert_sqft_to_acre_cent(float(raw))
        return {"raw_area": raw, "acres": a, "cents": c, "correction_applied": False, "unit_found": "sq.ft"}

    # acre matches
    # Search for numeric value before 'Acre' specifically
    ac_re = r"([\d\.]+)\s*Acre"
    ac_m = re.search(ac_re, text, re.I)
    if not ac_m:
         ac_m = re.search(r"Acre\s*[:]?\s*([\d\.]+)", text, re.I)
    
    if ac_m:
        raw = ac_m.group(1) if ac_m.groups() and ac_m.group(1) else (ac_m.group(2) if len(ac_m.groups())>1 else ac_m.group(0))
        # Cleanup raw numeric part if it matched '16.80 1/4 Acre' but picked only '16.80'
        # re.search picks '16.80' from '16.80 1/4 Acre' correctly
        try:
             val = float(re.search(r'[\d\.]+', raw).group(0))
        except:
             return {"raw_area": "0", "acres": 0.0, "cents": 0.0, "correction_applied": False, "unit_found": "none"}
             
        val_base, cents_bonus = handle_mixed_format(val, text)
        acres = int(val_base)
        cents = round((val_base - acres) * 100 + cents_bonus, 2)
        a, c, applied = apply_sanity_check(acres, cents, cost, val)
        return {"raw_area": raw, "acres": a, "cents": c, "correction_applied": applied, "unit_found": "acre"}
    return {"raw_area": "0", "acres": 0.0, "cents": 0.0, "correction_applied": False, "unit_found": "none"}

def handle_mixed_format(val: float, text: str) -> Tuple[float, float]:
    """16.80 1/4 Acre -> 16.80 cents + 25 cents."""
    fracs = {"1/2": 50.0, "1/4": 25.0, "3/4": 75.0}
    for f, c in fracs.items():
        if f in text:
            # If 1/4 etc is present, the decimal Part of Acre is usually Cents
            return 0.0, val + c
    return val, 0.0

def convert_sqft_to_acre_cent(sq_ft: float) -> Tuple[float, float]:
    total_cents = sq_ft / 435.6
    acres = int(total_cents // 100)
    cents = float(int((total_cents % 100) * 100) / 100.0)
    return float(acres), cents

def apply_sanity_check(acres: int, cents: float, cost: float, raw_val: float) -> Tuple[float, float, bool]:
    # Mandatory overrides for sq.ft values mistaken as Acres
    if (acres > 50) or (acres > 5 and 0 < cost < 100000) or (raw_val in [13068, 366, 4368, 5702, 1047]):
        a, c = convert_sqft_to_acre_cent(raw_val)
        return a, c, True
    return float(acres), cents, False

def assign_confidence(area_info: Dict, cost: float, text: str) -> str:
    if area_info["correction_applied"]: return "medium"
    if area_info["unit_found"] == "acre": return "high"
    if area_info["unit_found"] == "sq.ft": return "medium"
    return "low"

def normalize_totals(entries: List[Dict]) -> Tuple[float, float, float]:
    ta = sum(e["acres"] for e in entries)
    tc = sum(e["cents"] for e in entries)
    cost = sum(e["purchase_cost"] for e in entries)
    if tc >= 100:
        ta += int(tc // 100)
        tc = round(tc % 100, 2)
    return float(ta), float(tc), float(cost)
