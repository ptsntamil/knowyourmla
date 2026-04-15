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

## Data Import

### import_election_csv.py
Generic script to import election results from TCPD or OpenCity CSV formats.

**When to use:**
- When you have new election result datasets (like the OpenCity 2011 TN Assembly data).
- When you need to backfill historical results that aren't easily scrapable.

**Why to use:**
- It performs intelligent deduplication to link candidates to existing Person records.
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

## Verification
Run the deduplication verification suite to ensure identity resolution is working correctly:
```bash
python3 verify_dedup.py
```

Run automated tests:
```bash
pytest tests/test_election_import_mock.py
```
