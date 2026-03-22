import pytest
from unittest.mock import MagicMock, patch
from decimal import Decimal
import os
import sys

# Set up local imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from enrichment import IdentityResolver, AffidavitData

@pytest.fixture
def mock_resolver():
    # Pass a MagicMock that acts like the DynamoDB resource
    mock_db = MagicMock()
    # Mock the Table method to return further mocks
    mock_db.Table.return_value = MagicMock()
    
    resolver = IdentityResolver(mock_db)
    # Re-assign specific mocks for easier assertion
    resolver.persons_table = MagicMock()
    resolver.candidates_table = MagicMock()
    resolver.constituencies_table = MagicMock()
    return resolver

def test_fuzzy_match_missing_lastname(mock_resolver):
    # 1. Setup DB state (Existing person with lastname from Myneta)
    person_in_db = {
        'PK': 'PERSON#existing_hash',
        'SK': 'METADATA',
        'name': 'GOVINDARAJAN T.J',
        'normalized_name': 'govindarajantj',
        'lastname': 'S.V. JAYARAMAN',
        'birth_year': 1959
    }
    
    # 2. Setup Candidate history (Existing record for 2021 in GUMMIDIPOONDI)
    history = [{
        'PK': 'AFFIDAVIT#2021#1089',
        'SK': 'DETAILS',
        'person_id': 'PERSON#existing_hash',
        'year': 2021,
        'constituency_id': 'CONSTITUENCY#gummidipoondi'
    }]
    
    # Mock behavior
    mock_resolver.persons_table.scan.return_value = {'Items': []}
    mock_resolver.persons_table.query.return_value = {'Items': [person_in_db]}
    mock_resolver.persons_table.get_item.return_value = {'Item': person_in_db}
    mock_resolver.candidates_table.query.return_value = {'Items': history}
    
    # Input from TCPD (No lastname/relation)
    details = AffidavitData(
        candidate_name='GOVINDARAJAN T.J',
        age=62, # 2021 - 1959 = 62
        constituency='CONSTITUENCY#gummidipoondi', # Importer resolves this first
        tcpd_pid='AETN272719'
    )
    
    # Run resolution
    person_id = mock_resolver.get_or_create_person(details, '2021', cid=0)
    
    # 3. Verify match
    # 'GOVINDARAJAN TJ' phonetically simplified becomes 'koantarasan' in our utils.strip_initials
    assert person_id == 'PERSON#existing_hash'
    # Ensure metadata update was called (to add tcpd_pid)
    mock_resolver.persons_table.update_item.assert_called()
    update_call = mock_resolver.persons_table.update_item.call_args[1]
    assert update_call['ExpressionAttributeValues'][':tpid'] == 'AETN272719'

def test_rejection_on_constituency_mismatch(mock_resolver):
    # Ensure that even if name matches, different seat in same year is a different person
    person_in_db = {
        'PK': 'PERSON#existing_hash',
        'SK': 'METADATA',
        'name': 'STALIN',
        'normalized_name': 'stalin',
        'lastname': 'KARUNANIDHI'
    }
    
    history = [{
        'PK': 'AFFIDAVIT#2021#1',
        'year': 2021,
        'constituency_id': 'CONSTITUENCY#kolathur'
    }]
    
    mock_resolver.persons_table.query.return_value = {'Items': [person_in_db]}
    mock_resolver.candidates_table.query.return_value = {'Items': history}
    
    details = AffidavitData(
        candidate_name='STALIN',
        constituency='CONSTITUENCY#tiruvarur', # Different seat!
        lastname='KARUNANIDHI'
    )
    
    with patch.object(mock_resolver, '_register_new_person') as mock_reg:
        mock_reg.return_value = 'PERSON#new_stalin'
        person_id = mock_resolver.get_or_create_person(details, '2021', cid=0)
        assert person_id == 'PERSON#new_stalin'
