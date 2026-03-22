import pytest
from unittest.mock import MagicMock, patch
import os
import sys

# Set up local imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from parser import MynetaParser
from config import BASE_URL

def test_get_constituency_links():
    html = """
    <html>
        <a href="action=show_candidates&constituency_id=1">Constituency 1</a>
        <a href="/tamilnadu2021/action=show_candidates&constituency_id=2">Constituency 2</a>
        <a href="other.php">Other Link</a>
    </html>
    """
    links = MynetaParser.get_constituency_links(html)
    assert len(links) == 2
    assert links[0]["name"] == "Constituency 1"
    assert "constituency_id=1" in links[0]["url"]
    assert links[1]["name"] == "Constituency 2"

@patch("subprocess.run")
def test_get_winner_links(mock_run):
    html = """
    <html>
        <script>eval(function(p,a,c,k,e,d){return p}('packed code',1,1,{},1,{}))</script>
        <a href="candidate.php?candidate_id=101">Candidate 1 (Winner)</a>
    </html>
    """
    # Mock subprocess.run for node execution
    mock_run.return_value = MagicMock(stdout='<a href="candidate.php?candidate_id=102">Candidate 2</a>', check=True)
    
    links = MynetaParser.get_winner_links(html, "TamilNadu2021")
    
    # 101 from HTML, 102 from decoded JS
    assert len(links) == 2
    assert links[0]["name"] == "Candidate 1"
    assert "candidate_id=101" in links[0]["url"]
    assert links[1]["name"] == "Candidate 2"
    assert "candidate_id=102" in links[1]["url"]

def test_parse_candidate_details_bye_election():
    html = """
    <div class="w3-twothird">
        <h2>DEEPAN CHAKKRAVARTHI.S</h2>
        <h5>VILAVANCODE : BYE ELECTION ON 19-04-2024 (Kanyakumari)</h5>
        <b>Age: 32</b>
        <b>Party: Independent</b>
        <div><b>S/o: Sampathkumar</b></div>
    </div>
    <div class="w3-red">1 Criminal Cases</div>
    <a href="affidavit.php">Affidavit</a>
    <div class="w3-panel">
        <div>Assets & Liabilities</div>
        <table>
            <tr><td>Total Assets</td><td>Rs 1,00,000</td></tr>
            <tr><td>Total Liabilities</td><td>Rs 10,000</td></tr>
        </table>
    </div>
    <a href="expense.php">Election Expenses</a>
    """
    source_url = "http://example.com/candidate.php?candidate_id=4317"
    
    from enrichment import MyNetaParser
    mock_session = MagicMock()
    mock_session.get.return_value.text = html
    mock_resolver = MagicMock()
    
    parser = MyNetaParser(mock_session)
    parsed = parser.extract_affidavit_details(source_url, mock_resolver)
    
    assert parsed is not None
    assert parsed.candidate_name == "DEEPAN CHAKKRAVARTHI.S"
    assert parsed.constituency.upper() == "VILAVANCODE"
    assert parsed.candidacy_type == "Bye-Election"
    assert parsed.election_date == "19-04-2024"
    assert parsed.age == 32
    assert parsed.total_assets == 100000
    assert parsed.total_liabilities == 10000
    assert parsed.criminal_cases == 1

def test_parse_candidate_details_general():
    html = """
    <div class="w3-twothird">
        <h2>NAMAKKAL KAVIGNAR (Winner)</h2>
        <h5>NAMAKKAL</h5>
        <b>Age: 40</b>
        <b>Party: DMK</b>
    </div>
    """
    source_url = "http://example.com/candidate.php?candidate_id=500"
    parsed = MynetaParser.parse_candidate_details(html, source_url, "2021")
    
    assert parsed["full_name"] == "NAMAKKAL KAVIGNAR"
    assert parsed["constituency"] == "NAMAKKAL"
    assert parsed["candidacy_type"] == "General"
    assert parsed["result"] == "Won"

def test_parse_candidate_details_failure():
    html = "<html>Empty</html>"
    parsed = MynetaParser.parse_candidate_details(html, "url", "2021")
    assert parsed is None
