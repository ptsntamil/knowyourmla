#!/usr/bin/env python3

"""
Candidate Enrichment & Identity Resolution Pipeline
==================================================

WHEN TO USE THIS FILE:
- Use this script after you have populated the initial 'winners' data (using external sources or other scrapers).
- It is primarily designed to enrich candidate records with detailed affidavit information (assets, criminal cases, education) from MyNeta.info.
- Use it when you need to link candidates across different election cycles (e.g., linking a 2016 winner to their 2021 record).

WHY TO USE THIS FILE:
- To build a deep, historical profile for every politician in the database.
- It automates the "deep scraping" of MyNeta profiles, which involves parsing complex HTML and handling obfuscated data.
- It features a sophisticated IdentityResolver that uses phonetic matching, age tolerance, and relation name validation to ensure high-accuracy deduplication.
- It discovers missing historical links by recursing through "Other Elections" listed on candidate profiles.

WHERE TO USE THIS FILE:
- This script is the core of the 'scraper' directory.
- It interacts with multiple DynamoDB tables: 'knowyourmla_candidates', 'knowyourmla_persons', and the legacy 'tn_political_data'.
- It should be run from the root of the project.

HOW TO RUN THIS FILE:
- Prerequisites: Ensure AWS credentials and Python dependencies are ready (`pip install -r scraper/requirements.txt`).
- Basic Command:
    python3 scraper/enrichment.py --year 2021
- Advanced Usage (with threads and ID range):
    python3 scraper/enrichment.py --year 2021 --start_id 1 --max_id 500 --threads 10
- Options:
    --year: The election year to process (e.g., 2011, 2016, 2021).
    --start_id / --max_id: Limits the range of MyNeta candidate IDs to check (useful for targeted enrichment).
    --threads: Number of concurrent threads for faster scraping (default: 10).
"""
import time
from datetime import datetime, timezone
import logging
import argparse
import re
import requests
import boto3
import hashlib
from bs4 import BeautifulSoup
import concurrent.futures
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field, asdict
from decimal import Decimal
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
from config import logger, BASE_URL, USER_AGENT, REQUEST_DELAY
from utils import (
    normalize_name,
    strip_initials,
    names_are_similar,
    clean_currency_to_int,
    clean_constituency,
    get_all_aliases,
    )

# Constants
TABLE_NAME = "tn_political_data"
PERSONS_TABLE = "knowyourmla_persons"
CANDIDATES_TABLE = "knowyourmla_candidates"
CONSTITUENCIES_TABLE = "knowyourmla_constituencies"
PARTIES_TABLE = "knowyourmla_political_parties"
STATES_TABLE = "knowyourmla_states"
DISTRICTS_TABLE = "knowyourmla_districts"
REGION_NAME = "ap-south-2"

@dataclass
class ElectionEntry:
    election: str
    assets: str
    cases: str
    url: Optional[str] = None
    year_slug: Optional[str] = None
    candidate_id: Optional[str] = None

@dataclass
class AffidavitData:
    candidate_name: Optional[str] = None
    lastname: Optional[str] = None
    profile_pic: Optional[str] = None
    constituency: Optional[str] = None
    constituency_myneta_id: Optional[str] = None
    profession: str = "Not Specified"
    education: str = "Not Specified"
    total_assets: int = 0
    total_liabilities: int = 0
    criminal_cases: int = 0
    income_itr: int = 0
    itr_history: Dict[str, Dict[str, int]] = field(default_factory=dict)
    election_expenses: int = 0
    voter_constituency: Optional[str] = None
    voter_serial_no: Optional[str] = None
    voter_part_no: Optional[str] = None
    district_id: Optional[str] = None
    party_id: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    tcpd_pid: Optional[str] = None
    total_votes: Optional[int] = None
    winning_margin: Optional[int] = None
    margin_percentage: Optional[Decimal] = None
    position: Optional[int] = None
    is_incumbent: Optional[bool] = None
    is_turncoat: Optional[bool] = None
    no_terms: Optional[int] = None
    candidate_type: Optional[str] = None
    other_elections: List[ElectionEntry] = field(default_factory=list)
    group_id: Optional[str] = None
    candidacy_type: str = "General"
    election_date: Optional[str] = None
    error: Optional[bool] = None
    message: Optional[str] = None
    year: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

# Configure Logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("enrichment_pipeline")

from functools import wraps

def retry(exceptions, tries=2, delay=REQUEST_DELAY, backoff=2):
    """Retry decorator with exponential backoff."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            mtries, mdelay = tries, delay
            while mtries > 1:
                try:
                    return f(*args, **kwargs)
                except exceptions as e:
                    logger.warning(f"{e}, Retrying in {mdelay} seconds...")
                    time.sleep(mdelay)
                    mtries -= 1
                    mdelay *= backoff
            return f(*args, **kwargs)
        return wrapper
    return decorator

class EnrichmentPipeline:
    def __init__(self, table_name: str = TABLE_NAME, region: str = REGION_NAME):
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.winners_table = self.dynamodb.Table(table_name)
        self.candidates_table = self.dynamodb.Table(CANDIDATES_TABLE)
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        self.parser = MyNetaParser(self.session)
        self.resolver = IdentityResolver(self.dynamodb)

    def fetch_winners(self, year: str) -> List[Dict]:
        """Fetch all winner records for a specific year from DynamoDB."""
        logger.debug(f"Fetching winners for year: {year}")
        winners = []
        try:
            response = self.winners_table.scan(
                FilterExpression=Attr('SK').eq(f"YEAR#{year}#WINNER")
            )
            winners.extend(response.get('Items', []))
            while 'LastEvaluatedKey' in response:
                response = self.winners_table.scan(
                    FilterExpression=Attr('SK').eq(f"YEAR#{year}#WINNER"),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                winners.extend(response.get('Items', []))
            logger.info(f"Found {len(winners)} winners for {year}")
        except ClientError as e:
            logger.error(f"Error fetching winners: {e.response['Error']['Message']}")
        return winners

    def process_candidate(self, cid: int, year: str, year_slug: str, winners_map: Optional[Dict] = None, person_id_override: Optional[str] = None):
        """Process candidate, resolve identities, and link history."""
        pk = f"AFFIDAVIT#{year}#{cid}"
        logger.info(f"Processing candidate {cid} ({year}) with PK: {pk}")
        
        try:
            resp = self.candidates_table.get_item(Key={"PK": pk, "SK": "DETAILS"})
            existing = resp.get("Item")
            
            # Use current details if provided or needed
            details = self._get_candidate_details(cid, year, year_slug, existing)
            if details is None and not existing: return
            if details and details.error: return
            
            candidate_group_id = details.group_id if details else existing.get("group_id")
            
            # 2. Identity Resolution
            person_id = person_id_override or (existing.get("person_id") if existing else None)
            
            # Look up by group_id if person_id is not yet found
            if not person_id and candidate_group_id:
                person_id = self._find_person_id_by_group_id(candidate_group_id, year_slug)
                if person_id:
                    logger.info(f"Resolved person_id {person_id} via group_id {candidate_group_id}")

            # Always ensure the person record exists/is updated
            if details:
                person_id = self.resolver.get_or_create_person(details, year, cid, person_id_override=person_id)
                logger.info(f"Linked candidate {cid} to person {person_id}")

            # 3. Persistence
            if not existing:
                self._save_new_candidate(pk, cid, year, year_slug, details, person_id, winners_map)
            elif details:
                self._update_candidate_history(pk, cid, details)

            # 4. History Discovery & Recursion
            history = details.other_elections if details else existing.get("other_elections_summary", [])
            group_id = details.group_id if details else existing.get("group_id")
            self._discover_and_recurse(cid, year, year_slug, person_id, history, group_id)

        except Exception as e:
            logger.error(f"Error processing candidate {cid} ({year}): {e}", exc_info=True)

    def _get_candidate_details(self, cid: int, year: str, slug: str, existing: Optional[Dict]) -> Optional[AffidavitData]:
        """Fetch details from MyNeta if missing or errored."""
        # Check if retry or initial fetch is needed
        needs_fetch = not existing or not existing.get("group_id") or not existing.get("other_elections_summary")
        if existing and existing.get("error"):
            if existing.get("message") == "Failed to extract details from MyNeta":
                logger.debug(f"Retrying previously failed candidate {cid} ({year})")
                needs_fetch = True
            else:
                logger.info(f"Skipping candidate {cid} with existing error: {existing.get('message')}")
                return None # Skip

        if not needs_fetch:
            return None

        url = f"{BASE_URL}/{slug}/candidate.php?candidate_id={cid}"
        details = self.parser.extract_affidavit_details(url, self.resolver)
        
        if details is None:
            if not existing:
                logger.info(f"Candidate {cid} ({year}) not found or has no data on MyNeta. Skipping.")
            return None
            
        if details.error:
            if not existing:
                pk = f"AFFIDAVIT#{year}#{cid}"
                logger.warning(f"Failed to extract details for NEW candidate {cid} ({year}): {details.message}. Recording failure.")
                self._save_error_candidate(pk, cid, year, url, details.message or "Failed to extract details from MyNeta")
            else:
                logger.warning(f"Refresh failed for existing candidate {cid} ({year}): {details.message}")
            
        return details

    def _save_error_candidate(self, pk: str, cid: int, year: str, url: str, message: str):
        """Creates a minimal candidate record to indicate a scraping failure."""
        item = {
            "PK": pk,
            "SK": "DETAILS",
            "candidate_id": str(cid),
            "year": int(year),
            "profile_url": url,
            "error": True,
            "message": message,
            "createdtime": datetime.now(timezone.utc).isoformat(),
            "last_tried": datetime.now(timezone.utc).isoformat()
        }
        self.candidates_table.put_item(Item=item)
        logger.info(f"Saved error record for candidate {cid} ({year})")

    def _save_new_candidate(self, pk: str, cid: int, year: str, slug: str, details: AffidavitData, person_id: str, winners_map: Optional[Dict]):
        constituency_id = self.resolver.get_or_create_constituency(details.constituency, cid)
        
        # Fuzzy match winner
        is_winner = False
        if winners_map:
            clean_const = details.constituency.split('(')[0].strip()
            key = f"{normalize_name(details.candidate_name)}_{normalize_name(clean_const)}"
            is_winner = key in winners_map

        item = {
            "PK": pk, "SK": "DETAILS", "person_id": person_id, "constituency_id": constituency_id,
            "is_winner": is_winner, "profile_url": f"{BASE_URL}/{slug}/candidate.php?candidate_id={cid}",
            "createdtime": datetime.now(timezone.utc).isoformat(),
            "election_type": "Lok Sabha" if any(x in slug.lower() for x in ["loksabha", "ls"]) else "Assembly",
            "other_elections_summary": [asdict(e) for e in details.other_elections],
            **details.to_dict()
        }
        
        # Ensure year is set correctly and NOT overwritten by details.year (which might be None)
        item["year"] = int(year)
        
        # Clean up transient parser fields
        for f in ["voter_constituency", "voter_serial_no", "voter_part_no", "constituency", "constituency_myneta_id", "age", "other_elections", "sex", "tcpd_pid"]:
            item.pop(f, None)
            
        self.candidates_table.put_item(Item=item)
        logger.debug(f"Saved candidate {cid} ({year})")

    def _update_candidate_history(self, pk: str, cid: int, details: AffidavitData):
        updates, vals = [], {}
        if details.other_elections:
            updates.append("other_elections_summary = :oes")
            vals[":oes"] = [asdict(e) for e in details.other_elections]
        if details.group_id:
            updates.append("group_id = :gid")
            vals[":gid"] = details.group_id
        if details.income_itr:
            updates.append("income_itr = :inc, itr_history = :itrh")
            vals.update({":inc": details.income_itr, ":itrh": details.itr_history})
        if details.party_id:
            updates.append("party_id = :pid")
            vals[":pid"] = details.party_id
        if details.year:
            updates.append("#yr = :yr")
            vals[":yr"] = int(details.year)
        
        if updates:
            kwargs = {
                "Key": {"PK": pk, "SK": "DETAILS"},
                "UpdateExpression": "SET " + ", ".join(updates),
                "ExpressionAttributeValues": vals
            }
            if "#yr" in kwargs["UpdateExpression"]:
                kwargs["ExpressionAttributeNames"] = {"#yr": "year"}
                
            self.candidates_table.update_item(**kwargs)

    def _discover_and_recurse(self, cid: int, year: str, slug: str, person_id: str, history: List[Any], group_id: Optional[str]):
        """Discover deeper historical links and recurse."""
        # 1. Augment history via group comparison page if needed
        if group_id and not any(getattr(e, 'candidate_id', None) or (isinstance(e, dict) and e.get('candidate_id')) for e in history):
            history = self._discover_historical_links(group_id, history, slug)

        # 2. Recurse
        for entry in history:
            t_cid = entry.candidate_id if hasattr(entry, 'candidate_id') else entry.get('candidate_id')
            t_slug = entry.year_slug if hasattr(entry, 'year_slug') else entry.get('year_slug')
            
            if t_cid and t_slug:
                y_match = re.search(r'(\d{4})', t_slug)
                t_year = y_match.group(1) if y_match else year
                
                if str(t_cid) == str(cid) and str(t_year) == str(year): continue

                if 'Item' not in self.candidates_table.get_item(Key={"PK": f"AFFIDAVIT#{t_year}#{t_cid}", "SK": "DETAILS"}):
                    logger.info(f"Recursing into {t_slug} (CID: {t_cid})")
                    self.process_candidate(t_cid, t_year, t_slug, None, person_id)

    def _discover_historical_links(self, group_id: str, history: List[Any], current_slug: str) -> List[Dict]:
        """Fetch group comparison page to find missing candidate IDs/slugs."""
        logger.info(f"Searching historical links via group_id: {group_id}")
        url = f"{BASE_URL}/compare_profile.php?group_id={group_id}"
        new_history = [asdict(e) if hasattr(e, 'election') else e for e in history]
        
        try:
            resp = self.parser.session.get(url, timeout=30)
            soup = BeautifulSoup(resp.text, "lxml")
            for link in soup.find_all("a", href=lambda h: h and "candidate.php?candidate_id=" in h):
                path = link["href"].split("myneta.info/")[-1].lstrip("/")
                parts = path.split("/")
                t_slug = parts[0] if len(parts) >= 2 else current_slug
                cid_m = re.search(r"candidate_id=(\d+)", path)
                if cid_m:
                    t_cid = cid_m.group(1)
                    y_m = re.search(r'(\d{4})', t_slug)
                    t_year = y_m.group(1) if y_m else "Unknown"
                    
                    if not any(str(e.get("candidate_id")) == str(t_cid) for e in new_history):
                        new_history.append({"election": t_slug, "candidate_id": t_cid, "year_slug": t_slug})
        except Exception as e:
            logger.error(f"Error discovering links: {e}")
        return new_history

    def _find_person_id_by_group_id(self, group_id: str, current_slug: str) -> Optional[str]:
        """Attempt to find an existing person_id by checking other candidates in the same MyNeta group."""
        # Get historical links (uses cache-like logic in _discover_historical_links)
        history = self._discover_historical_links(group_id, [], current_slug)
        
        for entry in history:
            t_cid = entry.get('candidate_id')
            t_slug = entry.get('year_slug')
            if not t_cid or not t_slug:
                continue
            
            y_match = re.search(r'(\d{4})', t_slug)
            t_year = y_match.group(1) if y_match else "Unknown"
            
            # Query the table for this specific candidate to see if they are already linked to a person
            pk = f"AFFIDAVIT#{t_year}#{t_cid}"
            try:
                resp = self.candidates_table.get_item(
                    Key={"PK": pk, "SK": "DETAILS"},
                    ProjectionExpression="person_id"
                )
                if 'Item' in resp and resp['Item'].get('person_id'):
                    return resp['Item']['person_id']
            except Exception as e:
                logger.debug(f"Error checking candidate {pk} for group lookup: {e}")
                
        return None

    def run(self, year: str, start_id: int = 1, max_id: int = 5000, threads: int = 5):
        logger.info(f"Starting expansion run for {year} (IDs {start_id} to {max_id}) with {threads} threads")
        w_list = self.fetch_winners(year)
        w_map = {f"{normalize_name(w.get('candidate_name'))}_{normalize_name(w.get('PK', '').split('#')[-1])}": w for w in w_list if w.get('candidate_name') and w.get('PK')}
        y_slug = "TamilNadu2021" if year == "2021" else ("tn2006" if year == "2006" else f"tamilnadu{year}")
        with concurrent.futures.ThreadPoolExecutor(max_workers=threads) as ex:
            future_to_cid = {ex.submit(self.process_candidate, cid, year, y_slug, w_map): cid for cid in range(start_id, max_id + 1)}
            for future in concurrent.futures.as_completed(future_to_cid):
                cid = future_to_cid[future]
                try:
                    future.result()
                except Exception as e:
                    logger.error(f"Thread error for candidate {cid}: {e}", exc_info=True)

class IdentityResolver:
    """Handles person matching, constituency resolution, and party lookup."""

    def __init__(self, dynamodb: Any):
        self.dynamodb = dynamodb
        self.persons_table = dynamodb.Table(PERSONS_TABLE)
        self.candidates_table = dynamodb.Table(CANDIDATES_TABLE)
        self.constituencies_table = dynamodb.Table(CONSTITUENCIES_TABLE)
        self.parties_table = dynamodb.Table(PARTIES_TABLE)
        self.districts_table = dynamodb.Table(DISTRICTS_TABLE)
        self.party_lookup = self._load_lookup(self.parties_table, "parties")
        self.district_lookup = self._load_lookup(self.districts_table, "districts")

    def _load_lookup(self, table: Any, label: str) -> Dict[str, str]:
        """Generic lookup loader for parties and districts."""
        logger.info(f"Loading {label} for resolution...")
        lookup = {}
        try:
            response = table.scan()
            items = response.get('Items', [])
            while 'LastEvaluatedKey' in response:
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response.get('Items', []))
            
            for item in items:
                pk = item['PK']
                for field in ['name', 'normalized_name', 'short_name']:
                    if item.get(field): lookup[item[field].lower()] = pk
                for alias in item.get('alias', []):
                    lookup[alias.lower()] = pk
            logger.info(f"Loaded {len(items)} {label} ({len(lookup)} lookup keys)")
        except ClientError as e:
            logger.error(f"Error loading {label}: {e}")
        return lookup

    def resolve_district_id(self, district_name: str) -> Optional[str]:
        if not district_name: return None
        clean = district_name.strip().lower()
        norm = normalize_name(clean)
        return self.district_lookup.get(clean) or self.district_lookup.get(norm) or f"DISTRICT#{norm}"

    def resolve_party_id(self, party_name: str) -> str:
        if not party_name: return "PARTY#independent"
        clean = party_name.strip().lower()
        if clean in ["ind", "independent", "ind."]: return "PARTY#independent"
        norm = normalize_name(clean)
        return self.party_lookup.get(clean) or self.party_lookup.get(norm) or f"PARTY#{norm}"

    def get_or_create_constituency(self, name: str, cid: int = 0, dry_run: bool = False) -> str:
        """Resolve a constituency to its Master ID and update aliases."""
        try:
            cleaned = clean_constituency(name) or name.split('(')[0].strip()
            norm_input = normalize_name(cleaned)
            
            # Use local alias mapping to find the canonical name
            norm_name = get_all_aliases().get(norm_input, norm_input)
            const_id = f"CONSTITUENCY#{norm_name}"

            response = self.constituencies_table.get_item(Key={'PK': const_id, 'SK': 'METADATA'})
            if 'Item' in response and norm_input != norm_name:
                if not dry_run:
                    if norm_input not in response['Item'].get('aliases', []):
                        self.constituencies_table.update_item(
                            Key={'PK': const_id, 'SK': 'METADATA'},
                            UpdateExpression="SET aliases = list_append(if_not_exists(aliases, :empty_list), :new_alias)",
                            ExpressionAttributeValues={':new_alias': [norm_input], ':empty_list': []}
                        )
            return const_id
        except ClientError as e:
            logger.error(f"Error resolving constituency {name}: {e}")
            return f"CONSTITUENCY#{normalize_name(name)}"

    def _generate_person_id(self, name: str, voter_const: str, serial: str, part: str, lastname: Optional[str] = None) -> str:
        if not all([voter_const, serial, part]):
            n = strip_initials(name) or normalize_name(name)
            l = strip_initials(lastname) if lastname else None
            return f"PERSON#{n}_{l}" if l else f"PERSON#{n}"
        key = f"{normalize_name(voter_const)}|{serial}|{part}"
        return f"PERSON#{hashlib.md5(key.encode()).hexdigest()}"

    def get_or_create_person(self, details: AffidavitData, election_year: str, cid: int, person_id_override: Optional[str] = None, dry_run: bool = False) -> str:
        """Get existing Person ID or create a new one using multi-factor matching."""
        birth_year = (int(election_year) - int(details.age)) if (details.age and election_year) else None
        
        if person_id_override:
            self._update_person_metadata(person_id_override, details, birth_year, dry_run=dry_run)
            return person_id_override

        name, lastname = details.candidate_name, details.lastname
        norm_name = normalize_name(name)
        stripped_name = strip_initials(name) or norm_name

        # 1. Search for existing persons
        name_variations = {stripped_name, norm_name}
        if details.tcpd_pid:
            try:
                # Fallback scan for tcpd_pid
                resp = self.persons_table.scan(FilterExpression=Attr('tcpd_pid').eq(details.tcpd_pid))
                tcpd_matches = resp.get('Items', [])
                if tcpd_matches:
                    self._update_person_metadata(tcpd_matches[0]['PK'], details, birth_year, dry_run=dry_run)
                    return tcpd_matches[0]['PK']
            except Exception: pass

        if len(norm_name) > 4:
            name_variations.update([norm_name[:-1], norm_name[1:]])
            
        try:
            matches = []
            for variant in name_variations:
                resp = self.persons_table.query(IndexName='NameIndex', KeyConditionExpression=Key('normalized_name').eq(variant))
                matches.extend(resp.get('Items', []))
            
            # De-duplicate by PK
            unique_matches = {m['PK']: m for m in matches}.values()

            for person in unique_matches:
                if self._is_person_match(person, details, election_year, birth_year):
                    self._update_person_metadata(person['PK'], details, birth_year, dry_run=dry_run)
                    return person['PK']

        except ClientError as e:
            logger.error(f"Error querying IdentityResolver: {e}")

        # 2. Register new person
        return self._register_new_person(details, name, norm_name, lastname, birth_year, cid, dry_run=dry_run)

    def _is_person_match(self, person: Dict, details: AffidavitData, year: str, birth_year: Optional[int]) -> bool:
        """Heuristic to determine if a candidate matches an existing person record."""
        person_id = person['PK']
        
        # Check candidacy history for collisions and boosters
        try:
            resp = self.candidates_table.query(IndexName='PersonIndex', KeyConditionExpression=Key('person_id').eq(person_id))
            history = resp.get('Items', [])
        except Exception: history = []

        # Booster: Did this person already run in the SAME YEAR and SAME CONSTITUENCY?
        # If yes, and name matched (from Resolver query), it's 99% the same person even if records differ slightly.
        same_year_same_const = False
        if details.constituency:
            for pc in history:
                if str(pc.get('year')) == str(year) and pc.get('constituency_id') == details.constituency:
                    same_year_same_const = True
                    break

        p_lastname = person.get('lastname')
        d_lastname = details.lastname
        
        if p_lastname and d_lastname:
            match_lastname = names_are_similar(p_lastname, d_lastname)
        elif not p_lastname and not d_lastname:
            match_lastname = True # Both missing, trust name + other factors
        else:
            # One is missing (common with TCPD data). 
            # Allow match IF same-year-same-const booster is active.
            match_lastname = same_year_same_const

        # Same-year collision check: 
        # If they match on name but we know they are in DIFFERENT constituencies in the SAME year,
        # we reject the match (to avoid merging two different "Stalin"s in different seats in 2021).
        if details.constituency:
            for pc in history:
                if str(pc.get('year')) == str(year) and pc.get('constituency_id') != details.constituency:
                    is_bye = "Bye-Election" in [pc.get('candidacy_type'), details.candidacy_type]
                    multi_seat = all([details.voter_serial_no, details.voter_part_no, details.voter_serial_no == person.get('voter_serial_no'), details.voter_part_no == person.get('voter_part_no')])
                    if not (is_bye or multi_seat): return False

        if not match_lastname:
            return False

        # Birth year check
        if birth_year and person.get('birth_year'):
            diff = abs(int(birth_year) - int(person['birth_year']))
            threshold = 5 if same_year_same_const else 2
            return diff <= threshold
        
        return True

    def _update_person_metadata(self, person_id: str, details: AffidavitData, birth_year: Optional[int], dry_run: bool = False):
        try:
            resp = self.persons_table.get_item(Key={'PK': person_id, 'SK': 'METADATA'})
            existing = resp.get('Item', {})
        except ClientError as e:
            logger.error(f"    Failed to fetch existing person {person_id} for metadata update: {e}")
            return

        updates, vals = [], {}
        log_changes = []

        if details.voter_serial_no and not existing.get('voter_serial_no'):
            updates.append("voter_serial_no = :vsn")
            updates.append("voter_part_no = :vpn")
            vals.update({':vsn': details.voter_serial_no, ':vpn': details.voter_part_no})
            log_changes.append(f"voter_serial_no: None -> {details.voter_serial_no}")
            
            vcid = self.get_or_create_constituency(details.voter_constituency) if details.voter_constituency else None
            if vcid:
                updates.append("voter_constituency_id = :vcid")
                vals[':vcid'] = vcid
        
        if details.sex and not existing.get('sex'):
            updates.append("sex = :sex")
            vals[":sex"] = details.sex
            log_changes.append(f"sex: {existing.get('sex')} -> {details.sex}")
            
        if details.tcpd_pid and not existing.get('tcpd_pid'):
            updates.append("tcpd_pid = :tpid")
            vals[":tpid"] = details.tcpd_pid
            log_changes.append(f"tcpd_pid: {existing.get('tcpd_pid')} -> {details.tcpd_pid}")
            
        if birth_year and not existing.get('birth_year'):
            updates.append("birth_year = :by")
            vals[':by'] = birth_year
            log_changes.append(f"birth_year: {existing.get('birth_year')} -> {birth_year}")

        if not updates:
            logger.debug(f"    No missing metadata to update for person {person_id}")
            return
            
        logger.info(f"    [Updating] Person {person_id} metadata: " + ", ".join(log_changes))
        
        if not dry_run:
            try:
                expr = "SET " + ", ".join(updates)
                self.persons_table.update_item(Key={'PK': person_id, 'SK': 'METADATA'}, UpdateExpression=expr, ExpressionAttributeValues=vals)
            except ClientError as e:
                logger.error(f"    Failed to update person metadata for {person_id}: {e}")

    def _register_new_person(self, details: AffidavitData, name: str, norm_name: str, lastname: Optional[str], birth_year: Optional[int], cid: int, dry_run: bool = False) -> str:
        base_id = self._generate_person_id(name, details.voter_constituency, details.voter_serial_no, details.voter_part_no, lastname)
        person_id, suffix = base_id, 2
        while True:
            if 'Item' not in self.persons_table.get_item(Key={'PK': person_id, 'SK': 'METADATA'}):
                item = {
                    'PK': person_id, 'SK': 'METADATA', 'name': name, 'lastname': lastname, 
                    'normalized_name': normalize_name(name), 'phonetic_name': norm_name,
                    'voter_serial_no': details.voter_serial_no, 'voter_part_no': details.voter_part_no,
                    'created_at': int(time.time()), 'createdtime': datetime.now(timezone.utc).isoformat(), 'birth_year': birth_year
                }
                if details.sex: item['sex'] = details.sex
                if details.tcpd_pid: item['tcpd_pid'] = details.tcpd_pid
                if dry_run: return person_id
                
                vcid = self.get_or_create_constituency(details.voter_constituency, dry_run=dry_run) if details.voter_constituency else None
                if vcid: item['voter_constituency_id'] = vcid
                self.persons_table.put_item(Item=item)
                return person_id
            person_id = f"{base_id}_{suffix}"
            suffix += 1



class MyNetaParser:
    """Handles all MyNeta HTML parsing logic."""

    def __init__(self, session: requests.Session):
        self.session = session

    def _get_soup(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch URL and return a BeautifulSoup object, handling obfuscation.
        
        Returns:
            Optional[BeautifulSoup]: BeautifulSoup object if successful, None if 'Not Found'.
        Raises:
            requests.RequestException: For network errors.
        """
        time.sleep(REQUEST_DELAY)
        response = self.session.get(url, timeout=30)
        
        if response.status_code == 404:
            return None
            
        response.raise_for_status()
        html_content = response.text
        
        if "eval(function(h,u,n,t,e,r)" in html_content:
            html_content = self._deobfuscate_page(html_content)
        
        soup = BeautifulSoup(html_content, "lxml")
        page_text = soup.get_text().lower()
        
        # Identify "No Data" or "Not Found" markers in the page content
        if "page not found" in page_text or "no data" in page_text or "not found" in page_text:
            return None
            
        return soup

    def extract_affidavit_details(self, url: str, resolver: Any) -> Optional[AffidavitData]:
        """Extract all candidate details from the affidavit page.
        
        Returns:
            Optional[AffidavitData]: Details object if successful, None if candidate doesn't exist.
        """
        try:
            soup = self._get_soup(url)
            if not soup:
                return None
        except Exception as e:
            logger.error(f"Network error fetching affidavit from {url}: {e}")
            return AffidavitData(error=True, message=f"Network error: {str(e)}")

        data = AffidavitData()
        page_text = soup.get_text(separator=' ')

        self._parse_basic_info(soup, data, resolver)
        self._parse_voter_info(soup, data)
        self._parse_financials(soup, data)
        self._parse_education(soup, data)
        self._parse_itr_history(soup, data)
        self._parse_election_history(soup, data)
        self._parse_expenses(soup, url, data)

        return data

    def _parse_basic_info(self, soup: BeautifulSoup, data: AffidavitData, resolver: Any):
        """Parse name, age, party, and district."""
        name_tag = soup.find("h2")
        if name_tag:
            data.candidate_name = name_tag.get_text(strip=True).replace("(Winner)", "").strip()

        age_tag = soup.find("b", string=re.compile(r'Age:', re.I))
        if age_tag:
            container = age_tag.parent
            m = re.search(r'Age:\s*(\d+)', container.get_text(strip=True), re.I)
            if m:
                data.age = int(m.group(1))

        party_match = re.search(r'Party:\s*([^\n\r]+)', soup.get_text(separator=' '))
        if party_match:
            data.party_id = resolver.resolve_party_id(party_match.group(1).strip())

        prof_match = re.search(r'Self Profession:\s*([^\n\r]+)', soup.get_text(separator=' '))
        if prof_match:
            data.profession = prof_match.group(1).strip()

        pic_img = soup.find("img", src=lambda s: s and ("photos" in s or "images_candidate" in s))
        if pic_img:
            src = pic_img['src']
            data.profile_pic = src if src.startswith("http") else f"https://myneta.info/{src.lstrip('/')}"

        # Resolve District and Constituency
        self._resolve_location(soup, data, resolver)

    def _resolve_location(self, soup: BeautifulSoup, data: AffidavitData, resolver: Any):
        """Resolve district and constituency info."""
        h5_tag = soup.find("h5")
        raw_const_name = ""
        crumb_links = soup.select("a[href*='constituency_id']")

        if crumb_links:
            last_link = crumb_links[-1]
            raw_const_name = last_link.get_text(strip=True)
            data.constituency = clean_constituency(raw_const_name)
            match = re.search(r"constituency_id=(\d+)", last_link.get("href", ""))
            if match:
                data.constituency_myneta_id = match.group(1)
        elif h5_tag:
            raw_const_name = h5_tag.get_text(strip=True)
            data.constituency = clean_constituency(raw_const_name.split('(')[0].strip())

        # District from h5 or text
        dist_match = re.search(r'District:\s*([^\n\r]+)', soup.get_text())
        if dist_match:
            data.district_id = resolver.resolve_district_id(dist_match.group(1).strip())
        elif h5_tag:
            dist_matches = re.findall(r'\(([^)]+)\)', h5_tag.get_text(strip=True))
            if dist_matches:
                potential = [d.strip() for d in dist_matches if d.strip().upper() not in ["SC", "ST", "GEN"]]
                if potential:
                    data.district_id = resolver.resolve_district_id(potential[-1])

        # Election Type/Candidacy Logic
        if "BYE ELECTION" in raw_const_name.upper():
            data.candidacy_type = "Bye-Election"
            date_match = re.search(r'(\d{2}-\d{2}-\d{4})', raw_const_name)
            if date_match:
                data.election_date = date_match.group(1)
            if data.constituency and ":" in data.constituency:
                data.constituency = data.constituency.split(":")[0].strip()

    def _parse_voter_info(self, soup: BeautifulSoup, data: AffidavitData):
        """Parse voter enrollment details."""
        voter_info_tag = soup.find(string=re.compile(r'Enrolled as Voter in', re.I))
        if voter_info_tag:
            container = voter_info_tag.parent.parent
            p_text = container.get_text(strip=True).replace('\xa0', ' ')
            voter_match = re.search(r'Enrolled as Voter in:\s*(?:\d+,)?\s*(.*?)\s*constituency,\s*at Serial no\s*(\d+)\s*in Part no\s*(\d+)', p_text, re.I)
            if voter_match:
                data.voter_constituency = clean_constituency(voter_match.group(1).strip())
                data.voter_serial_no = voter_match.group(2).strip()
                data.voter_part_no = voter_match.group(3).strip()

        relation_tag = soup.find("b", string=re.compile(r'S/o|D/o|W/o', re.I))
        if relation_tag:
            container = relation_tag.parent
            raw_rel = container.get_text(strip=True)
            data.lastname = raw_rel.split(":", 1)[1].strip() if ":" in raw_rel else raw_rel.replace(relation_tag.get_text(strip=True), "").strip()

    def _parse_financials(self, soup: BeautifulSoup, data: AffidavitData):
        """Parse assets and liabilities."""
        assets_header = soup.find(string=re.compile(r'Assets\s*&\s*Liabilities', re.I))
        if assets_header:
            panel = assets_header.find_parent("div", class_=lambda c: c and "w3-panel" in c) or assets_header.find_parent("div")
            table = panel.find("table") if panel else None
            if table:
                for row in table.find_all("tr"):
                    row_text = row.get_text().replace('\xa0', ' ')
                    if "Assets" in row_text:
                        v = re.search(r'Rs\s*([\d,]+)', row_text)
                        if v: data.total_assets = clean_currency_to_int(v.group(1))
                    elif "Liabilities" in row_text:
                        if "Nil" in row_text: data.total_liabilities = 0
                        else:
                            v = re.search(r'Rs\s*([\d,]+)', row_text)
                            if v: data.total_liabilities = clean_currency_to_int(v.group(1))

    def _parse_education(self, soup: BeautifulSoup, data: AffidavitData):
        """Parse educational details and criminal cases."""
        edu_header = soup.find(string=re.compile(r'Educational Details', re.I))
        if edu_header:
            panel = edu_header.find_parent("div", class_=lambda c: c and "w3-panel" in c) or edu_header.find_parent("div")
            if panel:
                text = panel.get_text(separator=' ').replace('\xa0', ' ')
                text = re.sub(r'Educational Details', '', text, flags=re.I).strip()
                data.education = re.sub(r'\s+', ' ', text.split("Crime-O-Meter")[0].split("Disclaimer")[0].strip())

        crim_sec = soup.find("div", class_=lambda c: c and ("w3-red" in c or "w3-pale-red" in c))
        if crim_sec:
            m = re.search(r'(\d+)', crim_sec.get_text())
            if m: data.criminal_cases = int(m.group(1))
        else:
            m = re.search(r'Number of Criminal Cases:\s*(\d+)', soup.get_text(separator=' '))
            if m: data.criminal_cases = int(m.group(1))

    def _parse_itr_history(self, soup: BeautifulSoup, data: AffidavitData):
        """Parse ITR summary and detailed history."""
        income_table = soup.find("table", id=re.compile(r'income_tax', re.I))
        if not income_table:
            for table in soup.find_all("table"):
                if "Total Income Shown in ITR" in table.get_text():
                    income_table = table
                    break
        if income_table:
            for row in income_table.find_all("tr"):
                cols = row.find_all("td")
                if len(cols) >= 4:
                    rel = cols[0].get_text(strip=True).lower()
                    cell_text = cols[-1].get_text().replace('\xa0', ' ')
                    hist = {}
                    
                    # Case 1: Year and amount in history cell
                    matches = re.findall(r'(\d{4}\s*-\s*\d{4}).*?Rs\s*([\d,]+)', cell_text)
                    for y_range, amt in matches:
                        hist[y_range.strip()] = clean_currency_to_int(amt)
                    
                    # Case 2: Separate columns
                    if not hist:
                        y_match = re.search(r'(\d{4}(?:\s*-\s*\d{4})?)', cols[2].get_text(strip=True))
                        amt_match = re.search(r'Rs\s*([\d,]+)', cell_text)
                        if y_match and amt_match:
                            hist[y_match.group(1).strip()] = clean_currency_to_int(amt_match.group(1))

                    if hist:
                        if rel not in data.itr_history: data.itr_history[rel] = {}
                        data.itr_history[rel].update(hist)
                        if rel == "self" and data.income_itr == 0:
                            data.income_itr = hist[list(hist.keys())[0]]

    def _parse_election_history(self, soup: BeautifulSoup, data: AffidavitData):
        """Parse 'Other Elections' table and group_id."""
        header = soup.find(lambda t: t.name in ["b", "th", "td"] and "Other Elections" in t.get_text())
        if header:
            table = header.find_parent("table") or (header.find_parent("div").find("table") if header.find_parent("div") else None)
            if table:
                for row in table.find_all("tr")[1:]:
                    cols = row.find_all("td")
                    if len(cols) >= 3:
                        entry = ElectionEntry(election=cols[0].get_text(strip=True), assets=cols[1].get_text(strip=True), cases=cols[2].get_text(strip=True))
                        link = cols[0].find("a")
                        if link and "candidate.php" in link.get("href", ""):
                            href = link["href"]
                            entry.url = f"https://myneta.info/{href.lstrip('/')}" if not href.startswith("http") else href
                            path_parts = entry.url.split("myneta.info/")[-1].strip("/").split("/")
                            if path_parts:
                                entry.year_slug = path_parts[0]
                                cid_m = re.search(r"candidate_id=(\d+)", entry.url)
                                if cid_m: entry.candidate_id = cid_m.group(1)
                        data.other_elections.append(entry)
                
                compare_link = table.find("a", href=lambda h: h and "group_id=" in h)
                if compare_link:
                    m = re.search(r"group_id=([^&]+)", compare_link["href"])
                    if m: data.group_id = m.group(1)

    def _parse_expenses(self, soup: BeautifulSoup, url: str, data: AffidavitData):
        """Handle standalone expenses page extraction."""
        exp_link = soup.find("a", href=lambda h: h and "expense.php" in h)
        if exp_link:
            e_url = exp_link['href']
            if not e_url.startswith("http"):
                base = url.split('?')[0].rsplit('/', 1)[0]
                e_url = f"{base}/{e_url.lstrip('/')}"
            data.election_expenses = self.extract_election_expenses(e_url)

    def extract_election_expenses(self, url: str) -> int:
        """Fetch and parse the expenses page."""
        try:
            response = self.session.get(url, timeout=30)
            soup = BeautifulSoup(response.text, "lxml")
            for td in soup.find_all("td"):
                text = td.get_text()
                if "Total Election Expenses" in text or "Total Expenses" in text:
                    next_td = td.find_next_sibling("td")
                    if next_td:
                        # Use clean_currency_to_int which now handles the Lacs+ suffix robustly
                        return clean_currency_to_int(next_td.get_text())
            for tr in soup.find_all("tr"):
                if any(x in tr.get_text() for x in ["Total", "Grand Total"]):
                    cols = tr.find_all("td")
                    if cols:
                        return clean_currency_to_int(cols[-1].get_text())
        except Exception: pass
        return 0

    def _deobfuscate_page(self, html: str) -> str:
        pattern = r'<script[^>]*>(?:(?!</script>).)*?eval\(function\(h,u,n,t,e,r\)\{.*?\}\((.*?),(\d+),"(.*?)",(\d+),(\d+),(\d+)\)\).*?</script>'
        def replace_eval(match):
            try:
                h, u, n, t, r_val, e = match.group(1).strip().strip("'").strip('"'), int(match.group(2)), match.group(3), int(match.group(4)), int(match.group(5)), int(match.group(6))
                deobf = self._deobfuscate_string(h, u, n, t, r_val, e)
                return deobf.replace("document.write('", "").replace("');", "").replace("document.write(\"", "").replace("\");", "").replace("\\'", "'").replace('\\"', '"')
            except Exception: return match.group(0)
        return re.sub(pattern, replace_eval, html, flags=re.DOTALL)

    def _deobfuscate_string(self, h, u, n, t, e, r_param):
        def base_decode(d, bf, bt):
            alph = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/"
            h_c, i_c, j = alph[0:bf], alph[0:bt], 0
            for idx, c in enumerate(reversed(d)):
                v = h_c.find(c)
                if v != -1: j += v * (bf ** idx)
            if j == 0: return "0"
            k = ""
            while j > 0: k = i_c[j % bt] + k; j = (j - (j % bt)) // bt
            return k
        dec_r, i, delim = "", 0, n[e]
        while i < len(h):
            s = ""
            while i < len(h) and h[i] != delim: s += h[i]; i += 1
            i += 1; ts = s
            for jj in range(len(n)): ts = ts.replace(n[jj], str(jj))
            if ts:
                try: dec_r += chr(int(base_decode(ts, e, 10)) - t)
                except Exception: pass
        try: return dec_r.encode('latin1', errors='ignore').decode('utf-8', errors='ignore')
        except: return dec_r



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", required=True)
    parser.add_argument("--start_id", type=int, default=1)
    parser.add_argument("--max_id", type=int, default=5000)
    parser.add_argument("--threads", type=int, default=10)
    args = parser.parse_args()
    pipeline = EnrichmentPipeline()
    pipeline.run(args.year, start_id=args.start_id, max_id=args.max_id, threads=args.threads)

if __name__ == "__main__":
    main()
