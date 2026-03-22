import re
import json
import os
import logging
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)

# Reservation categories to strip from names
RESERVATION_CATEGORIES: List[str] = ["SC", "ST", "GEN", "Seprate", "ind", "Separate"]

def clean_name(name: str) -> str:
    """Clean name by removing extra whitespaces and newlines."""
    return " ".join(name.split())

def clean_currency_to_int(currency_str: str) -> int:
    """Convert currency strings like 'Rs 1,23,456' to integer 123456.
    
    Robustness: Isolates only the FIRST sequence of digits/commas to avoid
    accidentally merging trailing digits from unit labels like '21 Lacs+'.
    """
    if not currency_str or currency_str.lower() == 'nil':
        return 0
    
    # Isolate the first sequence of digits and commas
    match = re.search(r'([\d,]+)', currency_str)
    if not match:
        return 0
        
    num_str = match.group(1)
    # Remove everything except digits
    clean_str = re.sub(r'[^\d]', '', num_str)
    return int(clean_str) if clean_str else 0

def clean_percentage_to_float(percent_str: str) -> float:
    """Convert percentage strings like '45.67%' to float 45.67."""
    if not percent_str:
        return 0.0
    match = re.search(r'(\d+\.?\d*)', percent_str)
    return float(match.group(1)) if match else 0.0

def extract_gender(parent_name_str: str) -> str:
    """Infer gender from S/o, D/o, W/o markers."""
    if not parent_name_str:
        return "Not Specified"
    
    if "S/o" in parent_name_str:
        return "Male"
    elif "D/o" in parent_name_str or "W/o" in parent_name_str:
        return "Female"
    return "Not Specified"

def clean_constituency(name: str) -> Optional[str]:
    """Extract only the cleaned constituency name from raw strings.

    - Strips leading numbers, AC prefixes, and trailing state suffixes.
    - Handles long voter enrollment strings and redundant keywords.
    - Normalizes and cleans up whitespace in lowercase.
    Returns {str | None} - Lowercase cleaned constituency name or None if the cleaned name is empty or contains only digits .
    """
    if not name:
        return None
    # logger.info(f"Cleaning constituency: {name}")
    # Step 1: Initial cleanup and long voter-enrollment strings
    # "52, Bargur constituency, at Serial no 637 in Part no 133" -> "52, Bargur"
    res = name.lower().strip()
    if re.search(r'\bconstituency\b', res) and re.search(r'\bserial\s+no\b', res):
        # Strip away "constituency..." and noise immediately before it (numbers, "Assembly", etc.)
        res = re.sub(r'[\s\-,\.]*\d*\s*(?:assembly\s+|constituency\s+)*constituency.*$', '', res)

    # Step 2: Strip leading noise (numbers/prefixes)
    # "No.25 ", "AC-20, ", "226. "
    res = re.sub(r'^(?:no\.|ac-)?\s*\d+[\.,\-\s]*', '', res)

    # Step 3: Strip trailing noise (State names, comma suffixes, parentheses categories)
    # Covers: " - tamil nadu", " - tamil andu", ", chennai", "tamilnau"
    res = re.sub(r'[\s,\-]+tamil\s*(?:nadu|andu|nau)\s*$', '', res)
    res = res.split(',')[0]

    # Handle reservation categories: (sc), (st), (separate), etc.
    cat_pattern = "|".join(c.lower() for c in RESERVATION_CATEGORIES)
    res = re.sub(rf'\(({cat_pattern})\)', '', res)
    
    # Merge directional descriptors: "coimbatore (North)" -> "coimbatore North"
    res = re.sub(r'\(([^)]+)\)', r' \1', res)

    # Step 4: Final normalization and keyword/trailing number stripping
    # Remove "constituency" and "assembly" keywords
    res = re.sub(r'\b(?:constituency|assembly)\b', '', res)
    res = re.sub(r'\s*\b\d+$', '', res) # Remove trailing numbers: "KUUNAM 148" -> "KUUNAM"
    
    cleaned = " ".join(res.split())
    
    if not cleaned or cleaned.isdigit():
        return None

    return cleaned


# Map of known alias spellings → canonical normalized_name
CONSTITUENCY_ALIAS_MAP = {
    "peryakulam": "periyakulam",
    "rknagar": "drradhakrishnannagar",
    "southtirpur": "tiruppursouth",
    "tirupurnorth": "tiruppurnorth",
    "thiruvannamalai": "tiruvannamalai",
    "palavaram": "pallavaram",
    "srivillputhur": "srivilliputhur",
    "boidnayakkanur": "bodinayakkanur",
    "annaikattu": "anaikattu",
    "andhiyur": "anthiyur",
    "sriparmbuthur": "sriperumbudur",
    "udumalpet": "udumalaipettai",
    "edapadi": "edappadi",
    "kumbakonnam": "kumbakonam",
    "manaparai": "manapparai",
    "muthukulathure": "mudukulathur",
    "vriddhachalam": "vridhachalam",
    "veppanahallil": "veppanahalli",
    "tnagar": "thiyagarayanagar"
}


# In-memory cache for dynamic aliases
_DYNAMIC_ALIASES: Optional[Dict[str, str]] = None

def get_all_aliases() -> Dict[str, str]:
    """Retrieve combined alias map (hardcoded + JSON)."""
    global _DYNAMIC_ALIASES
    if _DYNAMIC_ALIASES is None:
        _DYNAMIC_ALIASES = {}
        # Try to load from JSON if it exists
        json_path = os.path.join(os.path.dirname(__file__), "assets", "constituency_aliases.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    _DYNAMIC_ALIASES = json.load(f)
            except Exception:
                pass
    
    # Merge hardcoded into dynamic (hardcoded wins if conflict)
    combined = {**_DYNAMIC_ALIASES, **CONSTITUENCY_ALIAS_MAP}
    return combined


def canonicalize_constituency(name: str) -> Optional[str]:
    """Return canonical normalized constituency key, applying alias mapping.

    1. Clean via clean_constituency
    2. Normalize (lowercase, strip non-alphanumeric)
    3. Map known aliases to a single canonical form
    """
    cleaned = clean_constituency(name)
    if not cleaned:
        return None
    norm = normalize_name(cleaned)
    aliases = get_all_aliases()
    return aliases.get(norm, norm)


def normalize_name(name: str) -> str:
    """Normalize name by converting to lowercase and removing non-alphanumeric characters."""
    if not name:
        return ""
    # Remove everything except alphanumeric
    clean_str = re.sub(r'[^a-zA-Z0-9]', '', name)
    return clean_str.lower()

def strip_initials(name: str) -> str:
    """Remove 1-2 character tokens (initials) and common titles from a name string.
    Includes light phonetic simplification to ensure stable IDs across transliterations.
    """
    if not name:
        return ""
    # Tokens can be mixed with punctuation like (Winner)
    name_clean = name.replace('(Winner)', '').replace('(winner)', '')
    tokens = re.findall(r'[a-zA-Z0-9]+', name_clean)
    titles = {'thiru', 'mr', 'mrs', 'ms', 'dr', 'smt', 'winner', 'late', 'alias', 'mister', 'shri', 'mgr'}
    long_tokens = []
    for t in tokens:
        t = t.lower()
        if len(t) > 2 and t not in titles:
            # Phonetic simplification for stable IDs
            t = t.replace('sh', 's').replace('ch', 's').replace('zh', 'l').replace('z', 's')
            t = t.replace('dh', 't').replace('th', 't').replace('d', 't').replace('h', '').replace('y', '').replace('v', '').replace('w', '')
            t = t.replace('g', 'k').replace('b', 'p').replace('j', 's').replace('f', 'p')
            # Vowel normalization
            t = t.replace('aa', 'a').replace('ee', 'e').replace('ii', 'i').replace('oo', 'o').replace('uu', 'u')
            t = t.replace('e', 'a').replace('i', 'a').replace('u', 'o')
            # Ignore 'r' before consonants
            t = re.sub(r'r([ptkbsd])', r'\1', t)
            # Reduce double letters
            t = re.sub(r'(.)\1+', r'\1', t)
            long_tokens.append(t)
    return "".join(long_tokens)

def names_are_similar(name1: str, name2: str) -> bool:
    """Heuristic for name similarity (synced across all scripts).
    Handles initials, phonetic variations, and common titles.
    """
    n1, n2 = normalize_name(name1), normalize_name(name2)
    if not n1 or not n2: return False
    if n1 == n2: return True
    
    # 1. Try matching by stripping potential initials (all 1-2 char tokens)
    st1, st2 = strip_initials(name1), strip_initials(name2)
    if st1 and st2 and st1 == st2: return True
    
    # 2. Phonetic simplifications
    def simplify(s):
        # Strip common titles
        for title in ['mr', 'mrs', 'ms', 'dr', 'thiru', 'smt']:
            if s.startswith(title) and len(s) > len(title) + 2:
                s = s[len(title):]
        
        # Phonetic simplifications
        s = s.replace('sh', 's').replace('ch', 's').replace('zh', 'l').replace('z', 's')
        s = s.replace('dh', 't').replace('th', 't').replace('d', 't').replace('h', '').replace('y', '').replace('v', '').replace('w', '')
        s = s.replace('g', 'k').replace('b', 'p').replace('j', 's').replace('f', 'p').replace('x', 's')
        s = s.replace('ar', 'er').replace('ir', 'er').replace('ur', 'er').replace('or', 'er')
        s = s.replace('aa', 'a').replace('ee', 'e').replace('ii', 'i').replace('oo', 'o').replace('uu', 'u')
        s = s.replace('e', 'a').replace('i', 'a').replace('u', 'o')
        # Normalize diphthongs/vowel clusters
        s = s.replace('ao', 'o').replace('oa', 'o').replace('ou', 'o').replace('ow', 'o').replace('aw', 'o').replace('ai', 'ei')
        # Ignore 'r' before consonants
        s = re.sub(r'r([ptkbsd])', r'\1', s)
        # Reduce double letters
        s = re.sub(r'(.)\1+', r'\1', s)
        return s
        
    s1, s2 = simplify(n1), simplify(n2)
    if s1 == s2: return True
    
    # 4. Suffix matching (e.g., 'palanivelrajamanickam' matches 'rajamanickam')
    if len(s1) >= 6 and len(s2) >= 6:
        if s1.endswith(s2) or s2.endswith(s1): return True
            
    # 5. Try matching by stripping potential initials (1-2 chars usually, 3 for very long names)
    # Handles merged initials like 'pveluchamy'
    max_strip = 3 if (len(s1) > 8 or len(s2) > 8) else 2
    for i in range(1, max_strip + 1):
        if len(s1) > i + 3: # Ensure we don't strip too much of a short name
            if s1[i:] == s2 or s1[:-i] == s2: return True
        if len(s2) > i + 3:
            if s2[i:] == s1 or s2[:-i] == s1: return True
            
    return False
