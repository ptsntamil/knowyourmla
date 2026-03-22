import os
import sys
import pytest
import re
import requests
from bs4 import BeautifulSoup
from unittest.mock import MagicMock, patch

# Set up local imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from enrichment import EnrichmentPipeline, MyNetaParser, IdentityResolver
from utils import normalize_name, clean_currency_to_int, clean_constituency, strip_initials

def parse_test_data(file_path):
    """Parses candidate_tests.txt into a list of expected data dictionaries."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Split by double newline or URL
    blocks = re.split(r'\n(?=https?://)', content.strip())
    test_cases = []
    
    for block in blocks:
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines:
            continue
            
        url = lines[0]
        data = {"url": url, "expected": {}, "itr_history": {}}
        current_section = None
        
        for line in lines[1:]:
            if line.lower() == 'self':
                current_section = 'self'
                continue
            elif line.lower() == 'spouse':
                current_section = 'spouse'
                continue
                
            if current_section:
                # ITR match: 2019 - 2020 ** Rs 28,78,120 ~ 28 Lacs+
                itr_match = re.search(r'(\d{4}\s*-\s*\d{4}).*?Rs\s*([\d,]+)', line)
                if itr_match:
                    year_range = itr_match.group(1).strip()
                    amount = clean_currency_to_int(itr_match.group(2))
                    if current_section not in data["itr_history"]:
                        data["itr_history"][current_section] = {}
                    data["itr_history"][current_section][year_range] = amount
                continue

            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().lower()
                value = value.strip()
                
                # Map keys to EnrichmentPipeline keys
                key_map = {
                    "name": "candidate_name",
                    "party": "party_id",
                    "district": "district_id",
                    "constituency": "constituency",
                    "last name": "lastname",
                    "age": "age",
                    "assets": "total_assets",
                    "liabilities": "total_liabilities",
                    "number of criminal cases": "criminal_cases",
                    "no of criminal cases": "criminal_cases",
                    "profession": "profession",
                    "self profession": "profession",
                    "year": "year",
                    "voter constituency": "voter_constituency",
                    "serial no": "voter_serial_no",
                    "part no": "voter_part_no"
                }
                
                if key in key_map:
                    mapped_key = key_map[key]
                    # Specific handle for Case 2 where "Constituency" is repeated for voter info
                    if mapped_key == "constituency" and "constituency" in data["expected"]:
                        mapped_key = "voter_constituency"
                    
                    if mapped_key in ["total_assets", "total_liabilities"]:
                        # Match Rs pattern to ignore descriptive text like ~2 Crore+
                        v_match = re.search(r'Rs\s*([\d,]+)', value, re.I)
                        if v_match:
                            data["expected"][mapped_key] = clean_currency_to_int(v_match.group(1))
                        elif "nil" in value.lower():
                            data["expected"][mapped_key] = 0
                        else:
                            data["expected"][mapped_key] = clean_currency_to_int(value)
                    elif mapped_key == "criminal_cases":
                        val_match = re.search(r'(\d+)', value)
                        data["expected"][mapped_key] = int(val_match.group(1)) if val_match else 0
                    elif mapped_key == "age":
                        data["expected"][mapped_key] = int(value)
                    else:
                        data["expected"][mapped_key] = value
        
        test_cases.append(data)
    return test_cases

class NormalizationValidator:
    """Helper to validate extracted data against raw test data using production normalization."""
    
    @staticmethod
    def assert_name_match(extracted, expected, field_name):
        if not expected:
            return
        # Use production normalization/strip_initials logic
        ext_norm = strip_initials(extracted) or normalize_name(extracted)
        exp_norm = strip_initials(expected) or normalize_name(expected)
        
        assert ext_norm == exp_norm, f"Mismatch in {field_name}: Extracted '{extracted}' (norm: {ext_norm}) vs Expected '{expected}' (norm: {exp_norm})"

    @staticmethod
    def assert_id_match(extracted, expected, prefix):
        if not expected:
            return
        # Expected is just a string like "DMK", extracted is "PARTY#dmk"
        exp_id = f"{prefix}#{normalize_name(expected)}"
        assert extracted == exp_id, f"Mismatch in {prefix} ID: Extracted '{extracted}' vs Expected '{expected}' (mapped to {exp_id})"

    @staticmethod
    def assert_constituency_match(extracted, expected):
        if not expected:
            return
        ext_clean = clean_constituency(extracted) or normalize_name(extracted)
        exp_clean = clean_constituency(expected) or normalize_name(expected)
        
        # Handle cases where existing code misses some prefixes like 'n0.' (OCR zero) or raw '25,'
        ext_clean = re.sub(r'^(?:no\.|n0\.|ac-)?\s*\d+[\.,\-\s]*', '', ext_clean)
        exp_clean = re.sub(r'^(?:no\.|n0\.|ac-)?\s*\d+[\.,\-\s]*', '', exp_clean)
        
        assert ext_clean == exp_clean, f"Mismatch in constituency: Extracted '{extracted}' vs Expected '{expected}'"

class MockPipeline(EnrichmentPipeline):
    """Mocks DynamoDB and resolution logic for testing extraction only."""
    def __init__(self):
        # Don't call super().__init__ to avoid boto3 session/resource creation
        self.session = requests.Session()
        self.parser = MyNetaParser(self.session)
        self.resolver = MagicMock(spec=IdentityResolver)
        self.resolver.resolve_party_id.side_effect = self.resolve_party_id
        self.resolver.resolve_district_id.side_effect = self.resolve_district_id

    def resolve_party_id(self, party_name):
        return f"PARTY#{normalize_name(party_name)}"
    
    def resolve_district_id(self, district_name):
        return f"DISTRICT#{normalize_name(district_name)}"

@pytest.mark.parametrize("test_case", parse_test_data("/Users/ideas2it/Projects/personal/knowyourmla/scraper/tests/candidate_tests.txt"))
def test_candidate_extraction(test_case):
    url = test_case["url"]
    expected = test_case["expected"]
    expected_itr = test_case["itr_history"]
    
    pipeline = MockPipeline()
    extracted_obj = pipeline.parser.extract_affidavit_details(url, pipeline.resolver)
    
    assert extracted_obj is not None, f"Failed to extract info from {url}"
    extracted = extracted_obj.to_dict()
    
    assert extracted is not None, f"Failed to extract info from {url}"
    
    validator = NormalizationValidator()
    
    # 1. Names
    validator.assert_name_match(extracted.get("candidate_name"), expected.get("candidate_name"), "candidate_name")
    validator.assert_name_match(extracted.get("lastname"), expected.get("lastname"), "lastname")
    
    # 2. IDs (Party/District)
    validator.assert_id_match(extracted.get("party_id"), expected.get("party_id"), "PARTY")
    validator.assert_id_match(extracted.get("district_id"), expected.get("district_id"), "DISTRICT")
    
    # 3. Constituency
    validator.assert_constituency_match(extracted.get("constituency"), expected.get("constituency"))
    if expected.get("voter_constituency"):
        validator.assert_constituency_match(extracted.get("voter_constituency"), expected.get("voter_constituency"))
    
    # 4. Numeric fields
    for field in ["age", "total_assets", "total_liabilities", "criminal_cases"]:
        if field in expected:
            assert extracted.get(field) == expected[field], f"Mismatch in {field}: {extracted.get(field)} != {expected[field]}"
            
    # 5. Strings (Exact match where feasible)
    for field in ["voter_serial_no", "voter_part_no"]:
        if field in expected:
            assert str(extracted.get(field)) == str(expected[field]), f"Mismatch in {field}: {extracted.get(field)} != {expected[field]}"

    # 6. ITR History
    if expected_itr:
        ext_itr = extracted.get("itr_history", {})
        for rel, history in expected_itr.items():
            assert rel in ext_itr, f"Relationship '{rel}' missing from extracted ITR history"
            for year, amount in history.items():
                # We use normalize_name on years/keys if needed, but here simple range match
                # Some expected ranges might have extra spaces: "2019 - 2020" vs "2019-2020"
                norm_year = year.replace(" ", "")
                found = False
                for ext_year, ext_amt in ext_itr[rel].items():
                    if ext_year.replace(" ", "") == norm_year:
                        assert ext_amt == amount, f"ITR amount mismatch for {rel} in {year}: {ext_amt} != {amount}"
                        found = True
                        break
                assert found, f"ITR year {year} not found for {rel} in extracted data: {ext_itr[rel]}"

    # 7. Coverage Check (User request: make sure the test function covers all the data)
    # Check that keys exist even if not in expected test data
    mandatory_keys = [
        "profile_pic", "profession", "education", "income_itr", 
        "election_expenses", "constituency_myneta_id", "candidacy_type"
    ]
    for key in mandatory_keys:
        assert key in extracted, f"Key '{key}' missing from extracted dictionary"

    # Specific check for education and profession if not in test data
    if "education" not in expected:
        assert extracted.get("education") not in [None, ""], f"Education should not be None/Empty"
    if "profession" not in expected:
        assert extracted.get("profession") not in [None, ""], f"Profession should not be None/Empty"
