import pytest
import csv
from unittest.mock import MagicMock, patch
from decimal import Decimal
import os
import sys

# Set up local imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from import_election_csv import ElectionCSVImporter
from enrichment import AffidavitData

@pytest.fixture
def mock_importer():
    with patch('boto3.resource') as mock_resource:
        importer = ElectionCSVImporter(region="ap-south-2")
        importer.candidates_table = MagicMock()
        importer.candidates_table.query.return_value = {'Items': []} # Default: no existing candidates
        importer.constituencies_table = MagicMock()
        importer.constituencies_table.get_item.return_value = {'Item': {'PK': 'PONNERI_ID', 'SK': 'METADATA'}}
        importer.persons_table = MagicMock()
        importer.persons_table.get_item.return_value = {'Item': {}}
        importer.resolver = MagicMock()
        # Mock resolver methods
        importer.resolver.get_or_create_constituency.return_value = "PONNERI_ID"
        importer.resolver.resolve_party_id.return_value = "DMK_ID"
        importer.resolver.resolve_district_id.return_value = "THIRUVALLUR_ID"
        importer.resolver.get_or_create_person.return_value = "PERSON_123"
        return importer

def test_process_row_mapping(mock_importer):
    # Sample row from TCPD CSV
    row = {
        'Year': '2021',
        'Candidate': 'DURAI CHANDRASEKAR',
        'Constituency_Name': 'PONNERI',
        'District_Name': 'THIRUVALLUR',
        'Party': 'DMK',
        'Age': '45',
        'Sex': 'M',
        'pid': 'TCPD_001',
        'Position': '1',
        'Votes': '94500',
        'Valid_Votes': '180000',
        'Margin': '10000',
        'Margin_Percentage': '5.55',
        'Incumbent': 'Yes',
        'Turncoat': 'No',
        'No_Terms': '1',
        'Candidate_Type': 'GEN'
    }

    # Run processing
    mock_importer.process_row(row, dry_run=False)

    # 1. Verify that the ConstituencyIndex was queried first to look for duplicates
    mock_importer.candidates_table.query.assert_called_once()
    query_call = mock_importer.candidates_table.query.call_args[1]
    assert query_call['IndexName'] == 'ConstituencyIndex'

    # 2. Verify Resolver Calls (candidate not found, so full resolver runs)
    mock_importer.resolver.get_or_create_constituency.assert_called_with('PONNERI', dry_run=False)
    mock_importer.resolver.resolve_party_id.assert_called_with('DMK')
    
    # 3. Verify AffidavitData creation (captured via resolver call)
    # The second arg to get_or_create_person should be the details object
    call_args = mock_importer.resolver.get_or_create_person.call_args
    details = call_args[0][0]
    dry_run_val = call_args[1].get('dry_run')
    
    assert dry_run_val is False
    assert isinstance(details, AffidavitData)
    assert details.candidate_name == 'DURAI CHANDRASEKAR'
    assert details.sex == 'M'
    assert details.tcpd_pid == 'TCPD_001'
    assert details.total_votes == 94500
    assert details.winning_margin == 10000
    assert details.margin_percentage == Decimal('5.55')
    assert details.is_incumbent is True
    assert details.is_turncoat is False

    # 4. Verify Candidate Table Update
    # Check if update_item was called with correct mappings
    # Mapping check: tv = total_votes (candidate votes), wm = winning_margin
    mock_importer.candidates_table.update_item.assert_called()
    update_call = mock_importer.candidates_table.update_item.call_args[1]
    vals = update_call['ExpressionAttributeValues']
    
    assert vals[':tv'] == 94500
    assert vals[':wm'] == 10000
    assert vals[':mp'] == Decimal('5.55')
    assert vals[':win'] is True
    assert vals[':pid'] == 'PERSON_123'
    assert vals[':cid'] == 'PONNERI_ID'

def test_process_row_existing_candidate_match(mock_importer):
    row = {
        'Year': '2021', 'Candidate': 'DURAI CHANDRASEKAR', 'Constituency_Name': 'PONNERI',
        'District_Name': 'THIRUVALLUR', 'Party': 'DMK', 'Age': '45', 'Sex': 'M',
        'pid': 'TCPD_001', 'Position': '1', 'Votes': '94500', 'Valid_Votes': '180000'
    }

    # Simulate an existing candidate in the ConstituencyIndex result
    mock_importer.candidates_table.query.return_value = {
        'Items': [{
            'PK': 'AFFIDAVIT#2021#MYNETA_ID_999',
            'person_id': 'PERSON_EXISTING_456',
            'candidate_name': 'DURAI CHANDRASEKAR',
            'party_id': 'DMK_ID',
            'year': 2021
        }]
    }

    mock_importer.process_row(row, dry_run=False)

    # Verify that the IdentityResolver was called in OVERRIDE mode
    call_args = mock_importer.resolver.get_or_create_person.call_args
    assert call_args[1].get('person_id_override') == 'PERSON_EXISTING_456'

    # Verify the Candidate update hit the EXISTING PK, not a new one
    update_call = mock_importer.candidates_table.update_item.call_args[1]
    assert update_call['Key']['PK'] == 'AFFIDAVIT#2021#MYNETA_ID_999'

def test_process_row_segregation_logic(mock_importer):
    # Verify that sex and tcpd_pid are NOT in the candidate update if we were using put_item 
    # (actually we use update_item in the script, so we check ExpressionAttributeValues)
    row = {
        'Year': '2021',
        'Candidate': 'TEST CANDIDATE',
        'Sex': 'F',
        'pid': 'PID_456',
        'Position': '2',
        'Votes': '500'
    }
    
    mock_importer.process_row(row)
    
    update_call = mock_importer.candidates_table.update_item.call_args[1]
    vals = update_call['ExpressionAttributeValues']
    
    # sex and tcpd_pid should NOT be in the candidate table values
    # They should be passed to IdentityResolver (verified in previous test)
    assert ':sex' not in vals
    assert ':tpid' not in vals
    assert ':pid' in vals # Standard Person ID Link

def test_dry_run_isolation(mock_importer):
    row = {
        'Year': '2021',
        'Candidate': 'DRY RUN CANDIDATE',
        'Constituency_Name': 'PONNERI',
        'Position': '1',
        'Votes': '100',
        'Valid_Votes': '200',
        'pid': 'DRY_001'
    }
    
    # Run with dry_run=True
    mock_importer.process_row(row, dry_run=True)
    
    # 1. Verify resolver was called with dry_run=True
    # get_or_create_constituency is called
    assert mock_importer.resolver.get_or_create_constituency.called
    assert mock_importer.resolver.get_or_create_constituency.call_args[1].get('dry_run') is True
    assert mock_importer.resolver.get_or_create_person.called
    assert mock_importer.resolver.get_or_create_person.call_args[1].get('dry_run') is True
    
    # 2. Verify NO table updates were made
    mock_importer.candidates_table.update_item.assert_not_called()
    mock_importer.constituencies_table.update_item.assert_not_called()
    mock_importer.candidates_table.put_item.assert_not_called()

def test_decimal_parsing(mock_importer):
    assert mock_importer.parse_decimal("65.5 %") == Decimal("65.5")
    assert mock_importer.parse_decimal("1,234.56") == Decimal("1234.56")
    assert mock_importer.parse_decimal(None) == Decimal("0")
    assert mock_importer.parse_decimal("") == Decimal("0")

def test_int_parsing(mock_importer):
    assert mock_importer.parse_int("123") == 123
    assert mock_importer.parse_int("123.45") == 123
    assert mock_importer.parse_int(None) == 0
    assert mock_importer.parse_int("") == 0
    assert mock_importer.parse_int("invalid") == 0

def test_bool_parsing(mock_importer):
    assert mock_importer.parse_bool("Yes") is True
    assert mock_importer.parse_bool("Incumbent") is True
    assert mock_importer.parse_bool("True") is True
    assert mock_importer.parse_bool("No") is False
    assert mock_importer.parse_bool("") is False

def test_process_row_party_mismatch_same_year(mock_importer):
    # Two records with same name but different parties in SAME YEAR.
    # New Rule: Mandatory party match for same-year updates.
    row = {
        'Year': '2021', 'Candidate': 'DURAI CHANDRASEKAR', 'Constituency_Name': 'PONNERI',
        'District_Name': 'THIRUVALLUR', 'Party': 'ADMK', 'Age': '45', 'Sex': 'M'
    }

    mock_importer.resolver.resolve_party_id.side_effect = lambda x: f"{x}_ID"
    
    # DB has one record in 2021 but with DMK party
    mock_importer.candidates_table.query.return_value = {
        'Items': [{
            'PK': 'AFFIDAVIT#2021#OLD_ID',
            'person_id': 'PERSON_DMK',
            'candidate_name': 'DURAI CHANDRASEKAR',
            'party_id': 'DMK_ID',
            'year': 2021
        }]
    }

    mock_importer.process_row(row, dry_run=False)

    # Should NOT match because it's the same year but different parties
    call_args = mock_importer.resolver.get_or_create_person.call_args
    assert call_args[1].get('person_id_override') is None

def test_process_row_multiple_names_party_tiebreak(mock_importer):
    # Two people with same name in same year but different parties
    row = {
        'Year': '2021', 'Candidate': 'DURAI CHANDRASEKAR', 'Constituency_Name': 'PONNERI',
        'Party': 'ADMK'
    }
    mock_importer.resolver.resolve_party_id.return_value = 'ADMK_ID'

    # DB has TWO "DURAI CHANDRASEKAR" in 2021: one DMK, one ADMK
    mock_importer.candidates_table.query.return_value = {
        'Items': [
            {
                'PK': 'AFFIDAVIT#2021#ID_1', 'person_id': 'P1_DMK',
                'candidate_name': 'DURAI CHANDRASEKAR', 'party_id': 'DMK_ID', 'year': 2021
            },
            {
                'PK': 'AFFIDAVIT#2021#ID_2', 'person_id': 'P2_ADMK',
                'candidate_name': 'DURAI CHANDRASEKAR', 'party_id': 'ADMK_ID', 'year': 2021
            }
        ]
    }

    mock_importer.process_row(row, dry_run=False)

    # Should match P2_ADMK because party matches
    call_args = mock_importer.resolver.get_or_create_person.call_args
    assert call_args[1].get('person_id_override') == 'P2_ADMK'

def test_process_row_multiple_names_independent_age_tiebreak(mock_importer):
    # Two independents with same name
    row = {
        'Year': '2021', 'Candidate': 'DURAI CHANDRASEKAR', 'Constituency_Name': 'PONNERI',
        'Party': 'Independent', 'Age': '45'
    }
    mock_importer.resolver.resolve_party_id.return_value = 'PARTY#independent'

    # DB has TWO "DURAI CHANDRASEKAR" independents from 2016
    # One is 40 in 2016 (so 45 in 2021 -> Match)
    # One is 60 in 2016 (so 65 in 2021 -> Mismatch)
    mock_importer.candidates_table.query.return_value = {
        'Items': [
            {
                'PK': 'AFFIDAVIT#2016#ID_OLD', 'person_id': 'P_OLD',
                'candidate_name': 'DURAI CHANDRASEKAR', 'party_id': 'PARTY#independent', 'age': 60, 'year': 2016
            },
            {
                'PK': 'AFFIDAVIT#2016#ID_YOUNG', 'person_id': 'P_YOUNG',
                'candidate_name': 'DURAI CHANDRASEKAR', 'party_id': 'PARTY#independent', 'age': 40, 'year': 2016
            }
        ]
    }

    mock_importer.process_row(row, dry_run=False)

    # Should match P_YOUNG because age is consistent (40 in 2016 ~= 45 in 2021)
    call_args = mock_importer.resolver.get_or_create_person.call_args
    assert call_args[1].get('person_id_override') == 'P_YOUNG'

def test_process_row_cross_year_link_priority(mock_importer):
    # Candidate in 2024. DB has same name in 2019 (DMK) and 2014 (ADMK).
    # Current CSV candidate is DMK.
    row = {
        'Year': '2024', 'Candidate': 'DURAI CHANDRASEKAR', 'Constituency_Name': 'PONNERI',
        'Party': 'DMK'
    }
    mock_importer.resolver.resolve_party_id.return_value = 'DMK_ID'

    mock_importer.candidates_table.query.return_value = {
        'Items': [
            {
                'PK': 'AFFIDAVIT#2014#ID1', 'person_id': 'P_ADMK',
                'candidate_name': 'DURAI CHANDRASEKAR', 'party_id': 'ADMK_ID', 'year': 2014
            },
            {
                'PK': 'AFFIDAVIT#2019#ID2', 'person_id': 'P_DMK',
                'candidate_name': 'DURAI CHANDRASEKAR', 'party_id': 'DMK_ID', 'year': 2019
            }
        ]
    }

    mock_importer.process_row(row, dry_run=False)

    # Should match P_DMK due to party priority even across years
    call_args = mock_importer.resolver.get_or_create_person.call_args
    assert call_args[1].get('person_id_override') == 'P_DMK'

def test_process_row_similar_name_mismatch_same_year(mock_importer):
    # Regression test for 2016 POLUR bug:
    # VELAYUTHAM.A (PMK, 47) and VELAUTHAM.M (IND, 43)
    # They should NOT match even if names are similar because party and age are different.
    
    # 1. Candidate in DB: VELAYUTHAM.A, PMK, Age: 47
    mock_importer.candidates_table.query.return_value = {
        'Items': [{
            'PK': 'AFFIDAVIT#2016#ID_VELAYUTHAM',
            'person_id': 'PERSON_VELAYUTHAM',
            'candidate_name': 'VELAYUTHAM.A',
            'party_id': 'PARTY#PMK',
            'age': 47,
            'year': 2016
        }]
    }

    # 2. Row being processed: VELAUTHAM.M, IND, Age: 43
    row = {
        'Year': '2016', 'Candidate': 'VELAUTHAM.M', 'Constituency_Name': 'POLUR',
        'Party': 'Independent', 'Age': '43'
    }
    mock_importer.resolver.resolve_party_id.return_value = 'PARTY#independent'

    mock_importer.process_row(row, dry_run=False)

    # Should NOT match because party (PMK vs IND) and age (47 vs 43) are both different.
    call_args = mock_importer.resolver.get_or_create_person.call_args
    assert call_args[1].get('person_id_override') is None

def test_process_row_same_name_party_mismatch_same_year(mock_importer):
    # Regression test for CHEYYAR 2016 bug:
    # MOHAN K (ADMK, 58) and MOHAN K (IND, 56)
    # They should NOT match even if names are same and ages are close because it's the SAME YEAR but different parties.
    
    # 1. Candidate in DB: MOHAN K, ADMK, Age: 58
    mock_importer.candidates_table.query.return_value = {
        'Items': [{
            'PK': 'AFFIDAVIT#2016#ID_MOHAN_ADMK',
            'person_id': 'PERSON_MOHAN_ADMK',
            'candidate_name': 'MOHAN K',
            'party_id': 'PARTY#ADMK',
            'age': 58,
            'year': 2016
        }]
    }

    # 2. Row being processed: MOHAN K, IND, Age: 56
    row = {
        'Year': '2016', 'Candidate': 'MOHAN K', 'Constituency_Name': 'CHEYYAR',
        'Party': 'Independent', 'Age': '56'
    }
    mock_importer.resolver.resolve_party_id.return_value = 'PARTY#independent'

    mock_importer.process_row(row, dry_run=False)

    # Should NOT match because party (ADMK vs IND) is different in same year
    call_args = mock_importer.resolver.get_or_create_person.call_args
    assert call_args[1].get('person_id_override') is None
