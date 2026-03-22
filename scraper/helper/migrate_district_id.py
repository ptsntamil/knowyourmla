#!/usr/bin/env python3

import boto3
import argparse
import sys
import os
from typing import List

# Add the current directory to sys.path to import normalize_name from utils
sys.path.append(os.path.join(os.path.dirname(__file__)))
from utils import normalize_name

REGION_NAME = "ap-south-2"
TABLES = [
    "knowyourmla_constituencies",
    "knowyourmla_candidates",
    "tn_political_data"
]

def migrate_table(table_name: str, dry_run: bool = True):
    print(f"\nScanning table: {table_name}")
    dynamodb = boto3.resource("dynamodb", region_name=REGION_NAME)
    table = dynamodb.Table(table_name)
    
    count = 0
    updated = 0
    
    # Scan with pagination
    response = table.scan()
    items = response.get("Items", [])
    
    while True:
        for item in items:
            count += 1
            pk = item.get("PK")
            sk = item.get("SK")
            district = item.get("district")
            district_id = item.get("district_id")
            
            # If district exists but district_id doesn't (or we want to overwrite)
            if district and not district_id:
                norm_dist = normalize_name(district)
                new_dist_id = f"DISTRICT#{norm_dist}"
                
                print(f"  [{updated+1}] Updating {pk} | {sk}: {district} -> {new_dist_id}")
                
                if not dry_run:
                    try:
                        table.update_item(
                            Key={"PK": pk, "SK": sk},
                            UpdateExpression="SET district_id = :d REMOVE district",
                            ExpressionAttributeValues={":d": new_dist_id}
                        )
                    except Exception as e:
                        print(f"    Error updating {pk}: {e}")
                        continue
                
                updated += 1
        
        if "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items = response.get("Items", [])
        else:
            break
            
    print(f"Finished {table_name}: Scanned {count} items, {'Identified' if dry_run else 'Updated'} {updated} items.")

def main():
    parser = argparse.ArgumentParser(description="Migrate 'district' field to 'district_id' in DynamoDB tables.")
    parser.add_argument("--dry-run", action="store_true", help="Perform a dry run without modifying data.")
    parser.add_argument("--execute", action="store_true", help="Actually perform the migration.")
    parser.add_argument("--table", type=str, help="Specific table to migrate (optional).")
    
    args = parser.parse_args()
    
    if not args.dry_run and not args.execute:
        print("Please specify either --dry-run or --execute.")
        sys.exit(1)
        
    dry_run = args.dry_run
    if args.execute:
        dry_run = False
        print("!!! REAL MIGRATION MODE: DATA WILL BE MODIFIED !!!")
        confirm = input("Are you sure you want to proceed? (yes/no): ")
        if confirm.lower() != "yes":
            print("Migration aborted.")
            sys.exit(0)

    tables_to_migrate = [args.table] if args.table else TABLES
    
    for table_name in tables_to_migrate:
        try:
            migrate_table(table_name, dry_run=dry_run)
        except Exception as e:
            print(f"Error processing table {table_name}: {e}")

if __name__ == "__main__":
    main()
