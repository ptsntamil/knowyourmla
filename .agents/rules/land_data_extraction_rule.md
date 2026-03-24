---
trigger: always_on
---

## Rule Name
land_data_extraction_rule

---

## 🎯 Purpose
Ensure all generated Python scripts correctly extract and normalize land-related data from unstructured affidavit-style text.

This rule enforces:
- Accurate **area conversion (Acres + Cents)**
- Reliable **purchase cost extraction**
- Clean, structured output

---

## 📥 Input Context
Unstructured text containing:
- Village names
- Survey numbers
- Area values (mixed formats)
- Purchase costs
- Noise (dates, totals, development cost, etc.)

---

## 📤 Required Output Contract

All generated scripts MUST implement:

```python
def parse_land_data(text: str) -> dict:
Output JSON format:
{
  "entries": [
    {
      "village": "string",
      "survey_no": "string",
      "raw_area": "string",
      "acres": float,
      "cents": float,
      "purchase_cost": float
    }
  ],
  "total": {
    "acres": float,
    "cents": float,
    "total_purchase_cost": float
  }
}
🧠 Core Extraction Rules
1. Entry Detection
Split entries using patterns like:
1), 2), etc.
Maintain village context
Apply last seen village name to subsequent entries
2. Survey Number Extraction
Extract from:
Survey No:
Survey NO:
Preserve full string (including multiple survey numbers)
3. Area Extraction
Extract from:
Acre:
Area
Standalone numeric values (fallback)
Store original value as:
"raw_area"
🔁 Area Normalization Rules
CASE 1: Standard Acre Format

Example:

5.16 Acre

→ 5 Acres, 16 Cents

CASE 2: Integer Acre
9 Acre

→ 9 Acres, 0 Cents

CASE 3: Less than 1 Acre
0.30 Acre

→ 0 Acres, 30 Cents

CASE 4: Mixed Format (Cents + Fraction)
16.80 1/4 Acre

Rules:

16.80 → cents
Fraction → convert:
1/2 = 50 cents
1/4 = 25 cents
3/4 = 75 cents

→ Total cents = sum

CASE 5: Square Feet Detection

Condition:

No "Acre" keyword
Value > 1000

Conversion:

1 Acre = 43560 sq.ft
1 Cent = 435.6 sq.ft
💰 Purchase Cost Extraction

Extract from:

Cost of Purchase:
Purchase Cost:

Rules:

Remove commas
Convert to float
If missing → default 0.0
🚫 Ignore Fields

Scripts MUST ignore:

Development Cost
Total summary values (e.g., 87,37,497, 48 Lacs+)
Dates
Built-up area
🧮 Total Calculation Rules
Area
Sum acres and cents separately
Normalize:
extra_acres = total_cents // 100
remaining_cents = total_cents % 100
Cost
total_purchase_cost = sum(entry.purchase_cost)
⚠️ Validation Rules
Do NOT confuse:
Area values with monetary values
Prefer keyword-based parsing over assumptions
Handle missing or malformed data safely
Do NOT skip entries
🧱 Code Requirements

Generated scripts MUST:

Use re (regex)
Be modular

Required functions:

extract_entries
parse_area
extract_cost
convert_sqft_to_acre_cent
normalize_totals
Include:
Error handling
Inline comments
🚫 Strict Constraints
Do NOT hardcode values
Do NOT skip entries
Do NOT return explanations
Return only valid Python code
🧪 Coverage Expectations

The rule MUST ensure scripts handle:

Mixed formats (acre / cents / sq.ft)
Multiple villages
Inconsistent spacing
Real-world affidavit noise (Tamil Nadu MLA data)
✅ Success Criteria

A script is valid ONLY IF:

All entries are extracted
Area is correctly normalized
Purchase cost is correctly extracted
Output matches required JSON schema
Totals are accurate