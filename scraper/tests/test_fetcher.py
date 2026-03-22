import pytest
import httpx
from unittest.mock import AsyncMock, patch
from scraper.fetcher import AsyncFetcher

@pytest.mark.async_context
@pytest.mark.asyncio
async def test_fetch_success():
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value = MagicMock(status_code=200, text="Success")
        mock_get.return_value.raise_for_status = MagicMock()
        
        fetcher = AsyncFetcher()
        result = await fetcher.fetch("http://example.com")
        
        assert result == "Success"
        mock_get.assert_called_once()
        await fetcher.close()

@pytest.mark.asyncio
async def test_fetch_retry_success():
    with patch("httpx.AsyncClient.get") as mock_get:
        # First call fails, second succeeds
        mock_get.side_effect = [
            httpx.RequestError("Failed"),
            MagicMock(status_code=200, text="Success")
        ]
        
        # Mocking asyncio.sleep to avoid waiting during tests
        with patch("asyncio.sleep", return_value=None):
            fetcher = AsyncFetcher()
            result = await fetcher.fetch("http://example.com")
            
            assert result == "Success"
            assert mock_get.call_count == 2
            await fetcher.close()

@pytest.mark.asyncio
async def test_fetch_persistent_failure():
    with patch("httpx.AsyncClient.get", side_effect=httpx.RequestError("Persistent Failure")):
        with patch("asyncio.sleep", return_value=None):
            fetcher = AsyncFetcher()
            result = await fetcher.fetch("http://example.com")
            
            assert result is None
            # Assuming MAX_RETRIES=3 from config
            assert httpx.AsyncClient.get.call_count >= 1 
            await fetcher.close()

@pytest.mark.asyncio
async def test_fetch_http_error():
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError("404", request=MagicMock(), response=mock_response)
        mock_get.return_value = mock_response
        
        with patch("asyncio.sleep", return_value=None):
            fetcher = AsyncFetcher()
            result = await fetcher.fetch("http://example.com")
            
            assert result is None
            await fetcher.close()

from unittest.mock import MagicMock
