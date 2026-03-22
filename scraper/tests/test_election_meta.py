import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.parser import MynetaParser
import re

def test_election_meta_extraction():
    parser = MynetaParser()
    
    # Mock some HTML and details
    html = """
    <div class="w3-twothird">
        <h2>DEEPAN CHAKKRAVARTHI.S</h2>
        <h5>VILAVANCODE : BYE ELECTION ON 19-04-2024</h5>
        <b>Age: 32</b>
        <b>Party: Independent</b>
        <b>S/o: Sampathkumar</b>
    </div>
    """
    source_url = "http://example.com/candidate.php?candidate_id=4317"
    election_year = "2024"
    details_context = {"election_type": "Assembly"}
    
    parsed = parser.parse_candidate_details(html, source_url, election_year, details=details_context)
    
    print("Test 1: Bye-Election Extraction")
    if parsed:
        print(f"Constituency: {parsed['constituency']}")
        print(f"Election Type: {parsed['election_type']}")
        print(f"Candidacy Type: {parsed['candidacy_type']}")
        print(f"Election Date: {parsed['election_date']}")
        
        assert parsed['constituency'] == "VILAVANCODE"
        assert parsed['candidacy_type'] == "Bye-Election"
        assert parsed['election_date'] == "19-04-2024"
        print("✅ Success")
    else:
        print("❌ Failure: Could not parse details")

    # Test 2: General Election
    html_gen = """
    <div class="w3-twothird">
        <h2>NAMAKKAL KAVIGNAR</h2>
        <h5>NAMAKKAL</h5>
        <b>Age: 40</b>
        <b>Party: DMK</b>
    </div>
    """
    parsed_gen = parser.parse_candidate_details(html_gen, source_url, "2021", details={"election_type": "Assembly"})
    
    print("\nTest 2: General Election Extraction")
    if parsed_gen:
        print(f"Constituency: {parsed_gen['constituency']}")
        print(f"Candidacy Type: {parsed_gen['candidacy_type']}")
        assert parsed_gen['constituency'] == "NAMAKKAL"
        assert parsed_gen['candidacy_type'] == "General"
        print("✅ Success")

    # Test 3: Lok Sabha Detection in Main (context passed)
    print("\nTest 3: Lok Sabha Context")
    parsed_ls = parser.parse_candidate_details(html_gen, source_url, "2024", details={"election_type": "Lok Sabha"})
    if parsed_ls:
        print(f"Election Type: {parsed_ls['election_type']}")
        assert parsed_ls['election_type'] == "Lok Sabha"
        print("✅ Success")

if __name__ == "__main__":
    test_election_meta_extraction()
