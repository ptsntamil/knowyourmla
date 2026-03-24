import requests
from bs4 import BeautifulSoup
import re

url = "https://myneta.info/TamilNadu2021/candidate.php?candidate_id=1150" # Stalin? Or some ID that works
r = requests.get(url)
soup = BeautifulSoup(r.text, 'lxml')

tables = soup.find_all('table')
for idx, t in enumerate(tables):
    text = t.get_text()
    if 'Jewellery' in text or 'Motor' in text or 'Agricultural Land' in text:
        print(f"Table {idx}")
        for row in t.find_all('tr'):
            cols = [td.get_text(strip=True)[:50] for td in row.find_all(['td', 'th'])]
            print(" | ".join(cols))
        print("-" * 50)
