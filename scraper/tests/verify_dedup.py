import sys
import os
import hashlib
import time
import boto3
import boto3.dynamodb.conditions
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

# Mock DynamoDB and other dependencies before importing EnrichmentPipeline
sys.modules['config'] = MagicMock()
sys.modules['config'].logger = MagicMock()
sys.modules['config'].BASE_URL = "https://myneta.info"
sys.modules['config'].USER_AGENT = "Mozilla/5.0"
sys.modules['config'].REQUEST_DELAY = 0

# Add scraper to path
sys.path.insert(0, os.path.join(os.getcwd(), 'scraper'))

from enrichment import EnrichmentPipeline
from utils import normalize_name, strip_initials

def test_deduplication_logic():
    print("Starting Unified Deduplication Logic Verification (14 Scenarios)...")
    
    # Initialize pipeline
    with patch('boto3.resource') as mock_boto:
        pipeline = EnrichmentPipeline()
        mock_persons_table = MagicMock()
        mock_constituencies_table = MagicMock()
        mock_candidates_table = MagicMock()
        pipeline.persons_table = mock_persons_table
        pipeline.constituencies_table = mock_constituencies_table
        pipeline.candidates_table = mock_candidates_table

        test_cases = [
            {
                "id": 1,
                "name": "SAKKARAPANI R",
                "candidates": [
                    {"name": "SAKKARAPANI R", "rel": "RANGASAMY GOUNDAR", "age": 55, "year": "2016"},
                    {"name": "SAKKARAPANI R", "rel": "Rangasamy Gounder", "age": 59, "year": "2021"}
                ]
            },
            {
                "id": 2,
                "name": "PERIYASAMY I",
                "candidates": [
                    {"name": "PERIYASAMY I", "rel": "IRULAPPAN SERVAI", "age": 64, "year": "2016"},
                    {"name": "PERIYASAMY I", "rel": "IRULAPPAN SERVAI", "age": 67, "year": "2021"}
                ]
            },
            {
                "id": 3,
                "name": "SENTHILBALAJI V",
                "candidates": [
                    {"name": "SENTHILBALAJI", "rel": "Velusamy", "age": 36, "year": "2011"},
                    {"name": "SENTHILBALAJI .V", "rel": "P.Veluchamy", "age": 41, "year": "2016"},
                    {"name": "SENTHILBALAJI V", "rel": "Mr. Velusamy", "age": 45, "year": "2021"}
                ]
            },
            {
                "id": 4,
                "name": "M.K. STALIN",
                "candidates": [
                    {"name": "STALIN M K", "rel": "KARUNA NIDHI", "age": 59, "year": "2011"},
                    {"name": "M.K.STALIN", "rel": "M.Karunanithi", "age": 63, "year": "2016"},
                    {"name": "M.K. STALIN", "rel": "Karunanithi.M", "age": 68, "year": "2021"}
                ]
            },
            {
                "id": 5,
                "name": "POLLACHI V JAYARAMAN",
                "candidates": [
                    {"name": "POLLACHI V JAYARAMAN", "rel": "Varadharaj", "age": 62, "year": "2016"},
                    {"name": "POLLACHI V. JAYARAMAN", "rel": "Varadharaj", "age": 67, "year": "2021"}
                ]
            },
            {
                "id": 6,
                "name": "Velumani S P",
                "candidates": [
                    {"name": "Velumani S P", "rel": "E.A PALANISAMY", "age": 41, "year": "2011"},
                    {"name": "S.P. Velumani", "rel": "PAZHANICHAMY", "age": 46, "year": "2016"},
                    {"name": "S.P. VELUMANI", "rel": "E.A. Palanichamy", "age": 51, "year": "2021"}
                ]
            },
            {
                "id": 7,
                "name": "SENTHIL KUMAR I.P",
                "candidates": [
                    {"name": "SENTHILKUMAR I P", "rel": "I. PERIYASAMY", "age": 37, "year": "2016"},
                    {"name": "SENTHIL KUMAR I.P", "rel": "Periyasamy", "age": 42, "year": "2021"}
                ]
            },
            {
                "id": 8,
                "name": "C. VIJAYABASKAR",
                "candidates": [
                    {"name": "C. VIJAYABASKAR", "rel": "R.Chinnathambi", "age": 36, "year": "2011"},
                    {"name": "VIJAYA BASKAR C", "rel": "R.Chinnathambi", "age": 42, "year": "2016"},
                    {"name": "VIJAYA BASKER C", "rel": "Chinnathambi", "age": 47, "year": "2021"}
                ]
            },
            {
                "id": 9,
                "name": "VIJAYABHASKAR. M.R",
                "candidates": [
                    {"name": "VIJAYABHASKAR .M.R", "rel": "RAMASAMY", "age": 51, "year": "2016"},
                    {"name": "VIJAYABHASKAR. M.R", "rel": "Ramasamy", "age": 55, "year": "2021"}
                ]
            },
            {
                "id": 10,
                "name": "SREENIVASAN C",
                "candidates": [
                    {"name": "SREENIVASAN C", "rel": "M. CHINNASAMY", "age": 68, "year": "2016"},
                    {"name": "SREENIVASAN.C", "rel": "Chinnasamy", "age": 72, "year": "2021"}
                ]
            },
            {
                "id": 11,
                "name": "PALANIVEL THIYAGARAJAN",
                "candidates": [
                    {"name": "PALANIVEL THIYAGARAJAN", "rel": "Palanivel Rajan", "age": 50, "year": "2016"},
                    {"name": "PALANIVEL THIAGA RAJAN", "rel": "Palanivel Rajan", "age": 55, "year": "2021"}
                ]
            },
            {
                "id": 12,
                "name": "K.N.Nehru",
                "candidates": [
                    {"name": "K.N.Nehru", "rel": "G NARAYANAN", "age": 59, "year": "2011"},
                    {"name": "NEHRU.K.N", "rel": "G.Narayanan", "age": 63, "year": "2016"},
                    {"name": "NEHRU, K.N.", "rel": "G. Narayanan", "age": 68, "year": "2021"}
                ]
            },
            {
                "id": 13,
                "name": "O.Panneerselvam",
                "candidates": [
                    {"name": "PANNEERSELVAM.O", "rel": "Ottakara thevar", "age": 61, "year": "2011"},
                    {"name": "Thiru O.Panneerselvam", "rel": "M.Ottakarardevar", "age": 65, "year": "2016"},
                    {"name": "O.PANNEERSELVAM", "rel": "M. Ottakkarathevar", "age": 71, "year": "2021"}
                ]
            },
            {
                "id": 14,
                "name": "M.R.GANDHI",
                "candidates": [
                    {"name": "M.R.GANDHI", "rel": "RAMASAMY NADAR", "age": 65, "year": "2011"},
                    {"name": "GANDHI M.R", "rel": "Ramaswamy Nadar", "age": 69, "year": "2016"},
                    {"name": "GANDHI M R", "rel": "RAMASWAMY NADAR", "age": 76, "year": "2021"}
                ]
            },
            {
                "id": 15,
                "name": "THANGAMANI P",
                "candidates": [
                    {"name": "THANGAMANI P", "rel": "PALANIZSAMY", "age": 50, "year": "2011"},
                    {"name": "THANGAMANI. P", "rel": "PALANISAMY", "age": 55, "year": "2016"},
                    {"name": "THANGAMANI P", "rel": "PALANISAMY", "age": 60, "year": "2021"}
                ]
            },
            {
                # Note: User provided RENGASAMY for 2021, but he is a different person.
                # Only 2011/2016 for DORAIKKANNU should match.
                "id": 16,
                "name": "DORAIKKANNU R",
                "candidates": [
                    {"name": "DORAIKKANNU R", "rel": "RAMASAMY", "age": 63, "year": "2011"},
                    {"name": "DORAIKKANNU.R", "rel": "RAMASAMY", "age": 68, "year": "2016"}
                ]
            },
            {
                # Note: K.PP.SAMY (2011/2016) vs KP SHANKAR (successor).
                # Only the KPP SAMY records should match.
                "id": 17,
                "name": "K.P.P.SAMY",
                "candidates": [
                    {"name": "K.PP.SAMY", "rel": "P Kuppusamy", "age": 48, "year": "2011"},
                    {"name": "K.P.P.SAMY", "rel": "KUPPUSAMY", "age": 53, "year": "2016"}
                ]
            },
            {
                "id": 18,
                "name": "UDHAYAKUMAR R B",
                "candidates": [
                    {"name": "UDHAYAKUMAR R. B.", "rel": "Bose R", "age": 37, "year": "2011"},
                    {"name": "R. B. UDHAYAKUMAR", "rel": "Bose R", "age": 42, "year": "2016"},
                    {"name": "UDHAYAKUMAR R B", "rel": "Bose R", "age": 47, "year": "2021"}
                ]
            },
            {
                "id": 19,
                "name": "THANGAM THENNARASU",
                "candidates": [
                    {"name": "Thangam Thennarasu", "rel": "V THANGAPANDIYAN", "age": 48, "year": "2011"},
                    {"name": "THANGAM THENNARASU", "rel": "THANGAPANDIYAN V", "age": 49, "year": "2016"},
                    {"name": "THANGAM THENARASU", "rel": "V. THANGAPANDIAN", "age": 54, "year": "2021"}
                ]
            },
            {
                "id": 20,
                "name": "ANITHA R RADHAKRISHNAN",
                "candidates": [
                    {"name": "ANITHA R RADHAKRISHNAN", "rel": "V RAMAMURTHY", "age": 65, "year": "2016"},
                    {"name": "ANITHA R. RADHAKRISHNAN", "rel": "Ramamoorthy", "age": 68, "year": "2021"}
                ]
            },
            {
                "id": 21,
                "name": "SIVASANKAR S.S",
                "candidates": [
                    {"name": "S.SIVASANKAR", "rel": "SIVASUBRAMANIYAN", "age": 41, "year": "2011"},
                    {"name": "SIVASANKAR. S.S", "rel": "Sivasubramaniyan", "age": 47, "year": "2016"},
                    {"name": "SIVASANKAR, S.S.", "rel": "Late S. Shivasubramaniyan", "age": 51, "year": "2021"}
                ]
            },
            {
                "id": 22,
                "name": "RAJA T.R.B",
                "candidates": [
                    {"name": "RAJAA T.R.B.", "rel": "T. R. BAALU", "age": 34, "year": "2011"},
                    {"name": "RAJAA.T.R.B", "rel": "T.R.Baalu", "age": 39, "year": "2016"},
                    {"name": "RAJAA T R B", "rel": "T.R.Baalu", "age": 44, "year": "2021"}
                ]
            },
            {
                "id": 23,
                "name": "R.GANDHI",
                "candidates": [
                    {"name": "R. Gandhi", "rel": "CHINNAPPA", "age": 65, "year": "2011"},
                    {"name": "R.GANDHI", "rel": "Chinnappa", "age": 70, "year": "2016"},
                    {"name": "R.GANDHI", "rel": "Chinnappa", "age": 75, "year": "2021"}
                ]
            },
            {
                "id": 24,
                "name": "RAMACHANDRAN K",
                "candidates": [
                    {"name": "RAMACHANDRAN K", "rel": "A.Kari Kaudar", "age": 60, "year": "2011"},
                    {"name": "RAMACHANDRAN, K.", "rel": "Kari Gowder", "age": 69, "year": "2021"}
                ]
            },
            {
                "id": 25,
                "name": "RAJAKANNAPPAN (Negative Case)",
                "expect_match": False,
                "candidates": [
                    {"name": "RAJA KANNAPPAN R.S.", "rel": "GOPAL REDDY", "age": 47, "year": "2011"},
                    {"name": "R.S.RAJAKANNAPPAN", "rel": "SAMIYAPILLAI", "age": 72, "year": "2021"}
                ]
            },
            {
                "id": 26,
                "name": "PONNUSAMY K",
                "candidates": [
                    {"name": "PONNUSAMY K", "rel": "M KUPPANAN (A) KUPPUSAMY", "age": 57, "year": "2011"},
                    {"name": "PONNUSAMY. K", "rel": "KUPPUSWAMY", "age": 62, "year": "2016"}
                ]
            },
            {
                "id": 27,
                "name": "JAYARAMAKRISHNAN R",
                "candidates": [
                    {"name": "JAYARAMAKRISHNAN R", "rel": "RAMASAMY GOUNDER", "age": 49, "year": "2016"},
                    {"name": "JAYARAMAKRISHNAN", "rel": "RAMASAMY KAWUNDER", "age": 53, "year": "2021"}
                ]
            },
            {
                "id": 28,
                "name": "SENTHILKUMAR M (Negative Case 1)",
                "expect_match": False,
                "candidates": [
                    {"name": "SENTHILKUMAR.M", "rel": "Marimuthu", "age": 43, "year": "2021", "const": "KALLAKURICHI"},
                    {"name": "M.SENTHILKUMAR", "rel": "Marimuthu", "age": 42, "year": "2023", "const": "ERODE EAST"}
                ]
            },
            {
                "id": 29,
                "name": "MURUGAN R (Negative Case 2)",
                "expect_match": False,
                "candidates": [
                    {"name": "MURUGAN,R.", "rel": "RAJ", "age": 42, "year": "2021", "const": "TIRUNELVELI"},
                    {"name": "MURUGAN P", "rel": "Balraj", "age": 41, "year": "2021", "const": "OTTAPIDARAM"}
                ]
            },
            {
                "id": 30,
                "name": "MANIKANDAN K (Negative Case 3)",
                "expect_match": False,
                "candidates": [
                    {"name": "BALAMANIKANDAN.K", "rel": "Krishnan", "age": 44, "year": "2021", "const": "KARUR"},
                    {"name": "MANIKANDAN, K.", "rel": "Krishnan", "age": 42, "year": "2021", "const": "KUNNAM"}
                ]
            },
            {
                "id": 31,
                "name": "SRIDHAR/RAVI (Negative Case 4)",
                "expect_match": False,
                "candidates": [
                    {"name": "R S SRIDHAR", "rel": "Subramani", "age": 59, "year": "2021", "const": "KATPADI"},
                    {"name": "S.RAVI", "rel": "Subramani", "age": 57, "year": "2021", "const": "ARAKKONAM"}
                ]
            },
            {
                "id": 32,
                "name": "MURUGAN/BALAMURUGAN (Negative Case 5)",
                "expect_match": False,
                "candidates": [
                    {"name": "MURUGAN.R", "rel": "Raman. V", "age": 44, "year": "2021", "const": "PAPPIREDDIPATTI"},
                    {"name": "BALAMURUGAN N R", "rel": "Ramaiah", "age": 43, "year": "2021", "const": "THIRUMANGALAM"}
                ]
            },
            {
                "id": 33,
                "name": "MAHAMUNI/MOHAN (Negative Case 6)",
                "expect_match": False,
                "candidates": [
                    {"name": "MAHAMUNI.A", "rel": "Annavi.P", "age": 37, "year": "2021", "const": "KRISHNARAYAPURAM"},
                    {"name": "MOHAN A", "rel": "Aavani", "age": 39, "year": "2021", "const": "TINDIVANAM"}
                ]
            },
            {
                "id": 34,
                "name": "SEKAR/SIVA (Negative Case 7)",
                "expect_match": False,
                "candidates": [
                    {"name": "R.SEKAR", "rel": "RAMASAMY", "age": 42, "year": "2021", "const": "VANIYAMBADI"},
                    {"name": "SIVA.A", "rel": "Ayyasamy", "age": 43, "year": "2021", "const": "KINATHUKADAVU"}
                ]
            },
            {
                "id": 35,
                "name": "BALAMURUGAN S (Potential Collision 1)",
                "expect_match": False,
                "candidates": [
                    {"name": "BALAMURUGAN, S.", "rel": "Subramanian", "age": 39, "year": "2021", "const": "KUNNAM"},
                    {"name": "BALAMURUGAN S", "rel": "SUBRAMANI", "age": 40, "year": "2021", "const": "TIRUCHENGODU"}
                ]
            },
            {
                "id": 36,
                "name": "M.SELVAKUMAR (Potential Collision 2)",
                "expect_match": True,
                "candidates": [
                    {"name": "M.SELVAKUMAR S/O MARIYAPPAN", "rel": "MARIYAPPAN", "age": 27, "year": "2021", "const": "THIRUMAYAM"},
                    {"name": "M.SELVAKUMAR S/O MARIYAPPAN", "rel": "MARIYAPPAN", "age": 28, "year": "2021", "const": "THIRUMAYAM"}
                ]
            },
            {
                "id": 37,
                "name": "MGR NAMBBI (Multi-seat 1)",
                "candidates": [
                    {"name": "MGR NAMBBI", "rel": "Ramaraj", "age": 65, "year": 2021, "const": "SIVAKASI", "v_const": "VIRUGAMPAKKAM", "vsn": "35", "vpn": "106"},
                    {"name": "M.G.R.NAMBBI", "rel": "Ramaraj", "age": 65, "year": 2021, "const": "KOVILPATTI", "v_const": "VIRUGAMPAKKAM", "vsn": "35", "vpn": "106"}
                ]
            },
            {
                "id": 38,
                "name": "SANKARA SUBRAMANIAN M (Multi-seat 2)",
                "candidates": [
                    {"name": "SANKARA SUBRAMANIAN M", "rel": "Mahalingam", "age": 53, "year": 2021, "const": "SRIVAIKUNTAM", "v_const": "SRIVAIKUNTAM", "vsn": "673", "vpn": "15"},
                    {"name": "SANKARASUBRAMANIAN,M.", "rel": "Mahalingam", "age": 53, "year": 2021, "const": "TIRUNELVELI", "v_const": "SRIVAIKUNTAM", "vsn": "673", "vpn": "15"}
                ]
            },
            {
                "id": 39,
                "name": "DEEPAN CHAKKRAVARTHI S (Voter info shift)",
                "candidates": [
                    {"name": "DEEPAN CHAKKRAVARTHI S", "rel": "Sampathkumar", "age": 30, "year": 2021, "const": "NAMAKKAL", "v_const": "NAMAKKAL", "vsn": "751", "vpn": "154"},
                    {"name": "DEEPAN CHAKKRAVARTHI.S", "rel": "Sampathkumar", "age": 32, "year": 2023, "const": "ERODE EAST", "v_const": "NAMAKKAL", "vsn": "782", "vpn": "155"}
                ]
            }
        ]

        total_passed = 0

        for case in test_cases:
            print(f"\nScenario {case['id']}: {case['name']}")
            
            # Simulated DB for this case
            db_items = []
            candidates_db = []
            
            def mock_query(IndexName, KeyConditionExpression):
                # Handle variants from NameIndex on persons table
                # OR PersonIndex on candidates table
                val = None
                if hasattr(KeyConditionExpression, '_values') and len(KeyConditionExpression._values) > 1:
                    val = KeyConditionExpression._values[1]
                elif hasattr(KeyConditionExpression, 'value'):
                    val = KeyConditionExpression.value
                
                if IndexName == 'NameIndex':
                    matches = [i for i in db_items if i.get('normalized_name') == val]
                    return {'Items': matches}
                elif IndexName == 'PersonIndex':
                    matches = [i for i in candidates_db if i.get('person_id') == val]
                    return {'Items': matches}
                return {'Items': []}
            
            def mock_put_item(Item):
                db_items.append(Item)

            mock_persons_table.query.side_effect = mock_query
            mock_persons_table.put_item.side_effect = mock_put_item
            
            def mock_get_item(Key):
                pk = Key.get('PK')
                item = next((i for i in db_items if i['PK'] == pk), None)
                if item: return {'Item': item}
                return {}

            mock_persons_table.get_item.side_effect = mock_get_item
            mock_persons_table.update_item.return_value = {}
            mock_constituencies_table.get_item.return_value = {}
            
            # Mock candidates table
            mock_candidates_table.query.side_effect = mock_query

            person_ids = []
            for cand in case['candidates']:
                # For legacy tests without explicit 'const', we use a default
                c_const = cand.get('const', 'UNKNOWN_CONST')
                details = {
                    'candidate_name': cand['name'],
                    'lastname': cand['rel'],
                    'age': cand['age'],
                    'constituency': c_const, 
                    'voter_constituency': cand.get('v_const'),
                    'voter_serial_no': cand.get('vsn'),
                    'voter_part_no': cand.get('vpn')
                }
                pid = pipeline.get_or_create_person(details, cand['year'], 999)
                person_ids.append(pid)
                # Simulate candidate record creation to populate PersonIndex
                candidates_db.append({
                    'person_id': pid,
                    'year': cand['year'],
                    'constituency_id': c_const
                })

            expect_match = case.get('expect_match', True)
            if expect_match:
                if len(set(person_ids)) == 1:
                    print(f"  ✅ SUCCESS: All {len(person_ids)} records mapped to {person_ids[0]}")
                    total_passed += 1
                else:
                    print(f"  ❌ FAILURE: Records mapped to different IDs: {person_ids}")
            else:
                if len(set(person_ids)) == len(person_ids):
                    print(f"  ✅ SUCCESS: Negative case passed. Records correctly kept separate: {person_ids}")
                    total_passed += 1
                else:
                    print(f"  ❌ FAILURE: Negative case failed. Records INCORRECTLY mapped to same ID: {person_ids}")

        print("\n" + "="*50)
        print(f"FINAL RESULT: {total_passed}/{len(test_cases)} scenarios passed.")
        print("="*50)

if __name__ == "__main__":
    test_deduplication_logic()
