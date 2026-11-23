"""Unit tests for polling station PDF downloader."""

import os
import sys
from unittest.mock import MagicMock, patch
import pytest

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from download_polling_station_pdfs import (
    fetch_pdf_catalog,
    download_single_pdf,
    download_all_constituency_pdfs,
)


def test_fetch_pdf_catalog_success():
    """Test parsing catalog from HTML containing links."""
    mock_html = """
    <html>
      <a href="PSLIST_06042026/dt1/English/AC001.pdf">1. Gummidipoondi</a>
      <a href="PSLIST_06042026/dt1/English/AC002.pdf">2. Ponneri</a>
      <a href="PSLIST_06042026/dt2/English/AC011.pdf">11. RK Nagar</a>
    </html>
    """
    mock_resp = MagicMock()
    mock_resp.text = mock_html
    mock_resp.raise_for_status = MagicMock()

    with patch("requests.get", return_value=mock_resp):
        catalog = fetch_pdf_catalog("http://dummy.url")
        assert len(catalog) == 3
        assert 1 in catalog
        assert 2 in catalog
        assert 11 in catalog
        assert "PSLIST_06042026/dt1/English/AC001.pdf" in catalog[1]


def test_fetch_pdf_catalog_empty_raises():
    """Test ValueError raised when no PDF matches are found."""
    mock_resp = MagicMock()
    mock_resp.text = "<html>No links here</html>"
    mock_resp.raise_for_status = MagicMock()

    with patch("requests.get", return_value=mock_resp):
        with pytest.raises(ValueError):
            fetch_pdf_catalog("http://dummy.url")


def test_download_single_pdf_already_exists(tmp_path):
    """Test skipping download when file exists locally."""
    dest_file = tmp_path / "AC001.pdf"
    dest_file.write_bytes(b"dummy data larger than 1024 bytes" * 100)

    ac_num, success, msg = download_single_pdf(
        1, "http://dummy/AC001.pdf", str(tmp_path), force=False
    )
    assert success is True
    assert "already exists" in msg


def test_download_single_pdf_success(tmp_path):
    """Test successful streaming download."""
    mock_resp = MagicMock()
    mock_resp.iter_content = MagicMock(return_value=[b"chunk1", b"chunk2"])
    mock_resp.raise_for_status = MagicMock()

    with patch("requests.get", return_value=mock_resp):
        ac_num, success, msg = download_single_pdf(
            2, "http://dummy/AC002.pdf", str(tmp_path), force=True
        )
        assert success is True
        assert "Downloaded AC002.pdf" in msg
        assert os.path.exists(tmp_path / "AC002.pdf")


def test_download_all_constituency_pdfs(tmp_path):
    """Test batch download orchestration across AC range."""
    fake_catalog = {
        1: "http://dummy/AC001.pdf",
        2: "http://dummy/AC002.pdf",
    }
    with patch("download_polling_station_pdfs.fetch_pdf_catalog", return_value=fake_catalog):
        with patch("download_polling_station_pdfs.download_single_pdf") as mock_dl:
            mock_dl.side_effect = [
                (1, True, "Downloaded AC001"),
                (2, True, "Downloaded AC002"),
            ]
            summary = download_all_constituency_pdfs(
                start_ac=1, end_ac=2, dest_dir=str(tmp_path)
            )
            assert summary["total"] == 2
            assert len(summary["success"]) == 2
            assert len(summary["failed"]) == 0
