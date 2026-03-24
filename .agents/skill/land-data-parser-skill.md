name: land-data-parser-skill
description: >
  Generate production-ready Python code to extract and normalize land details
  (Acres, Cents, Purchase Cost) from unstructured affidavit-style text.

version: "1.0"

# 🔗 Attach your rule here
rules:
  - land_data_extraction_rule

# 🎯 When this skill should trigger
triggers:
  - when user asks to:
      - extract land details
      - parse affidavit land data
      - convert land area to acres cents
      - build parser for MLA assets
      - process survey number land records

# 📥 Input schema
input_schema:
  type: object
  properties:
    text:
      type: string
      description: Raw affidavit or land record text
  required:
    - text

# 📤 Output schema
output_schema:
  type: object
  properties:
    code:
      type: string
      description: Python script implementing parse_land_data function

# 🧠 Instructions to the model
instructions: |
  You are a senior Python backend engineer.

  Generate a production-ready Python script that:
  - Extracts village, survey numbers, area, and purchase cost
  - Normalizes land area into Acres and Cents
  - Handles mixed formats (acre, cents, sq.ft, fractional acre)
  - Ignores irrelevant fields (dates, totals, development cost)

  The script MUST:
  - Implement function: parse_land_data(text: str) -> dict
  - Follow ALL rules defined in land_data_extraction_rule
  - Use regex (`re`)
  - Be modular and readable
  - Include helper functions:
      - extract_entries
      - parse_area
      - extract_cost
      - convert_sqft_to_acre_cent
      - normalize_totals
  - Handle edge cases safely
  - Include inline comments

  Do NOT:
  - Add explanations
  - Skip entries
  - Hardcode values

  Return ONLY valid Python code.

# 🧪 Few-shot examples (optional but powerful)
examples:
  - input:
      text: "Survey No:226/1B Acre:5.16 Cost of Purchase:76840"
    output: |
      # returns parsed structured output with 5 acres 16 cents and cost 76840

# ⚙️ Execution settings
config:
  temperature: 0.2
  max_tokens: 2000
  top_p: 0.9

# 🔒 Constraints
constraints:
  - must_follow_rules: true
  - output_code_only: true
  - no_explanations: true