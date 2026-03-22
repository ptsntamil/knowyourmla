import pytest
from unittest.mock import MagicMock, patch, ANY
from scraper.enrichment import EnrichmentPipeline, IdentityResolver, MyNetaParser, AffidavitData, retry
import time

# --- Test retry decorator ---

def test_retry_decorator():
    mock_func = MagicMock()
    # Fail once, then succeed
    mock_func.side_effect = [Exception("Fail"), "Success"]
    
    @retry(Exception, tries=2, delay=0.01)
    def decorated():
        return mock_func()
    
    result = decorated()
    assert result == "Success"
    assert mock_func.call_count == 2

# --- Fixtures ---

@pytest.fixture
def mock_db():
    with patch('boto3.resource') as mock_resource:
        db = MagicMock()
        mock_resource.return_value = db
        table = MagicMock()
        table.scan.return_value = {"Items": []}
        db.Table.return_value = table
        yield db

@pytest.fixture
def resolver(mock_db):
    return IdentityResolver(mock_db)

@pytest.fixture
def parser():
    return MyNetaParser(MagicMock())

# --- Tests ---

def test_resolve_district_id(resolver):
    resolver.district_lookup = {"district a": "DISTRICT#1"}
    assert resolver.resolve_district_id("District A") == "DISTRICT#1"
    assert resolver.resolve_district_id("New District") == "DISTRICT#newdistrict"

def test_get_or_create_constituency_existing(resolver):
    resolver.constituencies_table.get_item.return_value = {
        "Item": {"PK": "CONSTITUENCY#const1"}
    }
    with patch('scraper.enrichment.clean_constituency', return_value="const1"):
        cid = resolver.get_or_create_constituency("const1")
        assert cid == "CONSTITUENCY#const1"

def test_get_or_create_person_basic(resolver):
    resolver.persons_table.query.return_value = {'Items': []}
    resolver.persons_table.get_item.return_value = {}
    
    details = AffidavitData(
        candidate_name='STALIN M K',
        lastname='KARUNA NIDHI',
        age=68,
        voter_constituency='KOLATHUR',
        voter_serial_no='1',
        voter_part_no='1',
        constituency='KOLATHUR'
    )
    pid = resolver.get_or_create_person(details, "2021", 1)
    assert "PERSON#" in pid
    resolver.persons_table.put_item.assert_called_once()

def test_deobfuscate_page_simple(parser):
    with patch('scraper.enrichment.re.sub', return_value="decoded content"):
        result = parser._deobfuscate_page("some html")
        assert result == "decoded content"
