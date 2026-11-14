import pytest
import os
import sys

# Add parent directory to path to import local modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.import_election_expenditure import clean_amount, normalize_party_id

def test_clean_amount():
    assert clean_amount("1,234") == 1234
    assert clean_amount("0") == 0
    assert clean_amount(" None ") is None
    assert clean_amount("") is None
    assert clean_amount("12,34,567.0") == 1234567

def test_normalize_party_id():
    assert normalize_party_id("DMK") == "PARTY#dmk"
    assert normalize_party_id("AIADMK") == "PARTY#aiadmk"
    assert normalize_party_id("CPI(M)") == "PARTY#cpim"
    assert normalize_party_id("CPI(ML) Liberation") == "PARTY#cpimlliberation"
    assert normalize_party_id("TVK") == "PARTY#tvk"
    assert normalize_party_id("Unknown Party") == "PARTY#unknownparty"
