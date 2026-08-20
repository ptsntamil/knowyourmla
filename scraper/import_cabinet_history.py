import pandas as pd
import boto3
import time
import argparse
from extract_ministers import normalize_name

# Configure boto3
dynamodb = boto3.resource('dynamodb', region_name='ap-south-2')
portfolios_table = dynamodb.Table('knowyourmla_portfolios')
persons_table = dynamodb.Table('knowyourmla_persons')

# Manual Mapping for names that do not match the database automatically.
# Format: "CSV Name": {"person_id": "PERSON#...", "candidate_id": "AFFIDAVIT#..."}
# Update this dictionary manually based on the dry-run output.
MANUAL_PERSON_MAPPING = {
 "J. Jayalalithaa": {"person_id": "PERSON#2a0f9fa5f594d249b97d130f6fb0d336", "candidate_id": "AFFIDAVIT#2016#68"},
 "Dindigul C. Sreenivasan":{"person_id": "PERSON#e49c2ce7947b46a038f92a7b0109be37", "candidate_id": "AFFIDAVIT#2016#1138"},
  "Edappadi K. Palaniswami": {"person_id": "PERSON#03e5078758247e1611987c9933cdabc2", "candidate_id": "AFFIDAVIT#2016#1577"},
  "Sellur K. Raju": {"person_id": "PERSON#4272d908030840b8806009382d939ede", "candidate_id": "AFFIDAVIT#2016#1659"},
  "C. Ve. Shanmugam": {"person_id": "PERSON#e3145b97c4824d4b8f3f31d240f53782", "candidate_id": "AFFIDAVIT#2016#1399"},
  "K. P. Anbalagan": {"person_id": "PERSON#c1590c504f1d4d294214cf0f8d57c74c", "candidate_id": "AFFIDAVIT#2016#68"},
  "Dr. V. Saroja": {"person_id": "PERSON#45ff963c3160f28bc377a9d3a5566bcf", "candidate_id": "AFFIDAVIT#2016#1630"},
  "K. C. Karuppannan": {"person_id": "PERSON#6cbe2d58692fedbf54b49a9a7ba69bbd", "candidate_id": "AFFIDAVIT#2016#1725"},
  "R. Kamaraj": {"person_id": "PERSON#38f7bd19b2e5def2a434c7099426e218", "candidate_id": "AFFIDAVIT#2016#1471"},
  "Udumalai K. Radhakrishnan": {"person_id": "PERSON#b2b724421da0de63da53ba6b05e9f373", "candidate_id": "AFFIDAVIT#2016#1929"},
  "C. Vijayabhaskar": {"person_id": "PERSON#6dd4282a0ffa12d6543133a21f54d010", "candidate_id": "AFFIDAVIT#2016#1993"},
  "S. P. Shanmuganathan": {"person_id": "PERSON#sanmokanatan", "candidate_id": "AFFIDAVIT#2016#T#AETN198163"},
  "Kadambur C. Raju": {"person_id": "PERSON#0bc1f4f0137538a709b824be70b209c2", "candidate_id": "AFFIDAVIT#2016#1459"},
  "R. B. Udhayakumar": {"person_id": "PERSON#9c8265b8e3023c084e73ca0d6bf3f5c8", "candidate_id": "AFFIDAVIT#2016#1665"},
  "K. T. Rajenthra Bhalaji": {"person_id": "PERSON#d3e0f89b3315eb20115e303a7f2d2376", "candidate_id": "AFFIDAVIT#2016#2013"},
  "K. C. Veeramani": {"person_id": "PERSON#4332b6bbf3ffe4d7d0c21d8af87a9710", "candidate_id": "AFFIDAVIT#2016#T#AETN191259"},
  "P. Benjamin": {"person_id": "PERSON#83ae48557c680f902168f8bd7a47d497", "candidate_id": "AFFIDAVIT#2016#537"},
  "V. M. Rajalakshmi": {"person_id": "PERSON#265998081065be031c62a6ce3a6471c5", "candidate_id": "AFFIDAVIT#2016#2375"},
  "S. Valarmathi": {"person_id": "PERSON#009a6e210e00628941dfe468c637982e", "candidate_id": "AFFIDAVIT#2016#1785"},
  "P. Balakrishna Reddy": {"person_id": "PERSON#8843435a88d5516945459d74e19823d3", "candidate_id": "AFFIDAVIT#2016#1672"},
  "Pandiarajan": {"person_id": "PERSON#6cfdb8fc26c555e7c6691b3979a34bea", "candidate_id": "AFFIDAVIT#2016#529"},
  "R. Doraikkannu": {"person_id": "PERSON#torakano", "candidate_id": "AFFIDAVIT#2016#T#AETN189537"},
  "Vellamandi N. Natarajan": {"person_id": "PERSON#fc8d9e9fb3220e8322f60dc3004448f7", "candidate_id": "AFFIDAVIT#2016#1450"},
  "Dr. Nilofer Kafeel": {"person_id": "PERSON#16835bdc1bb74ab36b510b5390a5dbed", "candidate_id": "AFFIDAVIT#2016#3170"},
  "M. R. Vijayabhaskar": {"person_id": "PERSON#404606ebb6f8dbcbda38fdf125054767", "candidate_id": "AFFIDAVIT#2016#1692"},
  "Ma. Subramanian": {"person_id": "PERSON#71361962c1afd2c01993f20304bbaec3", "candidate_id": "AFFIDAVIT#2021#4476"},
  "P. Sekar Babu": {"person_id": "PERSON#e09a11fdb988c3df48c1a5907a39e002", "candidate_id": "AFFIDAVIT#2021#422"},
  "V. Senthil Balaji": {"person_id": "PERSON#8eaa3ab20e8d2579a4fb73805425ab14", "candidate_id": "AFFIDAVIT#2021#485"},
  "K. N. Nehru": {"person_id": "PERSON#10e5b4c4816400764be3824bc7c9e7b3", "candidate_id": "AFFIDAVIT#2021#2063"},
  "I. Periyasamy": {"person_id": "PERSON#830dd6bed6bd91cde8182e175bd7a456", "candidate_id": "AFFIDAVIT#2021#365"},
  "Thangam Thennarasu": {"person_id": "PERSON#2a754ce03e44f3648a1d6db0a89d5076", "candidate_id": "AFFIDAVIT#2021#702"},
  "K. R. Periakaruppan": {"person_id": "PERSON#966b13a283755297d09ba2899e2ef104", "candidate_id": "AFFIDAVIT#2021#2071"},
  "M. P. Saminathan": {"person_id": "PERSON#e7b1729916a1959ce4baa3518e3b9850", "candidate_id": "AFFIDAVIT#2021#454"},
  "S. Muthusamy": {"person_id": "PERSON#83098111546865b7100fe4131a4effbb", "candidate_id": "AFFIDAVIT#2021#1040"},
  "Anita R. Radhakrishnan": {"person_id": "PERSON#anitharradhakrishnan_ramamoorthy", "candidate_id": "AFFIDAVIT#2021#1588"},
  "S. R. Rajakannappan": {"person_id": "PERSON#e86b09c02ce0e6d1bac6f6867608ae9b", "candidate_id": "AFFIDAVIT#2021#1884"},
  "C. V. Ganesan": {"person_id": "PERSON#6b8aee82f6f4d152c8f365ee3973985e", "candidate_id": "AFFIDAVIT#2021#738"},
  "T. Mano Thangaraj": {"person_id": "PERSON#e696bacc7e391baf73db10ab03348884", "candidate_id": "AFFIDAVIT#2021#216"},
  "M. Mathiventhan": {"person_id": "PERSON#0f9232dae0e99bde8409751d890a2d1a", "candidate_id": "AFFIDAVIT#2021#1998"},
  "N. Kayalvizhi": {"person_id": "PERSON#bed3d2a3a2d68a312b4cb4f6bf8daeab", "candidate_id": "AFFIDAVIT#2021#4053"},
}

def get_person_id_by_name(name):
    norm_name = normalize_name(name)
    response = persons_table.query(
        IndexName='NameIndex',
        KeyConditionExpression=boto3.dynamodb.conditions.Key('normalized_name').eq(norm_name)
    )
    persons = response.get('Items', [])
    if persons:
        return persons[0]['PK']
    return None

def import_csv(file_path, dry_run=False):
    print(f"Reading {file_path}...")
    if dry_run:
        print("--- DRY RUN MODE: No database writes will be executed ---")
        
    df = pd.read_csv(file_path)
    
    # We will process row by row
    ministry_groups = {}
    persons_not_found = []
    
    for index, row in df.iterrows():
        name = str(row['Name']).strip()
        person_id = str(row.get('Person_ID', '')).strip()
        candidate_id = ""
        
        if name in MANUAL_PERSON_MAPPING:
            person_id = MANUAL_PERSON_MAPPING[name]['person_id']
            candidate_id = MANUAL_PERSON_MAPPING[name]['candidate_id']
        elif pd.isna(row.get('Person_ID')) or not person_id:
            person_id = get_person_id_by_name(name)
            if not person_id:
                if name not in persons_not_found:
                    persons_not_found.append(name)
                person_id = f"PERSON#UNKNOWN_{normalize_name(name)}"
        
        if not candidate_id:
            candidate_id = f"AFFIDAVIT#{person_id}" # Fallback if not specified in mapping
                
        start_date = str(row['Start Date']).strip()
        end_date = None if pd.isna(row.get('End Date')) else str(row['End Date']).strip()
        portfolios_raw = str(row['Portfolio']).strip()
        
        designation = str(row.get('Designation', 'Minister')).strip() if not pd.isna(row.get('Designation')) else 'Minister'
        chief_minister = str(row.get('Chief Minister', 'Unknown')).strip() if not pd.isna(row.get('Chief Minister')) else 'Unknown'
        government = str(row.get('Government', 'Unknown Assembly')).strip() if not pd.isna(row.get('Government')) else 'Unknown Assembly'
        cabinet_event = str(row.get('Cabinet Event', 'Cabinet Formation/Reshuffle')).strip() if not pd.isna(row.get('Cabinet Event')) else 'Cabinet Formation/Reshuffle'
        
        is_add_charge = False
        if 'Is Add. Charge' in row and not pd.isna(row['Is Add. Charge']):
            val = str(row['Is Add. Charge']).lower()
            is_add_charge = val in ['true', 'yes', '1']
            
        # Parse departments from the portfolio string by removing parentheses and splitting by comma
        import re
        cleaned_portfolios_raw = re.sub(r'[\(\)]', '', portfolios_raw)
        portfolios = [p.strip() for p in cleaned_portfolios_raw.split(',') if p.strip()]
        
        # Group by person_id + start_date + cabinet_event
        group_key = f"{person_id}_{start_date}_{cabinet_event}"
        if group_key not in ministry_groups:
            ministry_groups[group_key] = {
                'person_id': person_id,
                'candidate_id': candidate_id,
                'start_date': start_date,
                'designation': designation,
                'end_date': end_date,
                'chief_minister': chief_minister,
                'government': government,
                'cabinet_event': cabinet_event,
                'is_additional_charge': is_add_charge,
                'portfolios': []
            }
            
        for port in portfolios:
            norm_port = normalize_name(port)
            ministry_groups[group_key]['portfolios'].append(norm_port)
            
            portfolio_pk = f"PORTFOLIO#{norm_port}"
            department_pk = f"DEPARTMENT#{norm_port}"
            
            # Put PORTFOLIO_HISTORY
            print(f"Prepared Portfolio/Department History: {norm_port} -> {name} ({person_id})")
            if not dry_run:
                portfolios_table.put_item(Item={
                    'PK': portfolio_pk,
                    'SK': f"PORTFOLIO_HISTORY#{start_date}#{person_id}",
                    'entity_type': 'PORTFOLIO_HISTORY',
                    'portfolio_name': norm_port,
                    'minister_id': person_id,
                    'start_date': start_date,
                    'end_date': end_date,
                    'cabinet_event': cabinet_event,
                    'government': government,
                    'chief_minister': chief_minister
                })
                
                # Also ensure METADATA exists for portfolio
                portfolios_table.put_item(Item={
                    'PK': portfolio_pk,
                    'SK': 'METADATA',
                    'id': portfolio_pk,
                    'name': port,
                    'normalized_name': norm_port
                })
                
                # Put DEPARTMENT_HISTORY
                portfolios_table.put_item(Item={
                    'PK': department_pk,
                    'SK': f"HISTORY#{start_date}#{person_id}",
                    'entity_type': 'DEPARTMENT_HISTORY',
                    'department_name': norm_port,
                    'minister_id': person_id,
                    'start_date': start_date,
                    'end_date': end_date,
                    'cabinet_event': cabinet_event,
                    'government': government,
                    'chief_minister': chief_minister,
                    'change_type': 'Assignment'
                })
                
                # Ensure METADATA exists for department
                portfolios_table.put_item(Item={
                    'PK': department_pk,
                    'SK': 'METADATA',
                    'id': department_pk,
                    'name': port,
                    'normalized_name': norm_port
                })
            
    # Now put Ministry History
    for group_key, data in ministry_groups.items():
        person_id = data['person_id']
        start_date = data['start_date']
        
        ministry_id = f"MINISTRY#{start_date}_{person_id.replace('PERSON#', '')}"
        print(f"Prepared Ministry History: {ministry_id}")
        
        if not dry_run:
            portfolios_table.put_item(Item={
                'PK': ministry_id,
                'SK': 'METADATA',
                'entity_type': 'MINISTRY_HISTORY',
                'person_id': person_id,
                'candidate_id': data['candidate_id'],
                'portfolio_names': data['portfolios'],
                'designation': data['designation'],
                'chief_minister': data['chief_minister'],
                'government': data['government'],
                'start_date': start_date,
                'end_date': data['end_date'],
                'is_additional_charge': data['is_additional_charge'],
                'cabinet_event': data['cabinet_event'],
                'cabinet_id': f"CABINET#{start_date[:4]}",
                'CandidateIndexPK': person_id,
                'CandidateIndexSK': f"MINISTRY#{start_date}"
            })
        
    print("\n--- Summary ---")
    if dry_run:
        print("Status: DRY RUN COMPLETED")
    else:
        print("Status: CSV Import COMPLETE")
        
    if persons_not_found:
        print(f"\nWARNING: {len(persons_not_found)} persons could not be matched in the database:")
        for p in persons_not_found:
            print(f"  - {p}")
    else:
        print("\nAll persons matched successfully!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import Cabinet History from CSV")
    parser.add_argument("file", help="Path to the CSV file")
    parser.add_argument("--dry-run", action="store_true", help="Run without writing to the database")
    args = parser.parse_args()
    
    import_csv(args.file, dry_run=args.dry_run)
