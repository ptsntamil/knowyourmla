import csv
import logging
import argparse
import sys
import os
import boto3
from typing import Dict, List, Optional
from decimal import Decimal
from collections import defaultdict

# Add parent directory to path to import local modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("expenditure_importer")

TABLE_NAME = "knowyourmla_election_expenditures"

def clean_amount(val: str) -> Optional[int]:
    if not val or val.strip().lower() in ["", "none", "null", "nan", "na"]:
        return None
    try:
        return int(float(val.replace(",", "").strip()))
    except ValueError:
        return None

def normalize_party_id(party_short: str) -> str:
    party_map = {
        "DMK": "dmk",
        "AIADMK": "aiadmk",
        "BJP": "bjp",
        "NTK": "ntk",
        "BSP": "bsp",
        "CPI(M)": "cpim",
        "CPI(ML) Liberation": "cpimlliberation",
        "TVK": "tvk"
    }
    normalized = party_map.get(party_short, party_short.lower().replace(" ", "").replace("(", "").replace(")", "").replace("-", ""))
    return f"PARTY#{normalized}"

def main():
    parser = argparse.ArgumentParser(description="Import Election Expenditure data into DynamoDB")
    parser.add_argument("--report-csv", required=True, help="Path to report CSV")
    parser.add_argument("--category-csv", required=True, help="Path to category CSV")
    parser.add_argument("--election-id", default="ELECTION#2026#ASSEMBLY#GENERAL", help="Election ID to use")
    parser.add_argument("--region", default="ap-south-2", help="AWS Region")
    parser.add_argument("--dry-run", action="store_true", help="Do not write to DynamoDB")
    parser.add_argument("--force", action="store_true", help="Force overwrite existing records")

    args = parser.parse_args()

    dynamodb = boto3.resource('dynamodb', region_name=args.region)
    table = dynamodb.Table(TABLE_NAME)
    
    # Check if table exists (for dry run / validation)
    if not args.dry_run:
        try:
            table.table_status
        except Exception as e:
            logger.error(f"Failed to access table {TABLE_NAME}: {e}")
            logger.info("Skipping write due to table access error")
            args.dry_run = True

    # 1. Parse Reports
    reports = {}
    with open(args.report_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            party_short = row["party_short"].strip()
            party_id = normalize_party_id(party_short)
            
            reports[party_id] = {
                "party_short": party_short,
                "party_full": row["party_full"].strip(),
                "report_scope": row["report_scope"].strip(),
                "reported_total_rs": clean_amount(row["reported_total_rs"]),
                "general_propaganda_rs": clean_amount(row["general_propaganda_rs"]),
                "candidate_expenditure_rs": clean_amount(row["candidate_expenditure_rs"]),
                "source_type": row["source_type"].strip(),
                "data_quality_note": row["data_quality_note"].strip(),
                "calculated_category_total_rs": 0,
                "categories": []
            }

    # 2. Parse Categories
    with open(args.category_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            party_short = row["party_short"].strip()
            party_id = normalize_party_id(party_short)
            
            if party_id not in reports:
                logger.warning(f"Category row found for party {party_short} not in report CSV. Skipping.")
                continue

            amount = clean_amount(row["amount_rs"])
            if amount is not None:
                reports[party_id]["calculated_category_total_rs"] += amount
                
            cat_name = row["category"].strip()
            cat_id = cat_name.lower().replace(" ", "-").replace("/", "-").replace("&", "and")
            
            reports[party_id]["categories"].append({
                "category_id": cat_id,
                "category_name": cat_name,
                "display_category_name": cat_name,
                "expenditure_group": row["expenditure_group"].strip(),
                "amount_rs": amount,
                "source_section": row["source_section"].strip()
            })

        # Validation & DB Generation
    if not args.dry_run:
        # Use batch_writer for efficient bulk inserts
        with table.batch_writer() as batch:
            for party_id, data in reports.items():
                election_id = args.election_id
                pk = f"EXPENDITURE#{election_id}#{party_id}"
                
                reported_total = data["reported_total_rs"]
                calculated_total = data["calculated_category_total_rs"]
                
                reconciliation_difference = None
                if reported_total is not None:
                    reconciliation_difference = calculated_total - reported_total
                    if reconciliation_difference != 0:
                        logger.warning(f"Reconciliation difference for {data['party_short']}: Reported {reported_total}, Calculated {calculated_total}, Diff {reconciliation_difference}")
                
                # Build Report Item
                report_item = {
                    "PK": pk,
                    "SK": "REPORT",
                    "entity_type": "EXPENDITURE_REPORT",
                    "party_id": party_id,
                    "party_short": data["party_short"],
                    "party_full": data["party_full"],
                    "election_id": election_id,
                    "year": 2026,
                    "election_type": "Assembly",
                    "election_category": "General",
                    "state_id": "STATE#tamilnadu",
                    "report_scope": data["report_scope"],
                    "reported_total_rs": reported_total,
                    "general_propaganda_rs": data["general_propaganda_rs"],
                    "candidate_expenditure_rs": data["candidate_expenditure_rs"],
                    "calculated_category_total_rs": calculated_total,
                    "reconciliation_difference_rs": reconciliation_difference,
                    "source_type": data["source_type"],
                    "data_quality_note": data["data_quality_note"]
                }
                
                # Remove Nones
                report_item = {k: v for k, v in report_item.items() if v is not None}
                
                logger.info(f"Upserting Report for {data['party_short']}")
                batch.put_item(Item=report_item)
                    
                # Build Category Items
                for cat in data["categories"]:
                    amount = cat["amount_rs"]
                    
                    ratio_of_total = None
                    if reported_total and amount is not None:
                        val = (Decimal(amount) / Decimal(reported_total)) * 100
                        ratio_of_total = Decimal(str(round(float(val), 2)))
                        
                    ratio_of_gp = None
                    if data["general_propaganda_rs"] and amount is not None and cat["expenditure_group"] == "GENERAL_PROPAGANDA":
                        val = (Decimal(amount) / Decimal(data["general_propaganda_rs"])) * 100
                        ratio_of_gp = Decimal(str(round(float(val), 2)))

                    amount_lakh = Decimal(str(round(amount / 100000.0, 2))) if amount is not None else None
                    amount_crore = Decimal(str(round(amount / 10000000.0, 2))) if amount is not None else None
                    
                    cat_item = {
                        "PK": pk,
                        "SK": f"CATEGORY#{cat['category_id']}",
                        "category_id": cat["category_id"],
                        "category_name": cat["category_name"],
                        "display_category_name": cat["display_category_name"],
                        "expenditure_group": cat["expenditure_group"],
                        "amount_rs": amount,
                        "amount_lakh": amount_lakh,
                        "amount_crore": amount_crore,
                        "ratio_of_total_pct": ratio_of_total,
                        "ratio_of_general_propaganda_pct": ratio_of_gp,
                        "source_section": cat["source_section"],
                        "reported_or_calculated": "REPORTED" if amount is not None else "NOT_DISCLOSED"
                    }
                    
                    cat_item = {k: v for k, v in cat_item.items() if v is not None}
                    batch.put_item(Item=cat_item)
    else:
        # Dry run logic (just log and warn)
        for party_id, data in reports.items():
            election_id = args.election_id
            pk = f"EXPENDITURE#{election_id}#{party_id}"
            
            reported_total = data["reported_total_rs"]
            calculated_total = data["calculated_category_total_rs"]
            
            reconciliation_difference = None
            if reported_total is not None:
                reconciliation_difference = calculated_total - reported_total
                if reconciliation_difference != 0:
                    logger.warning(f"Reconciliation difference for {data['party_short']}: Reported {reported_total}, Calculated {calculated_total}, Diff {reconciliation_difference}")
            
            logger.info(f"Upserting Report for {data['party_short']} (dry run)")
                
    logger.info("Import completed.")

if __name__ == "__main__":
    main()
