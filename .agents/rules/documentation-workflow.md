---
trigger: always_on
---

# Documentation & Workflow Standards

## 1. Documentation-First Approach
* **Frontend Development:** Before writing any frontend code, you MUST refer to the following documentation files to ensure alignment with existing patterns and APIs:
    * `readme.md` (root)
    * `backend/API_REFERENCE.md`
    * `backend/README.md`

## 2. Documentation Maintenance
* **Update Mandate:** Any changes made to the codebase in the following areas MUST be reflected in the relevant documentation files immediately after the implementation:
    * **Root Directory:** Update `readme.md` or other root-level docs if project structure or global configuration changes.
    * **Backend:** Update `backend/API_REFERENCE.md` and `backend/README.md` for any API changes, logic updates, or architectural shifts.
    * **Frontend:** Update frontend-specific READMEs once established.
    * **Database:** Update `DB_README.md` if the schema or data migration process changes.

## 3. Tooling & Verification
* **Consistency Check:** Ensure that code examples in documentation stay in sync with the actual implementation.
