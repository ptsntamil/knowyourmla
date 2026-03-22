import sys
import os

# Add the parent directory to sys.path so that 'scraper' can be imported as a package
# when running pytest from within the scraper directory.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
