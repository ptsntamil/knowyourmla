# KnowYourMLA Scraper & Importer

This directory contains scripts for scraping candidate data from MyNeta and importing election results from CSV files (TCPD or OpenCity).

## Affidavit Extraction Pipeline

### batch_extract_affidavits.py
Batch extracts structured data from candidate affidavit PDFs using the Gemini API. Supports resumption, periodic saves, and API quota-aware error handling.

**Options:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--file` | `str` | `tn_2026_candidates.json` | Path to candidates JSON file |
| `--limit` | `int` | None (all) | Max number of candidates to process |
| `--party` | `str` | None (all parties) | Filter candidates by party name (case-insensitive substring match) |

**How to run:**
```bash
# Extract affidavits for all unprocessed candidates
python3 scraper/batch_extract_affidavits.py

# Limit to first 10 candidates
python3 scraper/batch_extract_affidavits.py --limit 10

# Extract only for a specific party
python3 scraper/batch_extract_affidavits.py --party "Naam Tamilar Katchi"

# Combine party filter with a limit
python3 scraper/batch_extract_affidavits.py --party "Dravida Munnetra Kazhagam" --limit 20
```

**Notes:**
- Already-extracted candidates (`extraction_status: success`) are skipped automatically.
- The `--party` match is case-insensitive and supports partial names (e.g., `--party "DMK"` or `--party "Congress"`).
- Progress is saved every 5 extractions to prevent data loss.

## Scraper Pipeline

### 1. Scrape MyNeta Winners
Extracts detailed candidate information (assets, criminal cases, education) for winners of a specific election.
```bash
python3 main.py --years TamilNadu2021
```

### 2. enrichment.py
Core pipeline for candidate enrichment and identity resolution.

**When to use:**
- After importing the initial winner list from CSV or IndiaVotes.
- When you need to pull detailed financial and legal data from MyNeta.
- When you want to link candidates across different election years into unified Person profiles.

**Why to use:**
- It handles deobfuscation of MyNeta HTML to extract protected data.
- It uses a multi-factor matching algorithm (IdentityResolver) to prevent duplicate Person records.
- it discovers historical election data that might be missing from the primary source.

**Where to use:**
- Run from the project root.
- Targets 'knowyourmla_candidates', 'knowyourmla_persons', and 'knowyourmla_constituencies'.

**How to run:**
```bash
# Enrich winners for a specific year
python3 scraper/enrichment.py --year 2021

# Targeted enrichment with concurrency
python3 scraper/enrichment.py --year 2016 --threads 10 --max_id 1000
```

### 3. extract_bye_election_results.py
Extracts official bye-election results directly from Election Commission of India (ECI) results portal pages (`ConstituencywiseS22*.htm`) and formats them into the standard OpenCity CSV schema supported by `import_election_csv.py`.

**When to use:**
- When bye-election results have been counted and published by ECI on `results.eci.gov.in`.
- To generate standardized OpenCity CSV results with accurate margins, turnout, and candidate vote shares.

**How to run:**
```bash
# Extract default October 2026 bye-elections (Madurantakam & Dharapuram)
python3 scraper/extract_bye_election_results.py

# Extract specific URLs with custom election date and output
python3 scraper/extract_bye_election_results.py \
  --urls "https://results.eci.gov.in/ResultAcByeOct2026/ConstituencywiseS2235.htm" \
         "https://results.eci.gov.in/ResultAcByeOct2026/ConstituencywiseS22101.htm" \
  --date 2026/10/6 \
  --output scraper/assets/OpenCity_TN_Assembly_Bye_Election_202610.csv
```

## Data Import

### import_election_csv.py
Generic script to import election results from TCPD or OpenCity CSV formats.

**When to use:**
- When you have new election result datasets (like the OpenCity 2011 TN Assembly data).
- When you need to backfill historical results that aren't easily scrapable.

**Why to use:**
- It performs intelligent deduplication to link candidates to existing Person records.
- **Turncoat Matching**: When `Turncoat` is `TRUE`, cross-party candidate matching is enabled to properly link candidates who changed party between election cycles or in bye-elections, matching on name and birth year/age consistency.
- **Explicit `candidate_id` Support**: If a `candidate_id` column is provided in the CSV (e.g. `AFFIDAVIT#2026#1858` or numeric `1858`), the importer uses that ID to update that exact candidate record and preserves its linked `person_id`.
- It automatically updates constituency-level statistics (total votes polled, etc.).
- It handles data normalization (currency, percentages, names).

**Where to use:**
- Run this from the project root.
- It interacts directly with the DynamoDB production tables (or local/dev if configured).

**How to run:**
```bash
# Basic import (OpenCity 2011 is the default)
python3 scraper/import_election_csv.py

# Specify a different CSV
python3 scraper/import_election_csv.py --csv path/to/data.csv

# Run a dry run to verify logic without DB writes
python3 scraper/import_election_csv.py --dryrun

# Chunked import for large files
python3 scraper/import_election_csv.py --start 500 --limit 100
```

### update_constituency_stats_2016.py
Updates constituency statistics (total electors and voter turnout) specifically for the 2016 election year from the OpenCity CSV.

**How to run:**
```bash
# Update with defaults (OpenCity 2016)
python3 scraper/update_constituency_stats_2016.py

# Run a dry run
python3 scraper/update_constituency_stats_2016.py --dryrun
```

### update_party_vote_share.py
Updates political parties with historical vote share data from `assets/party_vote_share.json`.

**How to run:**
```bash
# Update with defaults
python3 scraper/update_party_vote_share.py

# Run a dry run to verify matches
python3 scraper/update_party_vote_share.py --dry-run

# Limit to first N parties
python3 scraper/update_party_vote_share.py --limit 10
```

### polling_station_extracter.py
Extracts Form 20 PDF polling station voting results chunk-by-chunk using Gemini AI. Accepts optional ground truth counts for candidates and polling stations to optimize chunk size, prevent hallucinated candidate columns, and accurately terminate extraction.

Includes automated post-extraction verification: checks that each extracted polling station contains votes matching the expected candidate count, and automatically reruns targeted extraction for any stations with mismatched or missing candidate votes.

**How to run:**
```bash
# Basic extraction (detects candidates and stations from PDF, verifies candidate count across all stations)
python3 scraper/helper/polling_station_extracter.py 128

# Extraction with ground truth candidate count and total station count
python3 scraper/helper/polling_station_extracter.py 128 --candidates-count 14 --station-count 242
# Or using short options:
python3 scraper/helper/polling_station_extracter.py 128 -c 14 -s 242

# Force re-downloading PDF even if it already exists locally
python3 scraper/helper/polling_station_extracter.py 128 --force-download
```

### import_polling_data.py
Imports booth-level polling station results, postal ballot totals, and constituency summary records from Form 20 JSON files into the DynamoDB `knowyourmla_polling_results` table.

**How to run:**
```bash
# Generate candidate mapping from DynamoDB
python3 scraper/import_polling_data.py --generate-mapping --year 2026

# Dry run on a constituency Form 20 JSON
python3 scraper/import_polling_data.py scraper/assets/2026/ac/polling/128.json --dry-run

# Ingest single constituency
python3 scraper/import_polling_data.py scraper/assets/2026/ac/polling/128.json

# Batch import all local AC JSON files
for file in scraper/assets/2026/ac/polling/[0-9][0-9][0-9].json; do
  python3 scraper/import_polling_data.py "$file"
done
```

### check_imported_polling_data.py
Checks which assembly constituencies and polling station data are already imported into DynamoDB (`knowyourmla_polling_results`), comparing against local JSON files and the 234 master constituencies.

**How to run:**
```bash
# Check import summary across all constituencies
python3 scraper/check_imported_polling_data.py

# Include detailed polling station counts per AC
python3 scraper/check_imported_polling_data.py --count-stations

# Check a specific constituency by number or name
python3 scraper/check_imported_polling_data.py --ac 128
python3 scraper/check_imported_polling_data.py --ac oddanchatram

# Show only unimported / pending constituencies
python3 scraper/check_imported_polling_data.py --only-missing

# Output report in JSON format
python3 scraper/check_imported_polling_data.py --json
```

## Verification
Run the deduplication verification suite to ensure identity resolution is working correctly:
```bash
python3 verify_dedup.py
```

Run automated tests:
```bash
pytest tests/test_election_import_mock.py
```
