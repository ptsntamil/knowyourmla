"""Unit tests for parse_polling_stations helper functions."""

from pathlib import Path
import pytest
from helper.parse_polling_stations import (
    extract_ac_no_from_filename,
    parse_ac_filter,
    resolve_output_dir,
    ensure_meta,
    HEADER_RE,
    AC_ONLY_RE,
    clean,
)


def test_extract_ac_no_from_filename():
    assert extract_ac_no_from_filename("AC006.pdf") == 6
    assert extract_ac_no_from_filename("ac003") == 3
    assert extract_ac_no_from_filename("assets/polling_stations/pdf/AC234.pdf") == 234
    assert extract_ac_no_from_filename("ac_042.pdf") == 42
    assert extract_ac_no_from_filename("no_digits.pdf") is None


def test_parse_ac_filter_single_and_list():
    assert parse_ac_filter("6") == {6}
    assert parse_ac_filter("1,2,3") == {1, 2, 3}
    assert parse_ac_filter("1-5") == {1, 2, 3, 4, 5}
    assert parse_ac_filter("AC006,AC007") == {6, 7}


def test_parse_ac_filter_range_args():
    assert parse_ac_filter(start_ac=1, end_ac=3) == {1, 2, 3}


def test_parse_ac_filter_none():
    assert parse_ac_filter() is None


def test_resolve_output_dir_explicit():
    out = resolve_output_dir("assets/polling_stations/pdf/AC006.pdf", out_arg="custom/path")
    assert out == Path("custom/path")


def test_resolve_output_dir_inferred():
    out = resolve_output_dir("assets/polling_stations/pdf/AC006.pdf")
    assert str(out).endswith("assets/polling_stations/AC006")


def test_resolve_output_dir_base_out():
    out = resolve_output_dir("some_dir/AC010.pdf", base_out="my_out")
    assert out == Path("my_out/AC010")


def test_ensure_meta():
    meta = ensure_meta({}, fallback_path="AC006.pdf")
    assert meta["ac_no"] == 6
    assert meta["ac_name"] == "AC 006"
    assert meta["pc_category"] == "GEN"
    assert meta["source_file"] == "AC006.pdf"


def test_header_regex_variations():
    # AC001 style (SC category present)
    txt1 = clean("List of Polling Stations for 1 GUMMIDIPOONDI Assembly Segment within the 1 THIRUVALLUR (SC) Parliamentary Constituency")
    m1 = HEADER_RE.search(txt1)
    assert m1 is not None
    assert m1.group(1) == "1"
    assert "GUMMIDIPOONDI" in m1.group(2)
    assert m1.group(5) == "SC"

    # AC003 style (No category, General seat)
    txt3 = clean("List of Polling Stations for 3 TIRUTTANI Assembly Segment within the 7 ARAKKANOM Parliamentary Constituency")
    m3 = HEADER_RE.search(txt3)
    assert m3 is not None
    assert m3.group(1) == "3"
    assert "TIRUTTANI" in m3.group(2)
    assert m3.group(5) is None

    # AC032 style (Parlimentry typo + KANCHEEPURAM(SC))
    txt32 = clean("List of Polling Stations for 32 CHENGALPATTU Assembly Constituency within the 6 KANCHEEPURAM(SC) Parlimentry Constituency")
    m32 = HEADER_RE.search(txt32)
    assert m32 is not None
    assert m32.group(1) == "32"
    assert "CHENGALPATTU" in m32.group(2)
