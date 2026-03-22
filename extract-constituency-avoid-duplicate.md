Practical ways to automate it
1. Auto-suggest aliases from real data (semi-automatic)
During enrichment:
Compute norm = normalize_name(clean_constituency(raw_name)).
If norm is not found in knowyourmla_constituencies but is Levenshtein‑close (or RapidFuzz score ≥ 90) to an existing normalized_name, log a suggestion:
e.g. peryakulam → existing periyakulam.
Periodically:
Run a small script that:
Scans all distinct raw constituency strings from winners/affidavits.
For each, compute norm.
Compare against the canonical list of normalized_name from knowyourmla_constituencies using rapidfuzz.process.extractOne.
Emit a CSV/JSON of {"alias": "...", "canonical": "...", "score": 96} for human review.
You then approve these suggestions and they get merged into your alias map.
2. Store aliases in DynamoDB instead of code
Add an aliases list to knowyourmla_constituencies.
When you accept alias → canonical from the previous step, append the alias into aliases for that row.
On lookup:
Build an in‑memory dict at startup: alias_or_norm → canonical_norm from:
normalized_name itself
All entries in aliases.
This means once an alias is accepted, you don’t touch code again.
3. Use phonetic helpers to reduce manual entries
Optionally compute a phonetic key (e.g. metaphone or DoubleMetaphone) for both:
New clean_constituency values
Existing canonical names.
Only propose alias candidates when:
Phonetic keys match and
Fuzzy score is high.
This further cuts down spurious suggestions you’d need to review.
What I’d implement now in your project
1. Add aliases field to knowyourmla_constituencies schema (README + code).
2. Add a small “suggest_aliases.py” script that:
Reads all distinct details['constituency'] and details['voter_constituency'] from existing data.
Fuzzy matches them against the canonical list.
Writes a suggested_aliases.json file for review.
3. Extend canonicalize_constituency to:
Load these accepted aliases from a JSON file (committed to repo) or from aliases in DynamoDB, instead of hard‑coded dict.
If you’d like, I can implement step 2 (a one‑off suggest_aliases.py) and wire canonicalize_constituency to read an alias JSON instead of a hard-coded map.