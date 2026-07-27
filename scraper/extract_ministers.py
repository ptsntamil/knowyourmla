import boto3
import requests
from bs4 import BeautifulSoup
import re
import datetime
import os
import time

# Configure boto3
dynamodb = boto3.resource('dynamodb', region_name='ap-south-2')
persons_table = dynamodb.Table('knowyourmla_persons')
candidates_table = dynamodb.Table('knowyourmla_candidates')
portfolios_table = dynamodb.Table('knowyourmla_portfolios')

candidate_overrides = {
    'cjosephvijay': 'AFFIDAVIT#2026#3237',
    'nanand': 'AFFIDAVIT#2026#853',
    'kgarunraj': 'AFFIDAVIT#2026#727',
    'kasengottaiyan': 'AFFIDAVIT#2026#1067',
    'pvenkataramanan': 'AFFIDAVIT#2026#1932',
    'rnirmalkumar': 'AFFIDAVIT#2026#1661',
    'tkprabhu': 'AFFIDAVIT#2026#1956',
    'skeerthana': 'AFFIDAVIT#2026#1428',
    'pviswanathan': 'AFFIDAVIT#2026#515',
    'srajeshkumar': 'AFFIDAVIT#2026#253',
    'avijaytamilanparthiban': 'AFFIDAVIT#2026#950',
    'kvignesh': 'AFFIDAVIT#2026#1100',
    'kthennarasu': 'AFFIDAVIT#2026#1575',
    'jmohamedfarvas': 'AFFIDAVIT#2026#1112',
    'jagadeshwarik': 'AFFIDAVIT#2026#1220',
    'rvinoth': 'AFFIDAVIT#2026#1369',
    'ramesh': 'AFFIDAVIT#2026#2213',
    'asrinath': 'AFFIDAVIT#2026#2234',
    'skamali': 'AFFIDAVIT#2026#1192',
    'kumarr': 'AFFIDAVIT#2026#1232',
    'rvranjithkumar': 'AFFIDAVIT#2026#704',
    'dlogeshtamilselvan': 'AFFIDAVIT#2026#1882',
    'vkrajeev': 'AFFIDAVIT#2026#2037',
}

def normalize_name(name: str) -> str:
    # Lowercase and remove non-alphanumeric
    name = re.sub(r'[^a-zA-Z0-9]', '', name.lower())
    # Common prefixes to strip for matching
    name = re.sub(r'^thiru', '', name)
    name = re.sub(r'^dr', '', name)
    name = re.sub(r'^tmt', '', name)
    name = re.sub(r'^selvi', '', name)
    return name

def fetch_ministers_html():
    url = "https://www.tn.gov.in/minister_list.php"
    requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)
    response = requests.get(url, verify=False)
    if response.status_code != 200:
        print(f"Failed to fetch {url}")
        return None
    return response.text

def parse_ministers(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    minister_divs = soup.find_all('div', class_='minister_col_description')
    
    ministers = []
    
    for div in minister_divs:
        h4_tags = div.find_all('h4')
        if len(h4_tags) >= 2:
            raw_name = h4_tags[0].text.strip()
            designation = h4_tags[1].text.strip()
            
            p_tag = div.find('p', class_='p_tag')
            portfolios_raw = p_tag.text.strip() if p_tag else ""
            
            # Split portfolios by comma
            portfolios = [p.strip() for p in portfolios_raw.split(',') if p.strip()]
            
            # Find image
            parent_div = div.parent
            img_tag = parent_div.find('img', class_='img_cls')
            img_url = img_tag['src'] if img_tag else ""
            
            if img_url and not img_url.startswith('http'):
                img_url = 'https://cms.tn.gov.in' + img_url
            elif img_url.startswith('//'):
                img_url = 'https:' + img_url
                
            ministers.append({
                'raw_name': raw_name,
                'normalized_name': normalize_name(raw_name),
                'designation': designation,
                'portfolios': portfolios,
                'img_url': img_url
            })
    return ministers

def find_candidate_for_minister(normalized_name):
    """
    Search `knowyourmla_persons` by normalized name to get person_id.
    Then find the winning candidate for that person.
    """
    if normalized_name in candidate_overrides:
        candidate_id = candidate_overrides[normalized_name]
        cand_resp = candidates_table.get_item(Key={'PK': candidate_id, 'SK': 'DETAILS'})
        if 'Item' in cand_resp:
            return cand_resp['Item'].get('person_id'), candidate_id
            
    response = persons_table.query(
        IndexName='NameIndex',
        KeyConditionExpression=boto3.dynamodb.conditions.Key('normalized_name').eq(normalized_name)
    )
    persons = response.get('Items', [])
    if not persons:
        return None, None
        
    person_id = persons[0]['PK']
    
    # Get 2021 candidate
    cand_response = candidates_table.query(
        IndexName='PersonIndex',
        KeyConditionExpression=boto3.dynamodb.conditions.Key('person_id').eq(person_id)
    )
    
    winner_cand_id = None
    # Prioritize 2021 or 2026 winners
    for cand in cand_response.get('Items', []):
        if cand.get('is_winner') or str(cand.get('is_winner_flag', '')).lower() == 'true':
            winner_cand_id = cand['PK']
            break
            
    return person_id, winner_cand_id

def store_portfolios(ministers):
    start_date = "2021-05-07"
    roster = []
    matched = 0
    
    for m in ministers:
        person_id, candidate_id = find_candidate_for_minister(m['normalized_name'])
        
        if not candidate_id:
            print(f"Warning: Could not find winning candidate for minister: {m['raw_name']} ({m['normalized_name']})")
            # We can still add them to the roster without candidate ID for now, 
            # so the frontend doesn't break, but ideally we match them.
            person_id = f"PERSON#UNKNOWN_{m['normalized_name']}"
            candidate_id = f"AFFIDAVIT#UNKNOWN_{m['normalized_name']}"
        else:
            matched += 1
            print(f"Matched {m['raw_name']} -> {candidate_id}")
        
        # Add to roster
        roster.append({
            'candidate_id': candidate_id,
            'person_id': person_id,
            'name': m['raw_name'],
            'designation': m['designation'],
            'portfolios': m['portfolios'],
            'profile_pic': m['img_url']
        })
        
        portfolio_ids = []
        for port in m['portfolios']:
            norm_port = normalize_name(port)
            port_id = f"PORTFOLIO#{norm_port}"
            portfolio_ids.append(port_id)
            
            # Master Record
            portfolios_table.put_item(Item={
                'PK': port_id,
                'SK': 'METADATA',
                'id': port_id,
                'name': port,
                'normalized_name': norm_port
            })
            
            # Assignment Record
            portfolios_table.put_item(Item={
                'PK': port_id,
                'SK': f"ASSIGNMENT#{start_date}#{candidate_id}",
                'entity_type': 'PORTFOLIO_ASSIGNMENT',
                'candidate_id': candidate_id,
                'person_id': person_id,
                'designation': m['designation'],
                'start_date': start_date,
                'end_date': None,
                'is_active': True,
                'CandidateIndexPK': candidate_id,
                'CandidateIndexSK': f"ASSIGNMENT#{start_date}",
                'ActiveCabinetIndexPK': 'CABINET#2026',
                'ActiveCabinetIndexSK': port_id
            })
            
        # Update Candidate Record if matched
        if not candidate_id.startswith("AFFIDAVIT#UNKNOWN"):
            candidates_table.update_item(
                Key={'PK': candidate_id, 'SK': 'DETAILS'},
                UpdateExpression="SET is_minister = :t, current_designation = :desg, current_portfolios = :ports",
                ExpressionAttributeValues={
                    ':t': True,
                    ':desg': m['designation'],
                    ':ports': m['portfolios']
                }
            )
        
    if roster:
        portfolios_table.put_item(Item={
            'PK': 'CABINET#2026',
            'SK': 'CURRENT_ROSTER',
            'last_updated': int(time.time()),
            'ministers': roster
        })
        print(f"Successfully stored cabinet roster with {len(roster)} ministers. Matched: {matched}")

if __name__ == "__main__":
    print("Fetching HTML...")
    html = fetch_ministers_html()
    if html:
        print("Parsing...")
        ministers = parse_ministers(html)
        print(f"Found {len(ministers)} ministers.")
        print("Updating database...")
        store_portfolios(ministers)
        print("Done.")
