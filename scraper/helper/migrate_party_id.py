#!/usr/bin/env python3

import boto3
import argparse
import sys
import os
from typing import List, Dict

# Add the current directory to sys.path to import normalize_name from utils
sys.path.append(os.path.join(os.path.dirname(__file__)))
from utils import normalize_name

REGION_NAME = "ap-south-2"
PARTIES_TABLE = "knowyourmla_political_parties"
CANDIDATES_TABLE = "knowyourmla_candidates"
LEGACY_TABLE = "tn_political_data"

class PartyMigrator:
    def __init__(self, region: str = REGION_NAME):
        self.dynamodb = boto3.resource("dynamodb", region_name=region)
        self.parties_table = self.dynamodb.Table(PARTIES_TABLE)
        self.party_lookup = self._load_parties()

    def _load_parties(self) -> Dict[str, str]:
        """Load all parties from DynamoDB into an in-memory lookup map."""
        print("Loading political parties for resolution...")
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
                    
            print(f"Loaded {len(items)} parties ({len(lookup)} lookup keys)")
        except Exception as e:
            print(f"Error loading parties: {e}")
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

    def migrate_table(self, table_name: str, dry_run: bool = True):
        print(f"\nScanning table: {table_name}")
        table = self.dynamodb.Table(table_name)
        
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
                
                # Check for "party" field
                party = item.get("party")
                party_id = item.get("party_id")
                
                if party and not party_id:
                    new_party_id = self.resolve_party_id(party)
                    
                    print(f"  [{updated+1}] Updating {pk} | {sk}: {party} -> {new_party_id}")
                    
                    if not dry_run:
                        try:
                            # Also handles legacy single table where ET might be different
                            # but keys are always PK/SK
                            table.update_item(
                                Key={"PK": pk, "SK": sk},
                                UpdateExpression="SET party_id = :p REMOVE party",
                                ExpressionAttributeValues={":p": new_party_id}
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
    parser = argparse.ArgumentParser(description="Migrate 'party' field to 'party_id' in DynamoDB tables.")
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

    migrator = PartyMigrator()
    
    tables_to_migrate = [args.table] if args.table else [CANDIDATES_TABLE, LEGACY_TABLE]
    
    for table_name in tables_to_migrate:
        try:
            migrator.migrate_table(table_name, dry_run=dry_run)
        except Exception as e:
            print(f"Error processing table {table_name}: {e}")

if __name__ == "__main__":
    main()
