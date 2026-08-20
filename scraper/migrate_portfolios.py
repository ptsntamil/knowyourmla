import boto3
import time
import uuid

# Configure boto3
dynamodb = boto3.resource('dynamodb', region_name='ap-south-2')
portfolios_table = dynamodb.Table('knowyourmla_portfolios')
persons_table = dynamodb.Table('knowyourmla_persons')

def run_migration():
    print("Fetching all PORTFOLIO_ASSIGNMENT records...")
    
    # 1. Scan for all assignments
    response = portfolios_table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr('entity_type').eq('PORTFOLIO_ASSIGNMENT')
    )
    assignments = response.get('Items', [])
    while 'LastEvaluatedKey' in response:
        response = portfolios_table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('entity_type').eq('PORTFOLIO_ASSIGNMENT'),
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        assignments.extend(response.get('Items', []))
        
    print(f"Found {len(assignments)} assignment records.")
    
    # Group by person_id + start_date to create Ministry History
    ministry_groups = {}
    for assign in assignments:
        person_id = assign.get('person_id')
        start_date = assign.get('start_date')
        if not person_id or not start_date:
            continue
            
        group_key = f"{person_id}_{start_date}"
        if group_key not in ministry_groups:
            ministry_groups[group_key] = {
                'person_id': person_id,
                'candidate_id': assign.get('candidate_id'),
                'start_date': start_date,
                'designation': assign.get('designation', 'Minister'),
                'end_date': assign.get('end_date'),
                'is_active': assign.get('is_active', False),
                'portfolios': []
            }
        
        # Portfolio string Name
        # We can extract portfolio name from PK (PORTFOLIO#name) but we need the display name.
        # Let's get display name by querying the METADATA record for the portfolio.
        # But to save read capacity, we can just use the normalized name for now or query it later.
        # Actually, the ASSIGNMENT record might not have the display name. We'll use the normalized PK.
        portfolio_pk = assign.get('PK')
        normalized_name = portfolio_pk.replace("PORTFOLIO#", "") if portfolio_pk else ""
        ministry_groups[group_key]['portfolios'].append(normalized_name)
        
        # Create PORTFOLIO_HISTORY record
        port_hist_id = f"PORTFOLIO_HIST#{normalized_name}_{start_date}_{person_id.replace('PERSON#', '')}"
        
        print(f"Creating Portfolio History: {port_hist_id}")
        portfolios_table.put_item(Item={
            'PK': port_hist_id,
            'SK': 'METADATA',
            'entity_type': 'PORTFOLIO_HISTORY',
            'portfolio_name': normalized_name, # We will use normalized name, frontend can map it or we can fetch real name
            'minister_id': person_id,
            'start_date': start_date,
            'end_date': assign.get('end_date'),
            'cabinet_event': 'Cabinet Formation',
            'government': '16th Assembly',
            'chief_minister': 'M.K. STALIN',
            'CandidateIndexPK': portfolio_pk, # We reuse the CandidateIndex? No, we need a PortfolioIndex. Let's use PK/SK combo.
            # Actually, to make getPortfolioTimeline work:
            # "PK = :pk AND begins_with(SK, :skPrefix)" where pk=PORTFOLIO#{name}, skPrefix=PORTFOLIO_HISTORY#
        })
        
        # Better approach for PORTFOLIO_HISTORY to match getPortfolioTimeline:
        # We put it directly under the portfolio PK
        portfolios_table.put_item(Item={
            'PK': portfolio_pk,
            'SK': f"PORTFOLIO_HISTORY#{start_date}#{person_id}",
            'entity_type': 'PORTFOLIO_HISTORY',
            'portfolio_name': normalized_name,
            'minister_id': person_id,
            'start_date': start_date,
            'end_date': assign.get('end_date'),
            'cabinet_event': 'Cabinet Formation',
            'government': '16th Assembly',
            'chief_minister': 'M.K. STALIN'
        })
        
    print("Creating Ministry History records...")
    for group_key, data in ministry_groups.items():
        person_id = data['person_id']
        start_date = data['start_date']
        
        # Find real names of portfolios if needed, but for now we store normalized array
        
        ministry_id = f"MINISTRY#{start_date}_{person_id.replace('PERSON#', '')}"
        print(f"Creating Ministry History: {ministry_id}")
        
        portfolios_table.put_item(Item={
            'PK': ministry_id,
            'SK': 'METADATA',
            'entity_type': 'MINISTRY_HISTORY',
            'person_id': person_id,
            'candidate_id': data['candidate_id'],
            'portfolio_names': data['portfolios'],
            'designation': data['designation'],
            'chief_minister': 'M.K. STALIN',
            'government': '16th Assembly',
            'start_date': start_date,
            'end_date': data['end_date'],
            'is_additional_charge': False,
            'cabinet_event': 'Cabinet Formation',
            'cabinet_id': 'CABINET#2021',
            # GSI for getMinistryHistory
            'CandidateIndexPK': person_id,
            'CandidateIndexSK': f"MINISTRY#{start_date}"
        })
        
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()
