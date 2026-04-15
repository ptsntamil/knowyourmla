# KnowYourMLA – Database Design

## Overview

The project uses **four DynamoDB tables** across two logical layers:

| Layer | Table | Purpose |
|---|---|---|
<!-- | Legacy / Raw | `tn_political_data` | Original single-table — winners + constituency history | -->
| Enrichment | `knowyourmla_constituencies` | Master constituency registry |
| Enrichment | `knowyourmla_persons` | Unique person identity |
| Enrichment | `knowyourmla_candidates` | Full affidavit data per candidate per election year |
| Enrichment | `knowyourmla_political_parties` | Master registry of political parties |
| Enrichment | `knowyourmla_states` | Master registry of states |
| Enrichment | `knowyourmla_districts` | Master registry of districts |

All tables share a `PK` / `SK` composite primary key convention.

---

<!-- ## Table 1 — `tn_political_data` (Legacy Single Table)

Stores constituency metadata, year-level stats, and election winners scraped from the raw source.

### Entity Types

#### 1a. Constituency Master
| Field | Value |
|---|---|
| `PK` | `CONSTITUENCY#{normalized_name}` |
| `SK` | `PROFILE` |

```json
{
  "PK": "CONSTITUENCY#gummidipoondi",
  "SK": "PROFILE",
  "entity_type": "CONSTITUENCY",
  "name": "Gummidipoondi",
  "ac_no": 1
}
```

#### 1b. Constituency Year Metadata
| Field | Value |
|---|---|
| `PK` | `CONSTITUENCY#{normalized_name}` |
| `SK` | `YEAR#{year}` |

```json
{
  "PK": "CONSTITUENCY#gummidipoondi",
  "SK": "YEAR#2021",
  "entity_type": "CONSTITUENCY_YEAR",
  "year": 2021,
  "reservation_type": "GEN",
  "district_id": "DISTRICT#thiruvallur",
  "total_electors": 259194,
  "total_votes": 212864,
  "poll_percent": 82.1
}
```

#### 1c. Election Winner
| Field | Value |
|---|---|
| `PK` | `CONSTITUENCY#{normalized_name}` |
| `SK` | `YEAR#{year}#WINNER` |

```json
{
  "PK": "CONSTITUENCY#kolathur",
  "SK": "YEAR#2021#WINNER",
  "entity_type": "ELECTION_WINNER",
  "year": 2021,
  "candidate_name": "M.K. STALIN",
  "party": "DMK",
  "margin": 50000,
  "GSI1PK": "CANDIDATE#mkstalin",
  "GSI1SK": "YEAR#2021"
}
```

### GSIs on `tn_political_data`

| GSI | Partition Key | Sort Key | Use Case |
|---|---|---|---|
| GSI1 | `CANDIDATE#{normalized_name}` | `YEAR#{year}` | All elections for a candidate |
| GSI2 | `YEAR#{year}` | `CONSTITUENCY#{normalized_name}` | All constituencies for a year |
| GSI3 | `CONSTITUENCY#{normalized_name}` | `YEAR#{year}` | Constituency timeline |

--- -->

## Table 2 — `knowyourmla_constituencies`

Master registry of all Tamil Nadu assembly constituencies. One record per constituency, created on first encounter during enrichment.

| Field | Value |
|---|---|
| `PK` | `CONSTITUENCY#{normalized_name}` |
| `SK` | `METADATA` |

### Fields

| Field | Type | Description |
|---|---|---|
| `PK` | String | `CONSTITUENCY#{normalized_name}` |
| `SK` | String | `METADATA` |
| `name` | String | Clean display name (e.g. `KOLATHUR`) |
| `normalized_name` | String | Lowercase, alphanumeric only (e.g. `kolathur`) |
| `district_id` | String | FK → `knowyourmla_districts` PK |
| `type` | String | Reservation type: `GEN`, `SC`, or `ST` |
| `id` | String | Original Myneta `constituency_id` (optional, populated by `extract_constituencies.py`) |
| `source_url` | String | Source Myneta URL for the constituency (optional) |
| `aliases` | List | Normalized aliases found in data (e.g. `["peryakulam", "rknagar"]`) |
| `statistics` | Map | Year-specific statistics (e.g. `{"2026": {"total_electors": 300000, "total_votes_polled": 250000, "poll_percentage": 83.3, "male": 145000, "female": 154950, "third_gender": 50}}`) |
| `created_at` | Number | Unix timestamp |

### Sample Record

```json
{
  "PK": "CONSTITUENCY#kolathur",
  "SK": "METADATA",
  "name": "KOLATHUR",
  "normalized_name": "kolathur",
  "district_id": "DISTRICT#chennai",
  "type": "GEN",
  "id": "49",
  "source_url": "https://www.myneta.info/TamilNadu2021/index.php?action=show_candidates&constituency_id=49",
  "aliases": ["drradhakrishnanagar", "rknagar"],
  "statistics": {
    "2026": {
      "total_electors": 312000,
      "total_votes_polled": 245000,
      "poll_percentage": 78.5,
      "male": 152000,
      "female": 159980,
      "third_gender": 20
    },
    "2021": {
      "total_electors": 259194,
      "total_votes_polled": 212864,
      "poll_percentage": 82.1
    },
    "2016": {
      "total_electors": 234123,
      "total_votes_polled": 198765,
      "poll_percentage": 84.9
    }
  },
  "created_at": 1771825000
}
```

> **Note:** This table is used for **both** MLA candidacy constituencies (written by `process_candidate`) and voter-residence constituencies (written by `get_or_create_person`). They share the same schema and key format.

> **Seeder:** The standalone script `scraper/extract_constituencies.py` can be used to pre-populate this table from [`https://www.myneta.info/TamilNadu2021/`](https://www.myneta.info/TamilNadu2021/), attaching `id` and `source_url` alongside the normalized name.

---

## Table 3 — `knowyourmla_persons`

Unique person identities, de-duplicated across election years using a **multi-factor matching strategy**. While voter enrollment data (constituency + serial no + part no) is captured, identification prioritizes stable factors to handle changes in electoral rolls between elections.

| Field | Value |
|---|---|
| `PK` | `PERSON#{unique_hash}` or `PERSON#{normalized_name}` |
| `SK` | `METADATA` |

### Identification & Deduplication Logic

When a new candidate is processed, the system attempts to find an existing person record:
1. **Name Match**: Searches the `NameIndex` GSI for records with the same `normalized_name`. The `normalized_name` is aggressively simplified (handling phonetic clusters like `au/ow`, phonetic swaps `g/k`, `d/t`, and vowel drift `a/e/i`).
2. **Relation Similarity**: Compares the `lastname` (S/o, D/o, W/o) using a phonetic/heuristic similarity check including suffix matching (e.g., "Kuppusamy" matches "Kuppanan Alias Kuppusamy").
3. **Birth Year Tolerance & Constituency Booster**: 
   - Standard tolerance is **+/- 2 years**.
   - **Constituency Booster**: If the candidate is in the **SAME constituency** as any existing record, tolerance increases to **+/- 5 years** to handle age reporting drift.
   - **Same-Year Disambiguation**: If two candidates share the same phonetic profile in the **SAME election year** but are in **DIFFERENT constituencies**, they are treated as distinct individuals **UNLESS** one is a **Bye-Election** (Sequential Election) or their voter registration details (Serial No and Part No) match exactly.

If no logical match is found, a new deterministic ID is generated:
- Base: `PERSON#{phonetic_normalized_name}_{phonetic_normalized_relation}`.
- **Collision Suffixing**: If the generated ID already exists (collision), a numerical suffix (`_2`, `_3`) is appended until a unique ID is found.

### Fields

| Field | Type | Description |
|---|---|---|
| `PK` | String | `PERSON#{deterministic_md5_hash}` |
| `SK` | String | `METADATA` |
| `name` | String | Candidate full name (display) |
| `lastname` | String | Relation Name (S/o, D/o, W/o) used for uniqueness |
| `normalized_name` | String | Cleaned name (lowercase, no special chars) |
| `birth_year` | Number | Approximate year of birth (calculated from age and election year) |
| `voter_constituency_id` | String | FK → `knowyourmla_constituencies` PK (voter-residence constituency) |
| `voter_serial_no` | String | Serial number on electoral roll |
| `voter_part_no` | String | Part number on electoral roll |
| `created_at` | Number | Unix timestamp |
| `createdtime` | String | ISO 8601 formatted creation timestamp |
| `pan_number` | String | PAN number of the candidate(Can be used as unique identifier) |

### Sample Record

```json
{
  "PK": "PERSON#3f2a5bd91c4e7a82f0d6b5c1e9a03f7d",
  "SK": "METADATA",
  "name": "M.K. STALIN",
  "normalized_name": "mkstalin",
  "voter_constituency": "mylapoor",
  "voter_constituency_id": "CONSTITUENCY#mylapoor",
  "voter_serial_no": "24",
  "voter_part_no": "132",
  "created_at": 1771825000,
  "createdtime": "2026-02-26T11:12:06.000000+00:00"
  "pan_number": "ABCDE1234F"
}
```

> **Note:** Voter constituency is referenced only via `voter_constituency_id` to the master constituency table, avoiding duplication of constituency names across tables.

---

## Table 4 — `knowyourmla_candidates`

Full affidavit details for every candidate (winner and loser) in every election year, scraped from myneta.info. One record per candidate per year.

| Field | Value |
|---|---|
| `PK` | `AFFIDAVIT#{year}#{myneta_candidate_id}` |
| `SK` | `DETAILS` |

### Fields

| Field | Type | Description |
|---|---|---|
| `PK` | String | `AFFIDAVIT#{year}#{myneta_id}` |
| `SK` | String | `DETAILS` |
| `person_id` | String | FK → `knowyourmla_persons` PK |
| `constituency_id` | String | FK → `knowyourmla_constituencies` PK (MLA candidacy constituency) |
| `is_winner` | Boolean | Whether this candidate won this election |
| `year` | Number | Election year |
| `profile_url` | String | Source URL on myneta.info |
| `candidate_name` | String | Display name |
| `party_id` | String | FK → `knowyourmla_political_parties` PK |
| `profession` | String | Self-declared profession |
| `education` | String | Education category |
| `total_assets` | Number | Total assets in INR |
| `total_liabilities` | Number | Total liabilities in INR |
| `criminal_cases` | Number | Number of declared criminal cases |
| `income_itr` | Map | Latest ITR income for all family members (self, spouse, dependent1...) |
| `itr_history` | Map | Year-range → amount map per relation (self, spouse, dependent1...) |
| `election_expenses` | Number | Declared election expenses in INR |
| `profile_pic` | String | URL to candidate photo (may be `null`) |
| `district_id` | String | FK → `knowyourmla_districts` PK |
| `error` | Boolean | Whether this record had an extraction error (optional) |
| `message` | String | Error message detail if `error` is true (optional) |
| `election_type` | String | "Assembly" or "Lok Sabha" |
| `candidacy_type` | String | "General" or "Bye-Election" |
| `election_date` | String | Date of election (for bye-elections) |
| `total_votes` | Number | Total votes polled in the AC (for winners) or total votes received by candidate (for others) |
| `winning_margin` | Number | Margin of victory in votes (for winners) |
| `margin_percentage` | Number | Margin of victory as percentage (for winners) |
| `gold_assets` | Map | Categorized gold details (self, spouse, dependents) |
| `silver_assets` | Map | Categorized silver details (self, spouse, dependents) |
| `vehicle_assets` | Map | Categorized vehicle details (self, spouse, dependents) |
| `land_assets` | Map | Categorized land details (self, spouse, dependents) including `entries`, `total`, and `full_text` |
| `createdtime` | String | ISO 8601 formatted creation timestamp |

### Sample Record

```json
{
  "PK": "AFFIDAVIT#2021#504",
  "SK": "DETAILS",
  "person_id": "PERSON#3f2a5bd91c4e7a82f0d6b5c1e9a03f7d",
  "constituency_id": "CONSTITUENCY#kolathur",
  "is_winner": true,
  "year": 2021,
  "profile_url": "https://www.myneta.info/TamilNadu2021/candidate.php?candidate_id=504",
  "candidate_name": "M.K. STALIN",
  "party_id": "PARTY#dmk",
  "profession": "social service",
  "education": "Graduate",
  "total_assets": 88875339,
  "total_liabilities": 0,
  "criminal_cases": 0,
  "income_itr": 0,
  "itr_history": {
    "self": { "2019-2020": 500000 }
  },
  "election_expenses": 2800000,
  "profile_pic": "https://myneta.info/images_candidate/TN2021/504.jpg",
  "district_id": "DISTRICT#chennai",
  "total_votes": 212864,
  "winning_margin": 50000,
  "margin_percentage": 23.5,
  "gold_assets": {
    "self": {
      "gold": "40 Gram",
      "value": "172000",
      "raw_text": "40 Gram Gold\n1,72,000"
    }
  },
  "silver_assets": {
    "self": {
      "silver": "2 KG",
      "value": "130000",
      "raw_text": "2 KG Silver\n1,30,000"
    }
  },
  "vehicle_assets": {
    "self": [
      {
        "name": "Hyundai Creta Car",
        "vehicle": "TN 94Z23487",
        "value": "1563529",
        "raw_text": "Hyundai Creta Car TN... 1563529"
      }
    ]
  },
  "land_assets": {
    "self": {
      "full_text": "...",
      "entries": [
        {
          "village": "Kalimandayam",
          "survey_no": "226/1B",
          "acres": 5,
          "cents": 16,
          "purchase_cost": 22000
        }
      ],
      "total": {
        "calculated": { "acres": 5, "cents": 16 },
        "declared": { "acres": 5, "cents": 16 },
        "total_purchase_cost": 22000,
        "mismatch": false
      }
    }
  },
  "createdtime": "2026-02-26T11:12:06.000000+00:00"
}
```

### GSIs on `knowyourmla_candidates`

| GSI | Partition Key | Sort Key | Use Case |
|---|---|---|---|
| `PersonIndex` | `person_id` | `PK` | All affidavits for a given person |
| `ConstituencyIndex` | `constituency_id` | `PK` | All candidates for a given constituency |

---

## Access Patterns

| Requirement | Table | Query |
|---|---|---|
| Get constituency profile | `knowyourmla_constituencies` | `PK = CONSTITUENCY#kolathur` + `SK = METADATA` |
<!-- | Get winner for a year | `tn_political_data` | `PK = CONSTITUENCY#kolathur` + `SK = YEAR#2021#WINNER` | -->
<!-- | Get all winners in a year | `tn_political_data` | GSI2: `YEAR#2021` | -->
| Get person by voter data | `knowyourmla_persons` | `PK = PERSON#{md5_hash}` + `SK = METADATA` |
| Get person by multi-factor identity | `knowyourmla_persons` | NameIndex: `normalized_name` -> match on relation + birth year |
| Get person by name | `knowyourmla_persons` | NameIndex: `normalized_name = mkstalin` |
| Get all elections for a person | `knowyourmla_candidates` | PersonIndex: `person_id = PERSON#...` |
| Get all candidates for a constituency | `knowyourmla_candidates` | ConstituencyIndex: `constituency_id = CONSTITUENCY#kolathur` |

---

## Normalization Rules

All names are normalized before generating DynamoDB keys.

| Step | Action |
|---|---|
| 1 | Lowercase |
| 2 | Remove all non-alphanumeric characters |

**Examples:** `"M K Stalin"` → `mkstalin` · `"KOLATHUR"` → `kolathur`

### Constituency Name Cleaning (`clean_constituency`)

Applied to **all raw constituency strings** before storage.

| Raw Input | Cleaned Output |
|---|---|
| `24-Thiyagarayar Nagar` | `Thiyagarayar Nagar` |
| `20 Thousand Light` | `Thousand Light` |
| `11 DR. RADHAKRISHNA NAGAR` | `DR. RADHAKRISHNA NAGAR` |
| `Aruppukkottai, Tamil Nadu` | `Aruppukkottai` |

Rules: strip leading `NN-` / `NN ` AC number prefix, strip everything after first `,`.

---

## Key Relationships

```
knowyourmla_candidates
  ├── person_id ──────────────→ knowyourmla_persons (PK)
  └── constituency_id ─────────→ knowyourmla_constituencies (PK) [MLA seat]

knowyourmla_persons
  └── voter_constituency_id ───→ knowyourmla_constituencies (PK) [voter residence]
```

---

## Table 5 — `knowyourmla_political_parties`

Master registry of political parties.

| Field | Value |
|---|---|
| `PK` | `PARTY#{normalized_name}` |
| `SK` | `METADATA` |

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | String | Unique ID |
| `name` | String | Full name of the party |
| `normalized_name` | String | Lowercase, alphanumeric only |
| `short_name` | String | Party abbreviation (e.g. DMK, ADMK) |
| `alias` | List | Alternative names |
| `Type` | String | Party type (National, State, etc.) |
| `registered_state` | String | State where the party is registered |
| `full_address` | String | Headquarters address |
| `pincode` | String | Pincode of the address |
| `myneta_url` | String | Source URL on myneta.info |
| `vote_share` | Map | Historical vote share and total votes by election (e.g. `{"assembly": {"2021": {"votes": 17427615, "vote_share_percent": 38.0}}}`) |
| `updated_at` | Number | Unix timestamp of last update |

### Sample Record

```json
{
  "PK": "PARTY#aamaadmiparty",
  "SK": "METADATA",
  "name": "Aam Aadmi Party",
  "short_name": "AAP",
  "normalized_name": "aamaadmiparty",
  "type": "National Party",
  "state_registered": "STATE#delhi",
  "full_address": "41, Hanuman Road, New Delhi, India 110001",
  "pincode": "110001",
  "logo_url": "https://www.myneta.info/party/lib/img/party/1449.png",
  "myneta_url": "https://www.myneta.info/party/index.php?action=summary&id=1449"
}
```

> **Seeder:** Populated by `scraper/extract_parties.py`.

---

## Table 6 — `knowyourmla_states`

Master registry of states.

| Field | Value |
|---|---|
| `PK` | `STATE#{normalized_name}` |
| `SK` | `METADATA` |

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | String | Unique ID |
| `name` | String | Full state name |
| `normalized_name` | String | Lowercase, alphanumeric only |

---

## Table 7 — `knowyourmla_districts`

Master registry of districts.

| Field | Value |
|---|---|
| `PK` | `DISTRICT#{normalized_name}` |
| `SK` | `METADATA` |

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | String | Unique ID |
| `name` | String | Full district name |
| `normalized_name` | String | Lowercase, alphanumeric only |
| `alias` | List | Alternative names |
| `state_id` | String | FK → `knowyourmla_states` PK |

### Sample Record

```json
{
  "PK": "DISTRICT#ariyalur",
  "SK": "METADATA",
  "id": "1",
  "name": "ARIYALUR",
  "normalized_name": "ariyalur",
  "alias": [],
  "state_id": "STATE#tamilnadu"
}
```

> **Seeder:** Populated by `scraper/extract_districts.py`.

---

| GSI2 | `YEAR#{year}` | `CONSTITUENCY#{normalized_name}` | All constituencies for a year |
| GSI3 | `CONSTITUENCY#{normalized_name}` | `YEAR#{year}` | Constituency timeline |

---

## Table 8 — `knowyourmla_elections`

Master registry of elections.

| Field | Value |
|---|---|
| `PK` | `ELECTION#{year}#{type}#{category}` |
| `SK` | `METADATA` |

### Fields

| Field | Type | Description |
|---|---|---|
| `year` | Number | Election year |
| `type` | String | Election type: `Assembly` or `Lok Sabha` |
| `category` | String | Election category: `General` or `Bye-Election` |
| `created_at` | Number | Unix timestamp |

### Sample Record

```json
{
  "PK": "ELECTION#2021#ASSEMBLY#GENERAL",
  "SK": "METADATA",
  "year": 2021,
  "type": "Assembly",
  "category": "General",
  "created_at": 1771825000
}
```

---

- **Project:** KnowYourMLA
- **Database:** AWS DynamoDB
- **Region:** `ap-south-2`
- **Design Pattern:** Distributed Master-Entity with Single-Table Legacy Layer