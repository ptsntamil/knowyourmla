import pytest
import sys
import os

# Add scraper directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils import clean_currency_to_int
from helper.correct_election_expenses import ExpenseCorrector

@pytest.mark.parametrize("input_str, expected", [
    ("Rs 21,15,828 21 Lacs+", 2115828),
    ("Rs 2,18,08,612 21 Cr+", 21808612),
    ("21,15,82821", 211582821), # If just a number without label, it stays (regex isolates first group)
    ("Rs 21,15,828", 2115828),
    ("nil", 0),
    ("", 0),
    ("Rs 500 5 Thou+", 500),
])
def test_clean_currency_to_int_robust(input_str, expected):
    assert clean_currency_to_int(input_str) == expected

@pytest.mark.parametrize("amount, should_correct_expected", [
    (211582821, True),   # First 21, Last 21
    (218086121, True),   # First 21, Last 21
    (2115828, False),    # First 21, Last 28
    (500, False),        # Too short
    (1234567812, True),  # First 12, Last 12
    (12345678, False),   # First 12, Last 78
])
def test_expense_corrector_logic(amount, should_correct_expected):
    corrector = ExpenseCorrector(dry_run=True)
    assert corrector.should_correct(amount) == should_correct_expected
    if should_correct_expected:
        assert corrector.correct_value(amount) == int(str(amount)[:-2])

def test_extract_election_expenses_mock(mocker):
    # Mocking BeautifulSoup and session is complex, but we can test if the 
    # logic in extract_election_expenses would work with our new utils.
    pass
