# Person Mapping & Deduplication Strategy

This document explains how the KnowYourMLA project identifies and links unique individuals across different election cycles (2011, 2016, 2021).

## 1. Objective
The goal is to ensure that a candidate who contests in multiple elections is represented by a single `Person` record in the database, even if their voter registration details (constituency, serial number, part number) change or if their name is transliterated differently across years.

---

## 2. The Matching Pipeline

The `get_or_create_person` function in `scraper/enrichment.py` follows a 3-step verification process:

### Step 1: Broad GSI Lookup
We first query the `NameIndex` Global Secondary Index in DynamoDB using several variations of the candidate's normalized name:
- **Stripped Name**: The name with all 1-2 character initials and titles removed.
- **Normalized Name**: The name with only alphanumeric characters.
- **Suffix/Prefix Variants**: Handling cases where characters might have been merged at the start or end.

### Step 2: Phonetic & Heuristic Similarity
For every candidate found in Step 1, we perform a deep similarity check on the **Relation Name** (Father's/Spouse's name):
- **Phonetic Normalization**: Both names are simplified using aggressive Tamil-specific rules.
- **Suffix Matching**: Handles "Alias" patterns (e.g., matching "Kuppusamy" with "Kuppanan Alias Kuppusamy").
- **Title Stripping**: Honorifics and terms like "Late" are ignored.

### Step 3: Birth Year Tolerance
Finally, we calculate the approximate `birth_year` (`election_year - age`).
- A match is only confirmed if the `birth_year` is within **+/- 2 years** of the existing record.
- This prevents merging different generations (e.g., Senior vs Junior) with the same name.

---

## 3. Implementation Challenges

Deduplicating person records in electoral data presents several unique challenges:

- **Transliteration Drift**: Tamil names are phonetically transcribed into English. This leads to variations like `Thiyagarajan` vs `Thiagarajan` or `Gounder` vs `Kounder`.
- **Initial Merging**: Candidates often have initials (e.g., `M.K. Stalin`). In some years, these are separate; in others, they are merged (`Mk Stalin`) or swapped in order.
- **Voter Data Instability**: A person's voter serial number, part number, and even their constituency can change between elections as they move or as electoral rolls are updated.
- **Honorific Interference**: Names are often prefixed with `Dr.`, `Thiru`, `Smt`, or `Shri`, which must be stripped before matching.
- **Relation Pattern Variations**: A father's name might be recorded as `K. Rajamanickam` in one year and `Bose R` (using a middle name) in another.
- **Alias Complexity**: Pattern like `Kuppanan Alias Kuppusamy` require suffix matching to link with a simple `Kuppusamy` record.
- **Generational Overlap**: Fathers and sons often share identical names and father's names, making **Birth Year Tolerance** critical for differentiation.

---

## 4. Phonetic & Character Replacement Rules

The `utils.names_are_similar` function applies a series of aggressive replacements to unify transliteration differences.

### Consonant Unification
We map multiple English consonants that represent the same Tamil sound to a single "canonical" character.

| Original Characters | Canonical | Reason |
| :--- | :--- | :--- |
| `G`, `K` | `K` | Tamil 'க' can be transliterated as both. |
| `B`, `p`, `F` | `P` | Tamil 'ப' varies between B and P. |
| `J`, `S`, `Z`, `SH`, `CH`, `X` | `S` | Tamil 'ச' and 'ஸ' variations. |
| `D`, `T`, `DH`, `TH` | `T` | Tamil 'த', 'ட', 'த' variations. |
| `ZH` | `L` | The retroflex Tamil 'ழ' is often written as 'L' or 'ZH'. |
| `V`, `W` | *(Ignored)* | V and W are often treated as silent or interchangeable in Tamil suffix/vowel drift. |

### Vowel Normalization & Drift
Vowels in Tamil transliteration are highly unstable. We reduce them to a minimal set.

| Type | Transformation | Example |
| :--- | :--- | :--- |
| **Silent/Ignored** | `H`, `Y`, `V`, `W` → Removed | `Thiyagarajan` → `Tiakarajan` |
| **Vowel Drifts** | `E`, `I` → `A` | `Basker` → `Baskar` |
| **Vowel Drifts** | `U` → `O` | `Kuppusamy` → `Kopposama` |
| **Clusters** | `AU`, `OW`, `OU`, `AW`, `AO` → `O` | `Gounder` → `Kontar` |
| **Double Letters** | `NN` → `N`, `TT` → `T`, etc. | `Tennarasu` → `Tenaraso` |

### Special Rules
- **Vocalic R**: The letter `R` is ignored when it immediately precedes a consonant.
- **Suffix Matching**: If both names are at least 6 characters long, we check if one is a suffix of the other.
- **Strict Initials Stripping**: For shorter strings, we limit initials stripping to 2 characters to prevent false positives like `RAJ` matching `Balraj`.

---

## 5. Person ID Generation
Person IDs are deterministic to prevent collisions and allow for consistent lookup.

### Deterministic Hash (Preferred)
If complete voter data is available:
`PERSON#md5(voter_constituency | voter_serial_no | voter_part_no)`

### Phonetic Fallback & Collision Suffixing
If voter data is missing or changes:
`PERSON#{phonetic_normalized_name}_{phonetic_normalized_relation}`

- **Collision Suffixing**: If an ID collision occurs (same phonetic name/relation but different birth years or constituencies), the system appends a suffix (e.g., `PERSON#name_relation_2`). This ensures distinct individuals stay separate while remaining discoverable via the `NameIndex`.

*Note: The phonetic normalization used for ID generation is synchronized with the matching rules to ensure that "Tamilchelvan" and "Thamizselvan" generate the same ID.*

---

## 5. Handling Negative Matches
The system is explicitly tested for **Negative Scenarios** where two people have the same name but are different individuals. These are kept separate by:
1.  **Relation Discrepancy**: "Gopal Reddy" vs "Samiyapillai" will fail the similarity check.
2.  **Age Gaps**: A 3+ year age difference will fail unless the constituency matches.
3.  **Constituency Collision**: Candidates in the same year in different seats are kept separate **UNLESS** one of them is a **Bye-Election** (Sequential Election) or their voter info matches exactly.

---

## 6. Verified Test Scenarios
 
The strategy has been validated against **39 real-world scenarios** in `verify_dedup.py`, achieving a **100% success rate**. 

### Representative Positive Matches
The following candidates were correctly linked across multiple years despite significant spelling and data variations.

| Scenario | Candidate | Logic Demonstrated |
| :--- | :--- | :--- |
| **Scenario 13** | **O. Panneerselvam** | Handled title prefixes (*Thiru*), phonetic relation variations (*Ottakarathevar* vs *Ottakarardevar*), and double letter drift. |
| **Scenario 3** | **V. Senthilbalaji** | Handled initial order swaps (*Senthilbalaji .V* vs *Senthilbalaji V*) and relation title drift (*Velusamy* vs *Mr. Velusamy*). |
| **Scenario 26** | **K. Ponnusamy** | Handled complex `Alias` relation names (*M Kuppanan (A) Kuppusamy* matching *Kuppuswamy*). |
| **Scenario 11** | **Palanivel Thiaga Rajan** | Handled vowel clusters and spaces in name/relation (*THIYAGARAJAN* vs *THIAGA RAJAN*). |
| **Scenario 18** | **R.B. Udhayakumar** | Handled complete name reordering (*UDHAYAKUMAR R. B.* vs *R. B. UDHAYAKUMAR*). |
| **Scenario 19** | **Thangam Thennarasu** | Handled 4-year birth year drift using the **Constituency Booster**. |
| **Scenario 37** | **MGR Nambbi** | Linked same-person contesting multiple seats in 2021 (Sivakasi & Kovilpatti) using identical **Voter Registration** details, despite "MGR" prefix variations. |
| **Scenario 38** | **Sankara Subramanian M** | Linked multi-seat candidate (Srivaikuntam & Tirunelveli) via exact voter info match. |
| **Scenario 39** | **Deepan Chakkravarthi S** | Linked candidates across sequential general (2021) and bye-elections (2023) within the same assembly term, handling minor name drift and voter registration shifts. |
| **Scenario 36** | **M. Selvakumar** | Linked same-year candidates with minor age drift (27 vs 28) in the same constituency. |

### Representative Negative Matches
These scenarios confirm that distinct individuals are **not** incorrectly merged.

| Scenario | Candidate | Why they stayed separate |
| :--- | :--- | :--- |
| **Scenario 28** | **Senthilkumar M** | Distinct individuals with common names were kept separate due to a 3-year age gap across different constituencies. |
| **Scenario 35** | **Balamurugan S** | Kept separate due to **Same-Year Disambiguation** (different constituencies, no matching voter info). |
| **Scenario 25** | **Rajakannappan** | Two different candidates named Rajakannappan were correctly kept as separate Persons due to a **25-year age gap**. |

---

## 7. Verification & Data Integrity
All scenarios are automated in `scraper/verify_dedup.py`. This test suite uses full DynamoDB mocking to verify that even the most complex phonetic overlaps are handled correctly before any data is written to production.

```bash
# Run the verification suite
python3 scraper/verify_dedup.py
```
