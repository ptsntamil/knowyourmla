"""
Debug script for candidate 504 (M.K. Stalin, TamilNadu2021).
Tests:
  1. clean_constituency() against all known dirty formats
  2. Constituency separation: MLA candidacy constituency vs voter-residence constituency
  3. Voter serial/part extraction
"""
import sys, re, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scraper'))

import requests
from bs4 import BeautifulSoup
from utils import clean_constituency

# ── Fetch or use cached HTML ─────────────────────────────────────────────────
CACHE = "debug_504.html"
if os.path.exists(CACHE):
    print(f"[Using cached HTML: {CACHE}]")
    with open(CACHE) as f:
        html = f.read()
else:
    url = "https://www.myneta.info/TamilNadu2016/candidate.php?candidate_id=522"
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    html = resp.text
    with open(CACHE, "w") as f:
        f.write(html)
    print(f"[Fetched fresh HTML, status {resp.status_code}]")

soup = BeautifulSoup(html, "lxml")

# ══════════════════════════════════════════════════════════════════════════════
# 1. clean_constituency() unit test
# ══════════════════════════════════════════════════════════════════════════════
print("\n=== clean_constituency() ===")
cases = [
    ("24-Thiyagarayar Nagar",       "THIYAGARAYAR NAGAR"),
    ("20 Thousand Light",           "THOUSAND LIGHT"),
    ("11 DR. RADHAKRISHNA NAGAR",   "DR. RADHAKRISHNA NAGAR"),
    ("Aruppukkottai, Tamil Nadu",   "ARUPPUKKOTTAI"),
    ("mylapoor",                    "MYLAPOOR"),
    ("KOLATHUR",                    "KOLATHUR"),
    ("6 Kolathur",                  "KOLATHUR"),
    ("52, Bargur constituency, at Serial no 637 in Part no 133", "BARGUR"),
    ("52 constituency, at Serial no 649 in Part no 166", None),
    ("attur (sc)",                     "ATTUR"),
    ("avanashi(sc)",                   "AVANASHI"),
    ("salem (north)",                  "SALEM NORTH"),
    ("No.25 Mylapore constituency, at Serial no 774 in Part no 239", "MYLAPORE"),
    ("Arakonam(Seprate) constituency, at Serial no 10 in Part no 23", "ARAKONAM"),
    ("AC-20,Thousand lights constituency, at Serial no 687 in Part no 85", "THOUSAND LIGHTS"),
    ("31-Tambaram Assembly constituency, at Serial no 787 in Part no 89", "TAMBARAM"),
    ("07-Bavanisagaru(ind) constituency, at Serial no 193 in Part no 131", "BAVANISAGARU"),
    ("98 Erode East Constituency constituency, at Serial no 285 in Part no 53", "ERODE EAST"),
    ("81-Gangavalli (Separate) constituency, at Serial no 9 in Part no 94", "GANGAVALLI"),
    ("Kumarapaliyam -97 constituency, at Serial no 303 in Part no 108", "KUMARAPALIYAM"),
    ("140, Tiruchirappalli West Assembly Constituency constituency, at Serial no 71 in Part no 48", "TIRUCHIRAPPALLI WEST"),
    ("kuunam 148 constituency, at Serial no 727 in Part no 240", "KUUNAM"),
    ("KUUNAM 148",                      "KUUNAM"),
    ("pennagaram tamilandu", "PENNAGARAM"),
    ("pennagaram tamil andu", "PENNAGARAM"),
    ("kavundanpalayam tamilnau", "KAVUNDANPALAYAM"),
    ("kavundanpalayam tamil nau", "KAVUNDANPALAYAM")
]
all_pass = True
for raw, expected in cases:
    got = clean_constituency(raw)
    if got:
        got = got.upper()
    ok  = "✅" if got == expected else "❌"
    if got != expected:
        all_pass = False
    print(f"  {ok}  {raw!r:70} -> {got!r}  (expected {expected!r})")
print(f"\n{'All clean_constituency tests passed!' if all_pass else 'SOME TESTS FAILED!'}")

# ══════════════════════════════════════════════════════════════════════════════
# 2. MLA Candidacy Constituency (from breadcrumb <a> and <h5>)
# ══════════════════════════════════════════════════════════════════════════════
print("\n=== MLA Constituency (candidacy - breadcrumb / h5) ===")

# From breadcrumb: last <a> before candidate name that contains constituency_id
breadcrumb_const = None
crumb_links = soup.select("a[href*='constituency_id']")
if crumb_links:
    raw_crumb = crumb_links[-1].get_text(strip=True)
    breadcrumb_const = clean_constituency(raw_crumb)
    print(f"  Breadcrumb raw        : {raw_crumb!r}")
    print(f"  Breadcrumb cleaned    : {breadcrumb_const!r}")

# From <h5> (current extraction method in enrichment.py)
h5_tag = soup.find("h5")
h5_raw = h5_tag.get_text(strip=True) if h5_tag else None
h5_clean = clean_constituency(h5_raw) if h5_raw else None
print(f"  h5 raw                : {h5_raw!r}")
print(f"  h5 cleaned            : {h5_clean!r}")

constituency = breadcrumb_const or h5_clean
print(f"\n  >>> constituency (to store in candidates table): {constituency!r}")

# ══════════════════════════════════════════════════════════════════════════════
# ══════════════════════════════════════════════════════════════════════════════
# 3. Voter-Residence Constituency & Relation Name (Last Name)
# ══════════════════════════════════════════════════════════════════════════════
print("\n=== Person Details (Extractor Test) ===")

# Candidate Name
name_tag = soup.find("h2")
candidate_name = name_tag.get_text(strip=True).replace("(Winner)", "").strip() if name_tag else None
print(f"  candidate_name     : {candidate_name!r}")

# Relation Name (Last Name)
# HTML: <div><b>S/o|D/o|W/o:</b> Karunanithi.M </div>
relation_tag = soup.find("b", string=re.compile(r'S/o|D/o|W/o', re.I))
lastname = None
if relation_tag:
    container = relation_tag.parent
    raw_rel = container.get_text(strip=True)
    if ":" in raw_rel:
        lastname = raw_rel.split(":", 1)[1].strip()
print(f"  lastname (relation): {lastname!r}")

# Age
age_tag = soup.find("b", string=re.compile(r'Age:', re.I))
age = None
if age_tag:
    container = age_tag.parent
    raw_age = container.get_text(strip=True)
    m = re.search(r'Age:\s*(\d+)', raw_age, re.I)
    if m:
        age = int(m.group(1))
print(f"  age                : {age!r}")

election_year = 2021
birth_year = election_year - age if age else None
print(f"  approx birth year  : {birth_year!r}")

voter_info_tag = soup.find(string=re.compile(r'Enrolled as Voter in', re.I))
voter_constituency = voter_serial_no = voter_part_no = None
if voter_info_tag:
    container = voter_info_tag.parent.parent   # <b> -> parent <div>
    raw_text  = container.get_text(strip=True).replace('\xa0', ' ')
    print(f"  Raw voter text     : {raw_text!r}")
    m = re.search(
        r'Enrolled as Voter in:\s*(?:\d+,)?\s*(.*?)\s*constituency,\s*at Serial no\s*(\d+)\s*in Part no\s*(\d+)',
        raw_text, re.I
    )
    if m:
        voter_constituency = clean_constituency(m.group(1).strip())
        voter_serial_no    = m.group(2).strip()
        voter_part_no      = m.group(3).strip()
        print(f"  voter_constituency : {voter_constituency!r}")
        print(f"  voter_serial_no    : {voter_serial_no!r}")
        print(f"  voter_part_no      : {voter_part_no!r}")
    else:
        print("  NO MATCH - voter regex failed")
else:
    print("  'Enrolled as Voter in' tag NOT FOUND")

# ══════════════════════════════════════════════════════════════════════════════
# 4. Identity Logic Test
# ══════════════════════════════════════════════════════════════════════════════
print("\n=== Person Identity Logic Test ===")

def normalize_name(n):
    return re.sub(r'[^a-zA-Z0-9]', '', n).lower() if n else ""

def generate_id(name, v_const, v_serial, v_part, lname):
    if v_const and v_serial and v_part:
        key = f"{normalize_name(v_const)}|{v_serial}|{v_part}"
        import hashlib
        return f"PERSON#{hashlib.md5(key.encode()).hexdigest()} (Voter-Hash)"
    else:
        # Improved uniqueness with lastname
        norm_name = normalize_name(name)
        norm_lname = normalize_name(lname)
        if norm_lname:
            return f"PERSON#{norm_name}_{norm_lname} (Name+Relation)"
        return f"PERSON#{norm_name} (Name-Only)"

print(f"  Identity (with voter info): {generate_id(candidate_name, voter_constituency, voter_serial_no, voter_part_no, lastname)}")
print(f"  Identity (fallback name)  : {generate_id(candidate_name, None, None, None, lastname)}")
print(f"  Identity (worst case)     : {generate_id(candidate_name, None, None, None, None)}")

# ══════════════════════════════════════════════════════════════════════════════
# 5. Summary
# ══════════════════════════════════════════════════════════════════════════════
print("\n=== Final extracted values ===")
print(f"  candidate_name     : {candidate_name!r}")
print(f"  lastname           : {lastname!r}")
print(f"  constituency       : {constituency!r}")
print(f"  voter_constituency : {voter_constituency!r}")
print(f"  voter_serial_no    : {voter_serial_no!r}")
print(f"  voter_part_no      : {voter_part_no!r}")
