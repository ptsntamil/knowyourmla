# Verification Plan: Election Expense Correction

## 1. Unit Test for Logic
- Test `clean_currency_to_int` with suffixes like "21 Lacs+".
- Test `ExpenseCorrector.should_correct` with various inputs.

## 2. Dry Run
- Run `python3 scraper/helper/correct_election_expenses.py` to identify records that would be corrected.

## 3. Integration Test
- Create a temporary record in DynamoDB, run correction, and verify update.
