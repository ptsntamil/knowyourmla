"""Tests for education normalization utility."""

import os
import sys
import pytest

# Set up local imports to import from the parent scraper directory
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from create_2026_candidates import normalize_education, _parse_year, _get_qualification_rank


@pytest.mark.parametrize("year_input, expected_year", [
    ("1988", 1988),
    ("1974-1975", 1975),
    ("1979-1982", 1982),
    ("75-76", 1976),
    ("05-06", 2006),
    (1999, 1999),
    (2021.0, 2021),
    ("", 0),
    (None, 0),
    ("Not Applicable", 0)
])
def test_parse_year(year_input, expected_year):
    """Verifies that _parse_year correctly extracts numeric years from various formats.

    Args:
        year_input: The input value to parse.
        expected_year: The expected output integer.
    """
    assert _parse_year(year_input) == expected_year


@pytest.mark.parametrize("qual_str, expected_rank", [
    ("SSLC", 2),
    ("10th", 2),
    ("PUC", 3),
    ("12th", 3),
    ("B.A.", 5),
    ("LL.B.", 5),
    ("B.Sc", 5),
    ("MA", 6),
    ("M.Sc.", 6),
    ("PhD", 8),
    ("Ph.D.", 8),
    ("Unknown", 0),
    ("", 0),
    (None, 0)
])
def test_get_qualification_rank(qual_str, expected_rank):
    """Verifies that _get_qualification_rank returns the correct ordering rank for qualifications.

    Args:
        qual_str: The qualification string.
        expected_rank: The expected rank integer.
    """
    assert _get_qualification_rank(qual_str) == expected_rank


@pytest.mark.parametrize("education_payload, expected_output", [
    # 1. String inputs
    ("B.A.", "B.A."),
    ("  SSLC  ", "SSLC"),
    ("", "Not Specified"),
    (None, "Not Specified"),
    
    # 2. Dict input with qualification
    ({"qualification": "B.A.", "institution": "College"}, "B.A."),
    ({"qualification": "  Ph.D.  "}, "Ph.D."),
    
    # 3. Dict input with degree/institution/year but no qualification
    ({"degree": "B.A.", "institution": "College", "year": "1982"}, "B.A., College, 1982"),
    ({"degree": "B.Sc.", "year": "2010"}, "B.Sc., 2010"),
    ({"institution": "School"}, "School"),
    
    # 4. Dict input with self nested structure
    ({"self": "LL.B."}, "LL.B."),
    ({"self": {"qualification": "MBA"}}, "MBA"),
    
    # 5. List with single item
    ([{"qualification": "SSLC"}], "SSLC"),
    
    # 6. List with years and ranks (resolves to latest)
    ([
        {"qualification": "SSLC", "year": "1974-1975"},
        {"qualification": "PUC", "year": "1975-1976"},
        {"qualification": "B.A.", "year": "1979-1982"},
        {"qualification": "LL.B.", "year": "1988"}
    ], "LL.B."),
    
    # 7. List with year ranges only (resolves to latest)
    ([
        {"qualification": "SSLC", "year": "1974-1975"},
        {"qualification": "PUC", "year": "1975-1976"},
        {"qualification": "B.A.", "year": "1979-1982"}
    ], "B.A."),
    
    # 8. List with no years (resolves to highest rank)
    ([
        {"qualification": "SSLC"},
        {"qualification": "PUC"},
        {"qualification": "B.A."}
    ], "B.A."),
    
    # 9. List with no years and same rank (resolves to the last item in the list)
    ([
        {"qualification": "B.A."},
        {"qualification": "LL.B."}
    ], "LL.B."),
    
    # 10. List containing string items
    (["SSLC", "B.A.", "LL.B."], "LL.B.")
])
def test_normalize_education(education_payload, expected_output):
    """Verifies that normalize_education processes and normalizes education payloads correctly.

    Args:
        education_payload: The input payload to normalize.
        expected_output: The expected display-safe normalized string.
    """
    assert normalize_education(education_payload) == expected_output
