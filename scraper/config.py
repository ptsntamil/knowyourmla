import logging
import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = BASE_DIR / "logs"
DATA_DIR = BASE_DIR / "data"

# Create directories if they don't exist
LOG_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# Scraper Settings
BASE_URL = "https://www.myneta.info"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
CONCURRENCY_LIMIT = 5
REQUEST_DELAY = 2.0  # seconds
MAX_RETRIES = 3
TIMEOUT = 30.0  # seconds

# Logging Configuration
LOG_FILE = LOG_DIR / "scraper.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("myneta_scraper")

# Election years to search for
STATE_SLUGS = ["TamilNadu", "tamilnadu", "tn"]
