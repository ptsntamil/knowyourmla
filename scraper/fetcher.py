import asyncio
import httpx
from typing import Optional
from scraper.config import logger, USER_AGENT, CONCURRENCY_LIMIT, REQUEST_DELAY, MAX_RETRIES, TIMEOUT

class AsyncFetcher:
    def __init__(self):
        self.client = httpx.AsyncClient(
            headers={"User-Agent": USER_AGENT},
            timeout=TIMEOUT,
            follow_redirects=True
        )
        self.semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)

    async def fetch(self, url: str) -> Optional[str]:
        """Fetch URL content with concurrency control, delay, and retry logic."""
        async with self.semaphore:
            for attempt in range(MAX_RETRIES):
                try:
                    logger.info(f"Fetching: {url} (Attempt {attempt + 1})")
                    
                    # Politeness delay
                    await asyncio.sleep(REQUEST_DELAY)
                    
                    response = await self.client.get(url)
                    response.raise_for_status()
                    return response.text
                
                except (httpx.RequestError, httpx.HTTPStatusError) as e:
                    logger.warning(f"Error fetching {url}: {e}. Retrying...")
                    if attempt == MAX_RETRIES - 1:
                        logger.error(f"Failed to fetch {url} after {MAX_RETRIES} attempts.")
                        return None
                    
                    # Exponential backoff
                    wait_time = (2 ** attempt) + REQUEST_DELAY
                    await asyncio.sleep(wait_time)
            return None

    async def close(self):
        await self.client.aclose()
