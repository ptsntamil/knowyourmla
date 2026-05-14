#!/usr/bin/env python3

"""
Generate OpenCity Format Election Results (2026)
==============================================

This script transforms the raw 2026 results CSV into the OpenCity format,
enriching it with constituency-level data from DynamoDB.

Source: scraper/assets/tn-results-2026.csv
Output: scraper/assets/OpenCity_TN_Assembly_Election_2026.csv
"""

import csv
import os
import sys
import json
import logging
from decimal import Decimal
from typing import Dict, Any, List

import boto3
from botocore.exceptions import ClientError

# Set up local imports
sys.path.append(os.path.dirname(__file__))
from utils import canonicalize_constituency

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("opencity_generator_2026")

# DynamoDB Configuration
REGION_NAME = "ap-south-2"
CONSTITUENCIES_TABLE_NAME = "knowyourmla_constituencies"

# AWS Credentials (provided by user)
os.environ["AWS_DEFAULT_REGION"] = REGION_NAME

class OpenCityResultsGenerator:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
        self.table = self.dynamodb.Table(CONSTITUENCIES_TABLE_NAME)
        self.districts_map = self._load_districts()
        self.constituency_cache = {}

    def _load_districts(self) -> Dict[str, str]:
        """Loads district mapping from districts.json."""
        districts_file = os.path.join(os.path.dirname(__file__), "assets", "districts.json")
        if not os.path.exists(districts_file):
            logger.warning(f"Districts file not found: {districts_file}")
            return {}
        
        try:
            with open(districts_file, 'r') as f:
                districts_data = json.load(f)
                return {d['PK']: d['name'] for d in districts_data}
        except Exception as e:
            logger.error(f"Error loading districts: {e}")
            return {}

    def get_constituency_metadata(self, raw_name: str) -> Dict[str, Any]:
        """Fetches electors and district data for a constituency."""
        pk = canonicalize_constituency(raw_name)
        if not pk:
            return {"electors": 0, "type": "", "district": ""}
        
        if not pk.startswith("CONSTITUENCY#"):
            pk = f"CONSTITUENCY#{pk}"
        
        if pk in self.constituency_cache:
            return self.constituency_cache[pk]

        try:
            response = self.table.get_item(Key={'PK': pk, 'SK': 'METADATA'})
            if 'Item' in response:
                item = response['Item']
                stats = item.get('statistics', {}).get('2026', {})
                electors = int(stats.get('total_electors', 0))
                c_type = item.get('type', 'GEN')
                district_id = item.get('district_id', '')
                district_name = self.districts_map.get(district_id, district_id.replace('DISTRICT#', '').upper())
                
                metadata = {
                    "electors": electors,
                    "type": c_type,
                    "district": district_name
                }
                self.constituency_cache[pk] = metadata
                return metadata
        except Exception as e:
            logger.error(f"Error fetching metadata for {pk}: {e}")
        
        return {"electors": 0, "type": "", "district": ""}

    def run(self, source_csv: str, output_csv: str):
        if not os.path.exists(source_csv):
            logger.error(f"Source CSV not found: {source_csv}")
            return

        logger.info(f"Loading results from {source_csv}")
        constituency_data = {}
        
        with open(source_csv, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                ac_no = row['AC No']
                if ac_no not in constituency_data:
                    constituency_data[ac_no] = {
                        "name": row['AC Name'],
                        "candidates": []
                    }
                
                constituency_data[ac_no]['candidates'].append({
                    "name": row['Candidate'],
                    "party": row['Party'],
                    "votes": int(row['Total Votes']),
                    "vote_share": float(row['Vote Share'])
                })

        # Define OpenCity headers
        headers = [
            "State_Name", "Assembly_No", "Constituency_No", "Year", "month", "DelimID", "Poll_No",
            "Position", "Candidate", "Sex", "Party", "Votes", "Age", "Candidate_Type", "Valid_Votes",
            "Electors", "Constituency_Name", "Constituency_Type", "District_Name", "Sub_Region",
            "N_Cand", "Turnout_Percentage", "Vote_Share_Percentage", "Deposit_Lost", "Margin",
            "Margin_Percentage", "ENOP", "pid", "Party_Type_TCPD", "Party_ID", "last_poll",
            "Contested", "Last_Party", "Last_Party_ID", "Last_Constituency_Name", "Same_Constituency",
            "Same_Party", "No_Terms", "Turncoat", "Incumbent", "Recontest", "MyNeta_education",
            "TCPD_Prof_Main", "TCPD_Prof_Main_Desc", "TCPD_Prof_Second", "TCPD_Prof_Second_Desc", "Election_Type"
        ]

        logger.info(f"Generating enriched results in OpenCity format...")
        all_rows = []

        for ac_no, data in constituency_data.items():
            candidates = sorted(data['candidates'], key=lambda x: x['votes'], reverse=True)
            valid_votes = sum(c['votes'] for c in candidates)
            n_cand = len(candidates)
            metadata = self.get_constituency_metadata(data['name'])
            electors = metadata['electors']
            
            # Calculate ENOP
            sum_share_sq = sum((c['votes'] / valid_votes)**2 for c in candidates if valid_votes > 0)
            enop = round(1 / sum_share_sq, 2) if sum_share_sq > 0 else 0
            
            turnout_pct = round((valid_votes / electors * 100), 2) if electors > 0 else 0

            for i, cand in enumerate(candidates):
                pos = i + 1
                votes = cand['votes']
                
                # Margin calculation
                if pos == 1:
                    # Winner margin is difference with runner up
                    margin = votes - (candidates[1]['votes'] if n_cand > 1 else 0)
                else:
                    # Others margin is difference with next candidate (or 0 if last)
                    margin = votes - (candidates[i+1]['votes'] if pos < n_cand else 0)
                
                margin_pct = round((margin / valid_votes * 100), 2) if valid_votes > 0 else 0
                
                # Deposit Lost: fails to secure more than 1/6 (16.67%)
                deposit_lost = "yes" if (votes / valid_votes) <= (1/6) else "no"
                
                candidate_name = cand['name']
                if candidate_name == 'NOTA':
                    candidate_name = 'None Of The Above'

                row = {
                    "State_Name": "Tamil_Nadu",
                    "Assembly_No": 13,
                    "Constituency_No": ac_no,
                    "Year": 2026,
                    "month": 5,
                    "DelimID": 4,
                    "Poll_No": 0,
                    "Position": pos,
                    "Candidate": candidate_name,
                    "Sex": "",
                    "Party": cand['party'],
                    "Votes": votes,
                    "Age": 0,
                    "Candidate_Type": "",
                    "Valid_Votes": valid_votes,
                    "Electors": electors,
                    "Constituency_Name": data['name'],
                    "Constituency_Type": metadata['type'],
                    "District_Name": metadata['district'],
                    "Sub_Region": "",
                    "N_Cand": n_cand,
                    "Turnout_Percentage": turnout_pct,
                    "Vote_Share_Percentage": cand['vote_share'],
                    "Deposit_Lost": deposit_lost,
                    "Margin": margin,
                    "Margin_Percentage": margin_pct,
                    "ENOP": enop,
                    "pid": "",
                    "Party_Type_TCPD": "",
                    "Party_ID": 0,
                    "last_poll": "TRUE",
                    "Contested": 1,
                    "Last_Party": "",
                    "Last_Party_ID": 0,
                    "Last_Constituency_Name": "",
                    "Same_Constituency": "",
                    "Same_Party": "",
                    "No_Terms": 0,
                    "Turncoat": "FALSE",
                    "Incumbent": "FALSE",
                    "Recontest": "FALSE",
                    "MyNeta_education": "",
                    "TCPD_Prof_Main": "",
                    "TCPD_Prof_Main_Desc": "",
                    "TCPD_Prof_Second": "",
                    "TCPD_Prof_Second_Desc": "",
                    "Election_Type": "State Assembly Election (AE)"
                }
                all_rows.append(row)

        with open(output_csv, mode='w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(all_rows)

        logger.info(f"Successfully generated {output_csv} with {len(all_rows)} rows.")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    source = os.path.join(script_dir, "assets", "tn-results-2026.csv")
    output = os.path.join(script_dir, "assets", "OpenCity_TN_Assembly_Election_2026.csv")
    
    generator = OpenCityResultsGenerator()
    generator.run(source, output)

if __name__ == "__main__":
    main()
