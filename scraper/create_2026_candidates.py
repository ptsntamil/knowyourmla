#!/usr/bin/env python3

"""
2026 Candidate Ingestion Script
================================

This script creates candidate records for the 2026 Assembly elections in DynamoDB.
It resolves person identities primarily using PAN (Permanent Account Number).

Key Rules:
- Use PAN as a unique identifier for the persons table.
- If no PAN match is found, fallback to name-based resolution.
- Generate sequential candidate PKs: AFFIDAVIT#2026#{index+1}.
- Update status in the source JSON file incrementally.
"""

import json
import os
import sys
import argparse
import logging
import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Dict, Any, Optional

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger("create_2026_candidates")

# Constants
PERSONS_TABLE = "knowyourmla_persons"
CANDIDATES_TABLE = "knowyourmla_candidates"
CONSTITUENCIES_TABLE = "knowyourmla_constituencies"
PARTIES_TABLE = "knowyourmla_political_parties"
REGION_NAME = "ap-south-2"

# Import utils (assuming we are running from project root or added to path)
sys_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if sys_path not in sys.path:
    sys.path.append(sys_path)

from scraper.utils import (
    normalize_name,
    clean_constituency,
    canonicalize_constituency,
    convert_floats_to_decimal,
    clean_currency_to_int
)


def normalize_education(education: Any) -> str:
    """Normalize varied education payloads into a display-safe string."""
    if not education:
        return "Not Specified"
    if isinstance(education, str):
        return education.strip() or "Not Specified"
    if isinstance(education, list):
        for item in education:
            normalized = normalize_education(item)
            if normalized != "Not Specified":
                return normalized
        return "Not Specified"
    if isinstance(education, dict):
        if isinstance(education.get("qualification"), str) and education.get("qualification").strip():
            return education.get("qualification").strip()
        if education.get("self"):
            normalized_self = normalize_education(education.get("self"))
            if normalized_self != "Not Specified":
                return normalized_self
        degree = str(education.get("degree", "")).strip() if education.get("degree") else ""
        institution = str(education.get("institution", "")).strip() if education.get("institution") else ""
        year = str(education.get("year", "")).strip() if education.get("year") else ""
        combined = ", ".join([part for part in [degree, institution, year] if part])
        if combined:
            return combined
    return "Not Specified"


def normalize_profession(profession: Any) -> str:
    """Normalize varied profession payloads into a display-safe string."""
    if not profession:
        return "Not Specified"
    if isinstance(profession, str):
        return profession.strip() or "Not Specified"
    if isinstance(profession, list):
        for item in profession:
            normalized = normalize_profession(item)
            if normalized != "Not Specified":
                return normalized
        return "Not Specified"
    if isinstance(profession, dict):
        if isinstance(profession.get("self"), str) and profession.get("self").strip():
            return profession.get("self").strip()
        if isinstance(profession.get("profession"), str) and profession.get("profession").strip():
            return profession.get("profession").strip()
        for value in profession.values():
            if isinstance(value, str) and value.strip():
                return value.strip()
    return "Not Specified"

class PersonResolver2026:
    def __init__(self, dynamodb_resource):
        self.persons_table = dynamodb_resource.Table(PERSONS_TABLE)
        self.candidates_table = dynamodb_resource.Table(CANDIDATES_TABLE)
        self.constituencies_table = dynamodb_resource.Table(CONSTITUENCIES_TABLE)
        self.parties_table = dynamodb_resource.Table(PARTIES_TABLE)
        
        # Load lookups for efficiency
        self.party_lookup = self._load_lookup(self.parties_table, "parties")

    def _load_lookup(self, table, label):
        logger.info(f"Loading {label} lookup...")
        lookup = {}
        try:
            response = table.scan()
            items = response.get('Items', [])
            while 'LastEvaluatedKey' in response:
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response.get('Items', []))
            
            for item in items:
                pk = item['PK']
                if item.get('normalized_name'): lookup[item['normalized_name']] = pk
                if item.get('name'): lookup[normalize_name(item['name'])] = pk
                for alias in item.get('alias', []):
                    lookup[normalize_name(alias)] = pk
        except Exception as e:
            logger.error(f"Error loading {label}: {e}")
        return lookup

    def resolve_party_id(self, party_name: str) -> str:
        if not party_name: return "PARTY#independent"
        norm = normalize_name(party_name)
        return self.party_lookup.get(norm) or f"PARTY#{norm}"

    def get_pan_from_extracted(self, extracted_data: Dict) -> Optional[str]:
        # 1. Direct pan_number
        pan = extracted_data.get("pan_number")
        if isinstance(pan, dict):
            pan = pan.get("self")
        
        # 2. Fallback to income_itr.pan_number
        if not pan or (isinstance(pan, str) and pan.upper() in ["NIL", "NONE"]):
            income_itr = extracted_data.get("income_itr") or {}
            pan = income_itr.get("pan_number")
            if isinstance(pan, dict):
                pan = pan.get("self")
                
        # 3. Fallback to income_itr.self.pan_number
        if not pan or (isinstance(pan, str) and pan.upper() in ["NIL", "NONE"]):
            income_itr = extracted_data.get("income_itr") or {}
            self_itr = income_itr.get("self") or {}
            if isinstance(self_itr, dict):
                pan = self_itr.get("pan_number")

        return pan if pan and isinstance(pan, str) and pan.upper() not in ["NIL", "NONE"] else None

    def find_person_by_pan(self, pan: str) -> Optional[str]:
        """Lookup person by PAN using GSI Query (high performance)."""
        if not pan: return None
        try:
            response = self.persons_table.query(
                IndexName="PanIndex",
                KeyConditionExpression=Key("pan_number").eq(pan.strip().upper()),
                ProjectionExpression="PK"
            )
            items = response.get("Items", [])
            if items:
                return items[0]["PK"]
        except Exception as e:
            logger.error(f"Error finding person by PAN via Index: {e}")
        return None

    def find_person_by_name_heuristic(self, name: str, last_name: str, age: int, year: int) -> Optional[str]:
        """Fallback name-based resolution similar to enrichment.py."""
        norm_name = normalize_name(name)
        birth_year = year - age
        
        try:
            # Query by NameIndex
            response = self.persons_table.query(
                IndexName="NameIndex",
                KeyConditionExpression=Key("normalized_name").eq(norm_name)
            )
            candidates = response.get("Items", [])
            for p in candidates:
                # Check relation (lastname)
                p_lastname = p.get("lastname", "")
                if normalize_name(p_lastname) == normalize_name(last_name):
                    # Check birth year (+/- 2 years)
                    p_birth_year = p.get("birth_year")
                    if p_birth_year and abs(int(p_birth_year) - birth_year) <= 2:
                        return p["PK"]
        except Exception as e:
            logger.error(f"Error in name-based resolution: {e}")
        return None

    def update_person_metadata(self, person_id: str, pan: str, social_profiles: Dict, voter_update: Dict, dry_run: bool):
        """Update existing person with new metadata from the latest affidavit."""
        if dry_run: return
        try:
            update_expr = "SET createdtime = :ct"
            attr_vals = {":ct": datetime.now(timezone.utc).isoformat()}
            if pan:
                update_expr += ", pan_number = :p"
                attr_vals[":p"] = pan.upper()
            if social_profiles:
                update_expr += ", social_profiles = :sp"
                attr_vals[":sp"] = social_profiles
            
            for k, v in voter_update.items():
                update_expr += f", {k} = :{k}"
                attr_vals[f":{k}"] = v
                
            self.persons_table.update_item(
                Key={"PK": person_id, "SK": "METADATA"},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=attr_vals
            )
        except Exception as e:
            logger.warning(f"Failed to update person {person_id}: {e}")

    def get_or_create_person(self, cand_data: Dict, dry_run: bool = False) -> tuple[str, bool]:
        """Returns (person_id, is_new)."""
        name = cand_data.get("name", "")
        last_name = cand_data.get("Father's / Husband's Name", "")
        age = int(cand_data.get("age", 0))
        extracted = cand_data.get("extracted_data") or {}
        pan = self.get_pan_from_extracted(extracted)

        # 0. Priority: Use existing person_id if already present in JSON (manual or previous run)
        person_id = cand_data.get("person_id") or cand_data.get("db_person_id")
        
        if not person_id:
            # 1. Try PAN lookup
            person_id = self.find_person_by_pan(pan)
            if person_id:
                logger.info(f"Resolved person {person_id} via PAN {pan}")
            else:
                # 2. Try Name fallback
                person_id = self.find_person_by_name_heuristic(name, last_name, age, 2026)
                if person_id:
                    logger.info(f"Resolved person {person_id} via name/relation/age")
        else:
            logger.info(f"Using provided person_id {person_id} for {name}")


        # Prepare social profiles with null-safety
        contact = extracted.get("contact_details") or {}
        social_profiles = {k: v for k, v in {
            "email": contact.get("email"),
            "facebook": contact.get("facebook"),
            "twitter": contact.get("twitter_x"),
            "instagram": contact.get("instagram")
        }.items() if v}

        # Prepare latest voter details with null-safety
        voter = extracted.get("voter_details") or {}
        v_norm = canonicalize_constituency(voter.get("constituency", ""))
        voter_update = {k: v for k, v in {
            "voter_constituency_id": f"CONSTITUENCY#{v_norm}" if v_norm else None,
            "voter_serial_no": str(voter.get("serial_no", "")) if voter.get("serial_no") else None,
            "voter_part_no": str(voter.get("part_no", "")) if voter.get("part_no") else None
        }.items() if v}

        if person_id:
            self.update_person_metadata(person_id, pan, social_profiles, voter_update, dry_run)
            return person_id, False

        # 3. Create new person
        if dry_run:
            logger.info(f"[DRY RUN] Would create new person for {name}")
            return "PERSON#NEW_PLACEHOLDER", True

        # Generate PK based on Conditional Format:
        # 1. 16-character PAN hash if available
        # 2. name_relation normalized string as fallback
        import hashlib
        short_name = normalize_name(name)
        short_last = normalize_name(last_name or "")
        
        if pan:
            # hex MD5 is 32 chars, we take 16
            pan_hash = hashlib.md5(pan.strip().upper().encode()).hexdigest()[:16]
            base_id = f"PERSON#{pan_hash}"
        else:
            base_id = f"PERSON#{short_name}_{short_last}"
        
        # Check for collisions and add suffix if needed
        final_id, suffix = base_id, 2
        while True:
            if "Item" not in self.persons_table.get_item(Key={"PK": final_id, "SK": "METADATA"}):
                break
            final_id = f"{base_id}_{suffix}"
            suffix += 1

        person_item = {
            "PK": final_id,
            "SK": "METADATA",
            "name": name,
            "lastname": last_name,
            "normalized_name": short_name,
            "birth_year": 2026 - age,
            "sex": cand_data.get("sex"),
            "pan_number": pan.upper() if pan else final_id.split("#")[-1],
            "social_profiles": social_profiles if social_profiles else None,
            "address": cand_data.get("address"),
            "created_at": int(time.time()),
            "createdtime": datetime.now(timezone.utc).isoformat()
        }
        
        # Add latest voter details
        person_item.update(voter_update)

        person_item = convert_floats_to_decimal(person_item)
        self.persons_table.put_item(Item=person_item)
        logger.info(f"Created new person record: {final_id}")
        return final_id, True

    def get_group_id(self, person_id: str) -> Optional[str]:
        """Find group_id from existing candidate records."""
        try:
            response = self.candidates_table.query(
                IndexName="PersonIndex",
                KeyConditionExpression=Key("person_id").eq(person_id),
                ProjectionExpression="group_id"
            )
            for item in response.get("Items", []):
                if item.get("group_id"):
                    return item["group_id"]
        except Exception as e:
            logger.error(f"Error fetching group_id: {e}")
        return None

def normalize_area(area: Any, unit: str) -> Tuple[float, float]:
    """Converts various area units to (acres, cents)."""
    try:
        val = float(area) if area else 0.0
    except:
        val = 0.0
        
    unit = unit.lower() if unit else ""
    if "sq" in unit or "ft" in unit:
        # 1 Acre = 43560 sq.ft
        cents = val / 435.6
        return float(int(cents // 100)), round(cents % 100, 2)
    elif "cent" in unit:
        return float(int(val // 100)), round(val % 100, 2)
    else: # Default to Acre
        acres = int(val)
        cents = round((val - acres) * 100, 2)
        return float(acres), cents

def process_land_assets(land_data: Dict) -> Dict:
    """Processes land assets with unit normalization and aggregation."""
    processed = {}
    g_acres, g_cents = 0.0, 0.0
    
    # Common relations
    relations = ["self", "spouse", "dependents"]
    # Also check for dep1, dep2...
    potential_keys = list(land_data.keys())
    for k in potential_keys:
        if k not in relations and (k.startswith("dep") or k.startswith("dependent")):
            relations.append(k)

    for rel in relations:
        rel_data = land_data.get(rel)
        if not rel_data or isinstance(rel_data, (int, float)): 
            continue
            
        # Preference: gemini_extracted > entries
        source = rel_data.get("gemini_extracted") or rel_data.get("entries") or []
        r_acres, r_cents = 0.0, 0.0
        r_cost = 0.0
        
        for item in source:
            area = item.get("area") or item.get("acres") or 0.0
            unit = item.get("unit") or "Acre"
            a, c = normalize_area(area, unit)
            r_acres += a
            r_cents += c
            
            cost = item.get("purchase_cost") or item.get("value") or 0.0
            try: r_cost += float(cost) if cost else 0.0
            except: pass
            
        # Normalize relation total
        r_acres += int(r_cents // 100)
        r_cents = round(r_cents % 100, 2)
        
        # Update relation total object
        total_obj = rel_data.get("total", {})
        if not total_obj: total_obj = {}
        
        total_obj["calculated"] = {"acres": r_acres, "cents": r_cents}
        total_obj["total_purchase_cost"] = r_cost
        # If declared is missing, use calculated
        if not total_obj.get("declared"):
            total_obj["declared"] = {"acres": r_acres, "cents": r_cents}
        total_obj["mismatch"] = total_obj["calculated"] != total_obj["declared"]
        
        rel_data["total"] = total_obj
        processed[rel] = rel_data
        
        # Add to global total
        g_acres += r_acres
        g_cents += r_cents

    # Normalize global total
    g_acres += int(g_cents // 100)
    g_cents = round(g_cents % 100, 2)
    processed["total"] = {"acres": g_acres, "cents": g_cents}
    
    return processed

def flatten_itr_history(itr_history: Any) -> Dict[str, Any]:
    """Flatten itr_history structure for DynamoDB."""
    if not isinstance(itr_history, dict):
        return {}

    flattened = {}
    for key in ["self", "spouse", "huf"]:
        if key in itr_history and isinstance(itr_history[key], dict):
            cleaned_hist = {y: clean_currency_to_int(str(a)) for y, a in itr_history[key].items()}
            flattened[key] = cleaned_hist
        else:
            flattened[key] = {}

    dependents_data = itr_history.get("dependents", [])
    if isinstance(dependents_data, list):
        for i, dep in enumerate(dependents_data):
            if not isinstance(dep, dict): continue
            income_details = dep.get("income_tax_details")
            if not isinstance(income_details, dict): continue
            flattened[f"dependent{i+1}"] = {y: clean_currency_to_int(str(a)) for y, a in income_details.items()}
    elif isinstance(dependents_data, dict):
        for k, v in dependents_data.items():
            if isinstance(v, dict):
                 flattened[f"dependent_{k}" if not k.startswith("dependent") else k] = {y: clean_currency_to_int(str(a)) for y, a in v.items()}

    return flattened

def get_latest_income_map(flattened_itr: Dict[str, Any]) -> Dict[str, int]:
    """Extract latest income for each member as a map."""
    income_map = {}
    for member, history in flattened_itr.items():
        if not history:
            income_map[member] = 0
            continue
        years = sorted(history.keys(), reverse=True)
        income_map[member] = history[years[0]] if years else 0
    return income_map

def process_simple_assets(asset_data: Any, asset_type: str) -> Dict:
    """Processes gold, silver, vehicle assets with preference logic.
    Handles both dict-of-relations and flat list formats.
    """
    if not asset_data: return {}
    processed = {}
    
    # CASE 1: Flat list (e.g. [{"owner": "self", ...}, ...])
    if isinstance(asset_data, list):
        for item in asset_data:
            if not isinstance(item, dict): continue
            owner = item.get("owner", "self").lower()
            if "spouse" in owner: target = "spouse"
            elif "dep" in owner: target = "dependents"
            else: target = "self"
            
            if target not in processed: processed[target] = []
            if isinstance(processed[target], list):
                processed[target].append(item)
            else:
                # Should not happen with well-formed list, but stay safe
                processed[target] = [item]
        return processed

    # CASE 2: Dict of relations (e.g. {"self": {...}, "spouse": [...]})
    if isinstance(asset_data, dict):
        for rel, rel_data in asset_data.items():
            if rel_data is None: continue
            
            # If it's gemini_extracted subfield, or the object itself
            if isinstance(rel_data, dict) and "gemini_extracted" in rel_data:
                processed[rel] = rel_data["gemini_extracted"]
            else:
                processed[rel] = rel_data
        return processed
            
    return {}

def process_candidates(json_path: str, start: int = 0, limit: int = None, dry_run: bool = False):
    if not os.path.exists(json_path):
        logger.error(f"File not found: {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
    resolver = PersonResolver2026(dynamodb)
    candidates_table = dynamodb.Table(CANDIDATES_TABLE)

    total = len(data)
    end = total if limit is None else min(start + limit, total)
    
    stats = {"new_persons": 0, "linked_persons": 0, "processed": 0, "failed": 0}
    
    logger.info(f"Starting processing from index {start} to {end} (Total: {total})")

    for i in range(start, end):
        item = data[i]
        name = item.get("name")
        constituency = item.get("constituency")
        
        # Resumption: Skip if already succeeded (unless dry run)
        if item.get("db_status") == "success" and not dry_run:
            # logger.info(f"[{i+1}/{total}] Skipping {name} ({constituency}) Already success")
            continue

        logger.info(f"[{i+1}/{total}] Processing {name} ({constituency})")

        try:
            # 1. Resolve Person
            person_id, is_new = resolver.get_or_create_person(item, dry_run=dry_run)
            
            if is_new:
                stats["new_persons"] += 1
            else:
                stats["linked_persons"] += 1
            
            # 2. Resolve Group ID
            group_id = resolver.get_group_id(person_id) if person_id != "PERSON#NEW_PLACEHOLDER" else None
            
            # 3. Prepare Candidate Record
            pk = f"AFFIDAVIT#2026#{i+1}"
            extracted = item.get("extracted_data") or {}
            has_extraction = bool(item.get("extracted_data"))
            
            candidate_item = {
                "PK": pk,
                "SK": "DETAILS",
                "person_id": person_id,
                "constituency_id": f"CONSTITUENCY#{normalize_name(clean_constituency(constituency))}",
                "year": 2026,
                "election_type": "Assembly",
                "candidate_name": name,
                "party_id": resolver.resolve_party_id(item.get("party_name")),
                "total_assets": extracted.get("total_assets", 0),
                "total_liabilities": extracted.get("total_liabilities", 0),
                "criminal_cases": extracted.get("criminal_cases", 0),
                "education": normalize_education(extracted.get("education")),
                "profession": normalize_profession(extracted.get("profession")),
                "profile_pic": item.get("photo_path"),
                "profile_url": item.get("profile_url"),
                "itr_history": flatten_itr_history(extracted.get("itr_history", {})),
                "gold_assets": process_simple_assets(extracted.get("gold_assets", {}), "gold"),
                "silver_assets": process_simple_assets(extracted.get("silver_assets", {}), "silver"),
                "vehicle_assets": process_simple_assets(extracted.get("vehicle_assets", {}), "vehicle"),
                "land_assets": process_land_assets(extracted.get("land_assets", {})),
                "income_itr": get_latest_income_map(flatten_itr_history(extracted.get("itr_history", {}))),
                "group_id": group_id,
                "extraction_status": "complete" if has_extraction else "missing",
                "createdtime": datetime.now(timezone.utc).isoformat()
            }
            
            candidate_item = convert_floats_to_decimal(candidate_item)

            if not dry_run:
                candidates_table.put_item(Item=candidate_item)
                item["db_status"] = "success"
                item["db_candidate_pk"] = pk
                item["db_person_id"] = person_id
                stats["processed"] += 1
            else:
                logger.info(f"[DRY RUN] Would save candidate {pk} for person {person_id}")
                stats["processed"] += 1

            # Incremental save to JSON
            if (i + 1) % 10 == 0 and not dry_run:
                save_json(data, json_path)

        except Exception as e:
            logger.error(f"Error processing candidate at index {i}: {e}", exc_info=True)
            item["db_status"] = "failed"
            item["db_error"] = str(e)
            stats["failed"] += 1

    # Final save
    if not dry_run:
        save_json(data, json_path)
    
    logger.info("Processing complete.")
    logger.info(f"Summary: New Persons: {stats['new_persons']}, Linked Persons: {stats['linked_persons']}, Processed: {stats['processed']}, Failed: {stats['failed']}")

def save_json(data, path):
    temp_path = f"{path}.tmp"
    with open(temp_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    os.replace(temp_path, path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create 2026 candidate records in DynamoDB.")
    parser.add_argument("--start", type=int, default=0, help="Start index (0-based)")
    parser.add_argument("--limit", type=int, default=None, help="Number of items to process")
    parser.add_argument("--dryrun", action="store_true", help="Perform a dry run")
    parser.add_argument("--file", type=str, default="tn_2026_candidates.json", help="Path to JSON file")
    
    args = parser.parse_args()
    process_candidates(args.file, start=args.start, limit=args.limit, dry_run=args.dryrun)
