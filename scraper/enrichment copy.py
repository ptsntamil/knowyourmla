import re
import time
from datetime import datetime, timezone
import logging
import argparse
import requests
import boto3
import hashlib
from bs4 import BeautifulSoup
import concurrent.futures
from typing import List, Dict, Optional
from botocore.exceptions import ClientError
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
        self.persons_table = self.dynamodb.Table(PERSONS_TABLE)
        self.constituencies_table = self.dynamodb.Table(CONSTITUENCIES_TABLE)
        self.parties_table = self.dynamodb.Table(PARTIES_TABLE)
        self.states_table = self.dynamodb.Table(STATES_TABLE)
        self.districts_table = self.dynamodb.Table(DISTRICTS_TABLE)
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        self.party_lookup = self._load_parties()

    def _load_parties(self) -> Dict[str, str]:
        """Load all parties from DynamoDB into an in-memory lookup map."""
        logger.info("Loading political parties for resolution...")
        lookup = {}
        try:
            response = self.parties_table.scan()
            items = response.get('Items', [])
            while 'LastEvaluatedKey' in response:
                response = self.parties_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response.get('Items', []))
            
            for item in items:
                party_id = item['PK']
                # Map various fields to the same party_id
                if item.get('name'): lookup[item['name'].lower()] = party_id
                if item.get('normalized_name'): lookup[item['normalized_name'].lower()] = party_id
                if item.get('short_name'): lookup[item['short_name'].lower()] = party_id
                for alias in item.get('alias', []):
                    lookup[alias.lower()] = party_id
                    
            logger.info(f"Loaded {len(items)} parties ({len(lookup)} lookup keys)")
        except ClientError as e:
            logger.error(f"Error loading parties: {e}")
        return lookup

    def resolve_party_id(self, party_name: str) -> str:
        """Resolve a party name to its Master ID."""
        if not party_name:
            return "PARTY#independent"
            
        clean_name = party_name.strip().lower()
        if clean_name in ["ind", "independent", "ind."]:
            return "PARTY#independent"
            
        # Direct lookup
        if clean_name in self.party_lookup:
            return self.party_lookup[clean_name]
            
        # Recursive lookup with normalization
        norm_name = normalize_name(clean_name)
        if norm_name in self.party_lookup:
            return self.party_lookup[norm_name]
            
        # Fallback to normalized name as ID if not found
        return f"PARTY#{norm_name}"

    @retry((requests.RequestException, Exception))
    def fetch_with_retry(self, url: str):
        logger.debug(f"Fetching URL: {url}")
        response = self.session.get(url, timeout=30)
        response.raise_for_status()
        return response

    def fetch_winners(self, year: str) -> List[Dict]:
        """Fetch all winner records for a specific year from DynamoDB."""
        logger.debug(f"Fetching winners for year: {year}")
        winners = []
        try:
            response = self.winners_table.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr('SK').eq(f"YEAR#{year}#WINNER")
            )
            winners.extend(response.get('Items', []))
            while 'LastEvaluatedKey' in response:
                response = self.winners_table.scan(
                    FilterExpression=boto3.dynamodb.conditions.Attr('SK').eq(f"YEAR#{year}#WINNER"),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                winners.extend(response.get('Items', []))
            logger.info(f"Found {len(winners)} winners for {year}")
        except ClientError as e:
            logger.error(f"Error fetching winners: {e.response['Error']['Message']}")
        return winners

    def extract_election_expenses(self, url: str) -> int:
        """Extract total election expenses from a separate expenses page."""
        try:
            response = self.fetch_with_retry(url)
            soup = BeautifulSoup(response.text, "lxml")
            for td in soup.find_all("td"):
                text = td.get_text()
                if "Total Election Expenses" in text or "Total Expenses" in text:
                    next_td = td.find_next_sibling("td")
                    if next_td: return clean_currency_to_int(next_td.get_text())
            for tr in soup.find_all("tr"):
                if "Total" in tr.get_text() or "Grand Total" in tr.get_text():
                    cols = tr.find_all("td")
                    if cols: return clean_currency_to_int(cols[-1].get_text())
        except Exception: pass
        return 0

    def extract_affidavit_details(self, url: str) -> Optional[Dict]:
        """Extract all candidate details including voter info."""
        try:
            time.sleep(REQUEST_DELAY)
            response = self.fetch_with_retry(url)
            html_content = response.text
            if "eval(function(h,u,n,t,e,r)" in html_content:
                html_content = self._deobfuscate_page(html_content)
            soup = BeautifulSoup(html_content, "lxml")
            if "not found" in soup.get_text().lower(): return None

            data = {
                "profile_pic": None, "candidate_name": None, "constituency": None,
                "profession": "Not Specified", "education": "Not Specified",
                "total_assets": 0, "total_liabilities": 0, "criminal_cases": 0,
                "income_itr": 0, "itr_history": {}, "election_expenses": 0,
                "voter_constituency": None, "voter_serial_no": None, "voter_part_no": None,
                "district_id": None, "party_id": None,
                # Myneta constituency_id extracted from breadcrumb URL
                "constituency_myneta_id": None,
                "age": None,
            }
            
            # Extract District if present in text
            dist_match = re.search(r'District:\s*([^\n\r]+)', soup.get_text())
            if dist_match: data["district_id"] = f"DISTRICT#{normalize_name(dist_match.group(1).strip())}"

            # Voter Enrollment Info
            # Format: Name Enrolled as Voter in: 25,mylapoor constituency, at Serial no 24  in Part no   132
            voter_info_tag = soup.find(string=re.compile(r'Enrolled as Voter in', re.I))
            if voter_info_tag:
                # The string lives inside <b>; go up to the enclosing <div> to get full text
                container = voter_info_tag.parent.parent
                p_text = container.get_text(strip=True).replace('\xa0', ' ')
                # logger.info(f"Voter info: {p_text}")
                voter_match = re.search(r'Enrolled as Voter in:\s*(?:\d+,)?\s*(.*?)\s*constituency,\s*at Serial no\s*(\d+)\s*in Part no\s*(\d+)', p_text, re.I)
                if voter_match:
                    # logger.info(f"Voter info: {voter_match.group(1)}")
                    vc_name = clean_constituency(voter_match.group(1).strip())
                    data["voter_constituency"] = vc_name
                    data["voter_serial_no"] = voter_match.group(2).strip()
                    data["voter_part_no"] = voter_match.group(3).strip()

            # Relation Name (Last Name)
            # HTML: <div><b>S/o|D/o|W/o:</b> Karunanithi.M </div>
            relation_tag = soup.find("b", string=re.compile(r'S/o|D/o|W/o', re.I))
            if relation_tag:
                container = relation_tag.parent
                raw_rel = container.get_text(strip=True)
                if ":" in raw_rel:
                    data["lastname"] = raw_rel.split(":", 1)[1].strip()
                else:
                    # Fallback if colon is missing
                    data["lastname"] = raw_rel.replace(relation_tag.get_text(strip=True), "").strip()
            else:
                data["lastname"] = None

            pic_img = soup.find("img", src=lambda s: s and ("photos" in s or "images_candidate" in s))
            if pic_img:
                src = pic_img['src']
                data["profile_pic"] = src if src.startswith("http") else f"https://myneta.info/{src.lstrip('/')}"

            name_tag = soup.find("h2")
            if name_tag: data["candidate_name"] = name_tag.get_text(strip=True).replace("(Winner)", "").strip()

            # Age
            age_tag = soup.find("b", string=re.compile(r'Age:', re.I))
            if age_tag:
                container = age_tag.parent
                raw_age = container.get_text(strip=True)
                m = re.search(r'Age:\s*(\d+)', raw_age, re.I)
                if m:
                    data["age"] = int(m.group(1))

            # MLA candidacy constituency: prefer breadcrumb <a> (clean name, no district suffix)
            # Also extract the Myneta constituency_id from breadcrumb URL.
            # Fallback to h5 which may include "(DISTRICT)" in parens.
            h5_tag = soup.find("h5")
            crumb_links = soup.select("a[href*='constituency_id']")
            raw_const_name = ""
            if crumb_links:
                last_link = crumb_links[-1]
                raw_const_name = last_link.get_text(strip=True)
                c_name = clean_constituency(raw_const_name)
                data["constituency"] = c_name
                href = last_link.get("href", "")
                match = re.search(r"constituency_id=(\d+)", href)
                if match:
                    data["constituency_myneta_id"] = match.group(1)
            elif h5_tag:
                raw_const_name = h5_tag.get_text(strip=True).split('(')[0].strip()
                c_name = clean_constituency(raw_const_name)
                data["constituency"] = c_name
            
            # Election Meta Data from constituency string
            data["candidacy_type"] = "General"
            data["election_date"] = None
            if "BYE ELECTION" in raw_const_name.upper():
                data["candidacy_type"] = "Bye-Election"
                date_match = re.search(r'(\d{2}-\d{2}-\d{4})', raw_const_name)
                if date_match:
                    data["election_date"] = date_match.group(1)
                # Cleanup the constituency name if it was polluted with BYE ELECTION text
                if ":" in data.get("constituency", ""):
                    data["constituency"] = data["constituency"].split(":")[0].strip()

            page_text = soup.get_text(separator=' ')
            party_match = re.search(r'Party:\s*([^\n\r]+)', page_text)
            if party_match: 
                data["party_id"] = self.resolve_party_id(party_match.group(1).strip())
            
            prof_match = re.search(r'Self Profession:\s*([^\n\r]+)', page_text)
            if prof_match: data["profession"] = prof_match.group(1).strip()

            # Assets, Liabilities, Education, Criminal (Same as before)
            assets_header = soup.find(string=re.compile(r'Assets\s*&\s*Liabilities', re.I))
            if assets_header:
                assets_panel = assets_header.find_parent("div", class_=lambda c: c and "w3-panel" in c) or assets_header.find_parent("div")
                if assets_panel:
                    table = assets_panel.find("table")
                    if table:
                        for row in table.find_all("tr"):
                            row_text = row.get_text().replace('\xa0', ' ')
                            if "Assets" in row_text:
                                v = re.search(r'Rs\s*([\d,]+)', row_text)
                                if v: data["total_assets"] = clean_currency_to_int(v.group(1))
                            elif "Liabilities" in row_text:
                                if "Nil" in row_text: data["total_liabilities"] = 0
                                else:
                                    v = re.search(r'Rs\s*([\d,]+)', row_text)
                                    if v: data["total_liabilities"] = clean_currency_to_int(v.group(1))

            edu_header = soup.find(string=re.compile(r'Educational Details', re.I))
            if edu_header:
                edu_panel = edu_header.find_parent("div", class_=lambda c: c and "w3-panel" in c) or edu_header.find_parent("div")
                if edu_panel:
                    edu_text = edu_panel.get_text(separator=' ').replace('\xa0', ' ')
                    edu_text = re.sub(r'Educational Details', '', edu_text, flags=re.I).strip()
                    edu_text = edu_text.split("Crime-O-Meter")[0].split("Disclaimer")[0].strip()
                    data["education"] = re.sub(r'\s+', ' ', edu_text)

            crim_sec = soup.find("div", class_=lambda c: c and ("w3-red" in c or "w3-pale-red" in c))
            if not crim_sec:
                m = re.search(r'Number of Criminal Cases:\s*(\d+)', page_text)
                if m: data["criminal_cases"] = int(m.group(1))
            else:
                m = re.search(r'(\d+)', crim_sec.get_text())
                if m: data["criminal_cases"] = int(m.group(1))
                
            # ITR Table (Detailed History)
            income_table = soup.find("table", id="income_tax") or soup.find("table", id="income_tax_details")
            if not income_table:
                for table in soup.find_all("table"):
                    if "Total Income Shown in ITR" in table.get_text():
                        income_table = table; break
            if income_table:
                for row in income_table.find_all("tr"):
                    cols = row.find_all("td")
                    if len(cols) >= 4:
                        rel = cols[0].get_text(strip=True).lower()
                        cell = cols[-1].get_text().replace('\xa0', ' ')
                        hist = {}
                        matches = re.findall(r'(\d{4}\s*-\s*\d{4}).*?Rs\s*([\d,]+)', cell)
                        for y_range, amt in matches:
                            hist[y_range.strip()] = clean_currency_to_int(amt)
                        if hist:
                            data["itr_history"][rel] = hist
                            if rel == "self" and data["income_itr"] == 0:
                                data["income_itr"] = clean_currency_to_int(matches[0][1])

            exp_link = soup.find("a", href=lambda h: h and "expense.php" in h)
            if exp_link:
                e_url = exp_link['href']
                if not e_url.startswith("http"):
                    e_url = f"{url.split('?')[0].rsplit('/', 1)[0]}/{e_url}"
                data["election_expenses"] = self.extract_election_expenses(e_url)
            return data
        except Exception as e:
            logger.error(f"Error extracting details: {e}")
        return None

    def get_or_create_constituency(self, name: str, cid: int = 0) -> str:
        """Resolve a constituency to its Master ID and update aliases."""
        try:
            # 1. Standardize input
            # logger.info(f"Resolving constituency: {name} (Candidate ID: {cid})")
            cleaned_input = clean_constituency(name) or name.split('(')[0].strip()
            norm_input = normalize_name(cleaned_input)

            # 2. Map to canonical form using alias map
            norm_name = get_all_aliases().get(norm_input, norm_input)
            const_id = f"CONSTITUENCY#{norm_name}"
            
            # logger.info(f"Canonical name: {norm_name} (ID: {const_id})")

            response = self.constituencies_table.get_item(Key={'PK': const_id, 'SK': 'METADATA'})
            if 'Item' in response:
                # Optional: Update existing constituency with new alias if not already tracked
                if norm_input != norm_name:
                    item = response['Item']
                    if norm_input not in item.get('aliases', []):
                        logger.info(f"Adding new alias '{norm_input}' to {const_id}")
                        self.constituencies_table.update_item(
                            Key={'PK': const_id, 'SK': 'METADATA'},
                            UpdateExpression="SET aliases = list_append(if_not_exists(aliases, :empty_list), :new_alias)",
                            ExpressionAttributeValues={
                                ':new_alias': [norm_input],
                                ':empty_list': []
                            }
                        )
            else:
                logger.info(f"Constituency not found in master records: {const_id} (Candidate ID: {cid})")
                
            return const_id
            
        except ClientError as e:
            logger.error(f"Error resolving constituency {name}: {e}")
            return f"CONSTITUENCY#{normalize_name(name)}"

    def _generate_person_id(self, name: str, voter_const: str, serial: str, part: str, lastname: Optional[str] = None) -> str:
        """Generate a deterministic Person ID based on voter info, fallback to name+lastname."""
        if not voter_const or not serial or not part:
            n = strip_initials(name) or normalize_name(name)
            l = strip_initials(lastname) if lastname else None
            if l:
                return f"PERSON#{n}_{l}"
            return f"PERSON#{n}"
        
        # Consistent key for hashing
        key = f"{normalize_name(voter_const)}|{serial}|{part}"
        return f"PERSON#{hashlib.md5(key.encode()).hexdigest()}"


    def get_or_create_person(self, details: Dict, election_year: str, cid: int) -> str:
        """Get existing Person ID or create a new one using multi-factor matching."""
        name = details['candidate_name']
        norm_name = normalize_name(name)
        stripped_name = strip_initials(name) or norm_name
        lastname = details.get('lastname')
        norm_lastname = normalize_name(lastname)
        
        # Calculate approx birth year
        birth_year = None
        if details.get('age') and election_year:
            try:
                birth_year = int(election_year) - int(details['age'])
            except (ValueError, TypeError):
                pass

        # 1. Try to find existing person via NameIndex GSI
        # Try both the stripped name and full normalized name
        name_variations = {stripped_name, norm_name}
        
        # Variation: Strip first or last char if it was merged
        if len(norm_name) > 4:
            name_variations.add(norm_name[:-1]) # Strip last char
            name_variations.add(norm_name[1:])  # Strip first char
            
        existing_persons = []
        try:
            for variant in list(name_variations):
                response = self.persons_table.query(
                    IndexName='NameIndex',
                    KeyConditionExpression=boto3.dynamodb.conditions.Key('normalized_name').eq(variant)
                )
                items = response.get('Items', [])
                existing_persons.extend(items)
            
            # Deduplicate by PK just in case
            seen_pks = set()
            unique_existing = []
            for p in existing_persons:
                if p['PK'] not in seen_pks:
                    unique_existing.append(p)
                    seen_pks.add(p['PK'])
            existing_persons = unique_existing

            for person in existing_persons:
                person_id = person['PK']
                person_birth_year = person.get('birth_year')
                match_lastname = names_are_similar(person.get('lastname'), lastname)
                
                # Check candidacy history for constituency booster/collision detection
                person_candidates = []
                try:
                    response = self.candidates_table.query(
                        IndexName='PersonIndex',
                        KeyConditionExpression=boto3.dynamodb.conditions.Key('person_id').eq(person_id)
                    )
                    person_candidates = response.get('Items', [])
                except Exception as e:
                    logger.error(f"Error checking candidates for {person_id}: {e}")

                current_const = details.get('constituency')
                election_year_str = str(election_year)
                
                # 1. Same-Year Disambiguation (Stricter)
                if current_const:
                    is_same_year_collision = False
                    for pc in person_candidates:
                        if str(pc.get('year')) == election_year_str:
                            if pc.get('constituency_id') != current_const:
                                # Relax same-year disambiguation if one is a Bye-Election
                                is_bye = "byeelection" in str(pc.get('constituency_id')).lower() or "byeelection" in str(current_const).lower()
                                
                                # Also check candidacy_type if available
                                if not is_bye:
                                    is_bye = pc.get('candidacy_type') == 'Bye-Election' or details.get('candidacy_type') == 'Bye-Election'
                                
                                if is_bye:
                                    logger.info(f"Allowing merge across general/bye-election for {name} in {election_year}")
                                    continue

                                # Multi-seat check: If they have exact matching voter registration info,
                                # then it's actually the same person contesting multiple seats.
                                current_vsn = details.get('voter_serial_no')
                                current_vpn = details.get('voter_part_no')
                                person_vsn = person.get('voter_serial_no')
                                person_vpn = person.get('voter_part_no')

                                if current_vsn and current_vpn and current_vsn == person_vsn and current_vpn == person_vpn:
                                    logger.info(f"Multi-seat candidacy detected for {name} in {election_year}. Merging.")
                                    continue # Allow merge
                                else:
                                    is_same_year_collision = True
                                    break
                    if is_same_year_collision:
                        logger.info(f"Divergent candidacy in {election_year}: skipping merge for {name}.")
                        continue

                # 2. Birth Year Match with Constituency Booster
                match_birth_year = False
                if birth_year and person_birth_year:
                    diff = abs(int(birth_year) - int(person_birth_year))
                    
                    # Boost: If they are in the same constituency, allow more drift (up to 5 years)
                    threshold = 2
                    if current_const:
                        for pc in person_candidates:
                            if pc.get('constituency_id') == current_const:
                                threshold = 5
                                break
                    
                    match_birth_year = diff <= threshold
                    if match_lastname and not match_birth_year:
                        logger.debug(f"Birth year mismatch for {name}: {birth_year} vs {person_birth_year} (diff={diff}, threshold={threshold})")
                elif not birth_year or not person_birth_year:
                    match_birth_year = True 

                if match_lastname and match_birth_year:
                    logger.info(f"Matched existing person: {person_id} ({name})")
                    
                    # Update existing person with more complete info if necessary
                    updates = []
                    attr_values = {}
                    
                    if not person.get('voter_serial_no') and details.get('voter_serial_no'):
                        updates.append("voter_serial_no = :vsn, voter_part_no = :vpn")
                        attr_values[':vsn'] = details['voter_serial_no']
                        attr_values[':vpn'] = details['voter_part_no']
                        voter_const_id = self.get_or_create_constituency(details['voter_constituency'], cid) if details['voter_constituency'] else None
                        if voter_const_id:
                            updates.append("voter_constituency_id = :vcid")
                            attr_values[':vcid'] = voter_const_id

                    if person_birth_year is None and birth_year:
                        updates.append("birth_year = :by")
                        attr_values[':by'] = birth_year

                    if updates:
                        self.persons_table.update_item(
                            Key={'PK': person_id, 'SK': 'METADATA'},
                            UpdateExpression="SET " + ", ".join(updates),
                            ExpressionAttributeValues=attr_values
                        )
                    return person_id

        except ClientError as e:
            logger.error(f"Error querying NameIndex: {e}")

        # 2. No match found, generate a new Person ID
        voter_const_id = self.get_or_create_constituency(details['voter_constituency'], cid) if details['voter_constituency'] else None
        base_person_id = self._generate_person_id(name, 
                                            details.get('voter_constituency'), 
                                            details.get('voter_serial_no'), 
                                            details.get('voter_part_no'),
                                            lastname)
        
        person_id = base_person_id
        suffix = 2
        try:
            # Check if this ID already exists. If it does, and we are here, 
            # it means it's a collision (same phonetic ID but didn't match our criteria).
            while True:
                response = self.persons_table.get_item(Key={'PK': person_id, 'SK': 'METADATA'})
                if 'Item' not in response:
                    # Found a unique ID
                    item = {
                        'PK': person_id,
                        'SK': 'METADATA',
                        'name': name,
                        'lastname': lastname,
                        'normalized_name': stripped_name,
                        'voter_serial_no': details.get('voter_serial_no'),
                        'voter_part_no': details.get('voter_part_no'),
                        'created_at': int(time.time()),
                        'createdtime': datetime.now(timezone.utc).isoformat(),
                        'birth_year': birth_year
                    }
                    if voter_const_id:
                        item['voter_constituency_id'] = voter_const_id
                    
                    self.persons_table.put_item(Item=item)
                    logger.info(f"Created new Person record: {person_id}")
                    break
                else:
                    # Collision! This ID exists but we didn't match it in Step 1.
                    # We must generate a unique variations.
                    logger.info(f"ID Collision detected for {person_id}. Trying suffix...")
                    person_id = f"{base_person_id}_{suffix}"
                    suffix += 1
                    
        except ClientError as e:
            logger.error(f"Error in get_or_create_person (put): {e}")
            
        return person_id

    def process_candidate(self, cid: int, year: str, year_slug: str, winners_map: Dict):
        """Process candidate, resolve constituency, and link to person."""
        url = f"{BASE_URL}/{year_slug}/candidate.php?candidate_id={cid}"
        details = self.extract_affidavit_details(url)
        if details and details.get('candidate_name') and details.get('constituency'):
            constituency_name = details['constituency']
            # Resolve Master Constituency ID
            # logger.info(f"Resolving constituency: {constituency_name} for candidate {cid}")
            constituency_id = self.get_or_create_constituency(constituency_name, cid)
            
            # Link to Person Master
            person_id = self.get_or_create_person(details, year, cid)
            logger.info(f"Linking candidate to person master: {person_id}")
            
            # Remove voter fields and constituency fields from details
            # Voter fields belong only in the persons table; constituency name
            # and Myneta constituency id are stored in the master constituency table.
            for voter_field in ("voter_constituency", "voter_serial_no", "voter_part_no"):
                details.pop(voter_field, None)
            for field in ("constituency", "constituency_myneta_id", "age", "party"):
                details.pop(field, None)
            
            # Fuzzy match with Winners
            clean_const = constituency_name.split('(')[0].strip()
            match_key = f"{normalize_name(details['candidate_name'])}_{normalize_name(clean_const)}"
            is_winner = match_key in winners_map
            
            affidavit_item = {
                "PK": f"AFFIDAVIT#{year}#{cid}",
                "SK": "DETAILS",
                "person_id": person_id,
                "constituency_id": constituency_id,
                "is_winner": is_winner,
                "year": int(year),
                "profile_url": url,
                "createdtime": datetime.now(timezone.utc).isoformat(),
                "election_type": "Lok Sabha" if "loksabha" in year_slug.lower() or "ls" in year_slug.lower() else "Assembly",
                "candidacy_type": details.get("candidacy_type", "General"),
                "election_date": details.get("election_date"),
                **details
            }
            
            try:
                self.candidates_table.put_item(Item=affidavit_item)
                logger.debug(f"Saved candidate {cid} for {details['candidate_name']} ({constituency_id})")
            except ClientError as e:
                logger.error(f"Error saving candidate: {e}")

    def _deobfuscate_page(self, html: str) -> str:
        pattern = r'<script[^>]*>(?:(?!</script>).)*?eval\(function\(h,u,n,t,e,r\)\{.*?\}\((.*?),(\d+),"(.*?)",(\d+),(\d+),(\d+)\)\).*?</script>'
        def replace_eval(match):
            try:
                h, u, n, t, r_val, e = match.group(1).strip().strip("'").strip('"'), int(match.group(2)), match.group(3), int(match.group(4)), int(match.group(5)), int(match.group(6))
                deobf = self._deobfuscate_string(h, u, n, t, r_val, e)
                deobf = deobf.replace("document.write('", "").replace("');", "").replace("document.write(\"", "").replace("\");", "").replace("\\'", "'").replace('\\"', '"')
                return deobf
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

    def run(self, year: str, start_id: int = 1, max_id: int = 5000, threads: int = 5):
        logger.info(f"Starting expansion run for {year} (IDs {start_id} to {max_id}) with {threads} threads")
        w_list = self.fetch_winners(year)
        w_map = {f"{normalize_name(w.get('candidate_name'))}_{normalize_name(w.get('PK', '').split('#')[-1])}": w for w in w_list if w.get('candidate_name') and w.get('PK')}
        y_slug = "TamilNadu2021" if year == "2021" else ("tn2006" if year == "2006" else f"tamilnadu{year}")
        with concurrent.futures.ThreadPoolExecutor(max_workers=threads) as ex:
            futures = {ex.submit(self.process_candidate, cid, year, y_slug, w_map): cid for cid in range(start_id, max_id + 1)}
            for f in concurrent.futures.as_completed(futures): pass # Progress via logging

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
