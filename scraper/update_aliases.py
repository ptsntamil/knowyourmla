import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='ap-south-2')
table = dynamodb.Table('knowyourmla_districts')

# Mappings of the correct PK string to the list of incorrect spellings / aliases
ALIASES = {
    'DISTRICT#kancheepuram': ['kanchipuram'],
    'DISTRICT#thiruvallur': ['tiruvallur'],
    'DISTRICT#thiruvarur': ['tiruvarur'],
    'DISTRICT#kanniyakumari': ['kanyakumari'],
    'DISTRICT#tiruchirappalli': ['trichy'],
    'DISTRICT#villuppuram': ['villupuram'],
    'DISTRICT#tirupathur': ['tirupattur'],
    'DISTRICT#thenilgiris': ['nilgiris', 'niligiris']
}

def update_aliases():
    print("Updating aliases in DynamoDB...")
    
    # 1. Update DynamoDB
    for pk, aliases in ALIASES.items():
        try:
            table.update_item(
                Key={'PK': pk, 'SK': 'METADATA'},
                UpdateExpression="SET alias = :aliases",
                ExpressionAttributeValues={':aliases': aliases}
            )
            print(f"Updated {pk} with aliases {aliases}")
        except Exception as e:
            print(f"Failed to update {pk}: {e}")

    # 2. Update assets/districts.json
    print("\nUpdating assets/districts.json...")
    with open('scraper/assets/districts.json', 'r') as f:
        core_districts = json.load(f)
        
    for cd in core_districts:
        pk = cd['PK']
        if pk in ALIASES:
            # Avoid duplicating if already present
            existing = set(cd.get('alias', []))
            for a in ALIASES[pk]:
                existing.add(a)
            cd['alias'] = list(existing)
            
    with open('scraper/assets/districts.json', 'w') as f:
        json.dump(core_districts, f, indent=2)
        
    print("Alias update completed.")

if __name__ == '__main__':
    update_aliases()
