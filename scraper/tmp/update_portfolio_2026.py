import boto3
import os

def migrate_2026():
    # Initialize DynamoDB client
    region = os.getenv('AWS_REGION', 'ap-south-2')
    dynamodb = boto3.resource('dynamodb', region_name=region)
    table_name = os.getenv('PORTFOLIOS_TABLE', 'knowyourmla_portfolios')
    portfolios_table = dynamodb.Table(table_name)

    print(f"Scanning table {table_name} for PORTFOLIO_HISTORY items...")
    
    # We will scan the table for entity_type == 'PORTFOLIO_HISTORY'
    response = portfolios_table.scan(
        FilterExpression="entity_type = :type",
        ExpressionAttributeValues={
            ":type": "PORTFOLIO_HISTORY"
        }
    )
    items = response.get('Items', [])
    while 'LastEvaluatedKey' in response:
        response = portfolios_table.scan(
            FilterExpression="entity_type = :type",
            ExpressionAttributeValues={
                ":type": "PORTFOLIO_HISTORY"
            },
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        items.extend(response.get('Items', []))

    print(f"Found {len(items)} PORTFOLIO_HISTORY items.")
    
    updated_count = 0
    for item in items:
        pk = item['PK']
        sk = item['SK']
        
        needs_update = False
        new_pk = pk
        new_sk = sk
        
        # Check if PK or SK contains '2021-05-07'
        if '2021-05-07' in pk or '2021-05-07' in sk:
            needs_update = True
            new_pk = pk.replace('2021-05-07', '2026-05-07')
            new_sk = sk.replace('2021-05-07', '2026-05-07')
            
        if needs_update:
            new_item = item.copy()
            new_item['PK'] = new_pk
            new_item['SK'] = new_sk
            new_item['start_date'] = '2026-05-07'
            new_item['chief_minister'] = 'C. Joseph Vijay'
            new_item['government'] = '17th Assembly'
            
            # Also update 'id' if it exists and contains the date
            if 'id' in new_item and '2021-05-07' in new_item['id']:
                new_item['id'] = new_item['id'].replace('2021-05-07', '2026-05-07')
                
            print(f"\nProcessing record for: {new_item.get('portfolio_name')} - {new_item.get('minister_id')}")
            
            # Put new item first
            print(f"  Creating new item: PK={new_pk}, SK={new_sk}")
            portfolios_table.put_item(Item=new_item)
            
            # Delete old item
            print(f"  Deleting old item: PK={pk}, SK={sk}")
            portfolios_table.delete_item(Key={'PK': pk, 'SK': sk})
            
            updated_count += 1
            
    print(f"\nMigration complete. Replaced {updated_count} items with 2026 data.")

if __name__ == "__main__":
    migrate_2026()
