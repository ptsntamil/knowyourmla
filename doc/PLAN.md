# Technical Plan - Ignore Erroneous Candidates in Enrichment Pipeline

## Objective
Ensure that the enrichment pipeline skips candidates that have been marked with `error = True` in DynamoDB.

## Details
- **Target Field**: `error` (boolean) in `knowyourmla_candidates` table.
- **Action**: Modify retrieval and processing logic to check for this flag and skip affected records.

## Proposed Changes
1.  **Research**: Identified `process_candidate` in `scraper/enrichment.py` as the key processing loop.
2.  **Implementation**:
    -   **[scraper/enrichment.py](file:///Users/ideas2it/Projects/personal/knowyourmla/scraper/enrichment.py)**:
        -   In `process_candidate`, after fetching the item from DynamoDB (line 733), check if `error` attribute is `True`.
        -   If `True`, log a skipping message and return immediately.
    -   **Recursive Guard**: Since `process_candidate` is recursive, this top-level check will prevent enrichment of both the main candidate and its historical records if they are marked as errors.
3.  **Verification**:
    -   **Unit Tests**: Create `scraper/tests/test_enrichment_skip.py`.
    -   **Radon CC/MI**: Ensure complexity remains within limits.

## Documentation
-   Update `DB_README.md` if any new query patterns are introduced (though it's mostly a filter addition).
