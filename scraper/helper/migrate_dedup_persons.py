import boto3
from boto3.dynamodb.conditions import Key, Attr
import logging
import hashlib
from typing import List, Dict
import os
import sys

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scraper.utils import normalize_name, strip_initials, names_are_similar

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PersonMigrator:
    def __init__(self, dry_run=True):
        self.dynamodb = boto3.resource('dynamodb', region_name='ap-south-2')
        self.persons_table = self.dynamodb.Table('knowyourmla_persons')
        self.candidates_table = self.dynamodb.Table('knowyourmla_candidates')
        self.dry_run = dry_run

    def normalize_name(self, name: str) -> str:
        return normalize_name(name)


    def scan_persons(self) -> List[Dict]:
        if hasattr(self, 'use_sample_data') and self.use_sample_data:
            logger.info("Using simulation sample data for persons...")
            return [
                {'PK': 'PERSON#sakkarapani_r_2011', 'name': 'SAKKARAPANI R', 'lastname': 'RANGASAMY GOUNDER', 'birth_year': 1962},
                {'PK': 'PERSON#sakkarapani_r_2016', 'name': 'SAKKARAPANI R', 'lastname': 'RANGASAMY GOUNDAR', 'birth_year': 1961, 'voter_serial_no': '597'},
                {'PK': 'PERSON#periyasamy_i_2016', 'name': 'PERIYASAMY I', 'lastname': 'IRULAPPAN SERVAI', 'birth_year': 1952, 'voter_serial_no': '812'},
                {'PK': 'PERSON#periyasamy_i_2021', 'name': 'PERIYASAMY I', 'lastname': 'IRULAPPAN SERVAI', 'birth_year': 1954, 'voter_serial_no': '1023'},
                {'PK': 'PERSON#senthil_2011', 'name': 'SENTHILBALAJI', 'lastname': 'Velusamy', 'birth_year': 1975},
                {'PK': 'PERSON#senthil_2016', 'name': 'SENTHILBALAJI .V', 'lastname': 'P.Veluchamy', 'birth_year': 1975},
                {'PK': 'PERSON#senthil_2021', 'name': 'SENTHILBALAJI V', 'lastname': 'Mr. Velusamy', 'birth_year': 1976},
            ]

        logger.info("Scanning knowyourmla_persons...")
        persons = []
        response = self.persons_table.scan()
        persons.extend(response.get('Items', []))
        while 'LastEvaluatedKey' in response:
            response = self.persons_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            persons.extend(response.get('Items', []))
        logger.info(f"Found {len(persons)} total person records.")
        return persons

    def get_representative_url(self, person_id: str) -> str:
        """Fetch one MyNeta profile URL for the given person_id from candidates table."""
        if hasattr(self, 'use_sample_data') and self.use_sample_data:
            return f"https://myneta.info/sample/candidate.php?id={person_id.split('#')[-1]}"
        
        try:
            response = self.candidates_table.query(
                IndexName='PersonIndex',
                KeyConditionExpression=Key('person_id').eq(person_id),
                Limit=1
            )
            items = response.get('Items', [])
            if items:
                return items[0].get('profile_url', 'No URL found')
        except Exception as e:
            logger.error(f"Error fetching URL for {person_id}: {e}")
            
        return "No URL found"

    def run(self):
        persons = self.scan_persons()
        
        # Cross-group comparison to find all duplicates
        merge_plan = []
        visited_pks = set()

        for i in range(len(persons)):
            if persons[i]['PK'] in visited_pks: continue
            
            p1 = persons[i]
            matches = [p1]
            visited_pks.add(p1['PK'])
            
            for j in range(i + 1, len(persons)):
                if persons[j]['PK'] in visited_pks: continue
                
                p2 = persons[j]
                
                # Match logic: Name Similarity + Lastname Similarity + Birth Year Tolerance
                match_name = names_are_similar(p1.get('name'), p2.get('name'))
                match_lastname = names_are_similar(p1.get('lastname'), p2.get('lastname'))
                
                if match_name and match_lastname:
                    # Fetch candidacy history for both (needed for constituency checks)
                    def get_cands(pk):
                        try:
                            if hasattr(self, 'use_sample_data') and self.use_sample_data:
                                return [] # Mock mode doesn't need full history for general migrator test
                            resp = self.candidates_table.query(
                                IndexName='PersonIndex',
                                KeyConditionExpression=Key('person_id').eq(pk)
                            )
                            return resp.get('Items', [])
                        except: return []

                    cands1 = get_cands(p1['PK'])
                    cands2 = get_cands(p2['PK'])
                    
                    # 1. Same-Year Disambiguation
                    is_collision = False
                    for c1 in cands1:
                        for c2 in cands2:
                            y1, y2 = str(c1.get('year')), str(c2.get('year'))
                            if y1 == y2:
                                const1, const2 = c1.get('constituency_id'), c2.get('constituency_id')
                                if const1 != const2:
                                    # Relax same-year disambiguation if one is a Bye-Election
                                    is_bye = "byeelection" in str(const1).lower() or "byeelection" in str(const2).lower()
                                    
                                    # Also check candidacy_type if available in new schema
                                    if not is_bye:
                                        is_bye = c1.get('candidacy_type') == 'Bye-Election' or c2.get('candidacy_type') == 'Bye-Election'

                                    if is_bye:
                                        logger.info(f"Allowing merge across general/bye-election for {p1.get('name')} in {y1}")
                                        continue

                                    # Multi-seat check
                                    vsn1 = str(p1.get('voter_serial_no') or '')
                                    vpn1 = str(p1.get('voter_part_no') or '')
                                    vsn2 = str(p2.get('voter_serial_no') or '')
                                    vpn2 = str(p2.get('voter_part_no') or '')
                                    
                                    if vsn1 and vpn1 and vsn1 == vsn2 and vpn1 == vpn2:
                                        continue # Valid multi-seat
                                    else:
                                        is_collision = True
                                        break
                        if is_collision: break
                    if is_collision: continue

                    # 2. Birth Year Match with Booster
                    match_birth_year = False
                    by1, by2 = p1.get('birth_year'), p2.get('birth_year')
                    if by1 and by2:
                        diff = abs(int(by1) - int(by2))
                        threshold = 2
                        
                        # Booster: if they ever shared a constituency, allow more drift
                        for c1 in cands1:
                            for c2 in cands2:
                                if c1.get('constituency_id') == c2.get('constituency_id'):
                                    threshold = 5
                                    break
                            if threshold == 5: break
                        
                        match_birth_year = diff <= threshold
                    elif not by1 or not by2:
                        match_birth_year = True 

                    if match_birth_year:
                        matches.append(p2)
                        visited_pks.add(p2['PK'])
                
            if len(matches) > 1:
                # Determine Canonical ID
                # Priority: 
                # 1. Records with voter info (voter_serial_no)
                # 2. Phonetically generated IDs (PERSON#...) over random hashes if any
                
                def get_priority(x):
                    score = 0
                    if 'voter_serial_no' in x: score += 10
                    # Check if PK follows the phononetic pattern PERSON#...
                    pk = x.get('PK', '')
                    if pk.startswith('PERSON#') and not any(c.isdigit() for c in pk[7:]):
                        score += 5
                    return score

                canonical = sorted(matches, key=lambda x: (get_priority(x), len(str(x))), reverse=True)[0]
                
                duplicates = [m for m in matches if m['PK'] != canonical['PK']]
                merge_plan.append({
                    'canonical': canonical,
                    'duplicates': duplicates
                })

        logger.info(f"Analyzed {len(persons)} person records.")
        logger.info(f"Merge Plan: found {len(merge_plan)} sets of duplicate persons to merge.")
        
        total_dupes = sum(len(m['duplicates']) for m in merge_plan)
        logger.info(f"Total redudant records to remove: {total_dupes}")

        if self.dry_run:
            logger.info("=" * 100)
            logger.info("DRY RUN MODE - No changes will be made")
            logger.info("=" * 100)
            for m in merge_plan:
                c = m['canonical']
                c_url = self.get_representative_url(c['PK'])
                logger.info(f"CANONICAL: {c['PK']} ({c.get('name')} | Rel: {c.get('lastname')} | BY: {c.get('birth_year')})")
                logger.info(f"   URL: {c_url}")
                for d in m['duplicates']:
                    d_url = self.get_representative_url(d['PK'])
                    logger.info(f"  [!!!] DUPLICATE: {d['PK']} ({d.get('name')} | Rel: {d.get('lastname')} | BY: {d.get('birth_year')})")
                    logger.info(f"        URL: {d_url}")
                logger.info("-" * 100)
            return

        # EXECUTION MODE
        if not merge_plan:
            logger.info("No duplicates found to merge.")
            return

        logger.warning(f"!!! ACTUAL MIGRATION starting for {total_dupes} duplicates !!!")
        for m in merge_plan:
            canonical_pk = m['canonical']['PK']
            for dup in m['duplicates']:
                dup_pk = dup['PK']
                logger.info(f"Merging {dup_pk} INTO {canonical_pk}")
                
                # 1. Update Candidates
                if hasattr(self, 'use_sample_data') and self.use_sample_data:
                    logger.info(f"  [SIMULATED] Would update candidates for {dup_pk}")
                else:
                    # Scan candidates pointing to this duplicate
                    response = self.candidates_table.query(
                        IndexName='PersonIndex',
                        KeyConditionExpression=Key('person_id').eq(dup_pk)
                    )
                    candidates = response.get('Items', [])
                    for cand in candidates:
                        logger.info(f"  Updating Candidate {cand['PK']} {cand['SK']}")
                        self.candidates_table.update_item(
                            Key={'PK': cand['PK'], 'SK': cand['SK']},
                            UpdateExpression="SET person_id = :pid",
                            ExpressionAttributeValues={':pid': canonical_pk}
                        )
                
                # 2. Delete Redundant Person
                if hasattr(self, 'use_sample_data') and self.use_sample_data:
                    logger.info(f"  [SIMULATED] Would delete person: {dup_pk}")
                else:
                    logger.info(f"  Deleting redundant person: {dup_pk}")
                    self.persons_table.delete_item(Key={'PK': dup_pk, 'SK': 'METADATA'})

if __name__ == "__main__":
    # Default to dry run
    is_dry = True
    use_test = False
    
    if '--execute' in sys.argv:
        is_dry = False
    if '--dry-run' in sys.argv:
        is_dry = True
    if '--test' in sys.argv:
        use_test = True
    
    logger.info(f"Starting PersonMigrator (dry_run={is_dry}, test_mode={use_test})")
    migrator = PersonMigrator(dry_run=is_dry)
    migrator.use_sample_data = use_test
    migrator.run()
