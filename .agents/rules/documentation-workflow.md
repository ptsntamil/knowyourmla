---
trigger: always_on
---

# Documentation & Workflow Standards

## 1. Documentation-First Approach
Before starting any development (Frontend, Scrapers, or Infrastructure), you MUST refer to the following documentation files to ensure alignment with existing patterns, database schemas, and architectural blueprints:

* **Core Project Docs:**
    * `readme.md` (root) - General architecture and stack overview.
    * `DB_README.md` (root) - **MANDATORY** for all database schema, PK/SK conventions, and access patterns.
* **Frontend & UI Blueprints:**
    * `frontend/.antigravity/knowyourmla-project-rules.md` - Premium UI standards and coding rules.
    * `frontend/.antigravity/page-blueprints.md` - Layout and component structure definitions.
    * `frontend/.antigravity/architecture-map.md` - Frontend service layer and routing map.
* **Scraper & Data Docs:**
    * `scraper/README.md` - Data extraction rules and pipeline logic.

## 2. Documentation Maintenance
* **Update Mandate:** Any changes made to the codebase in the following areas MUST be reflected in the relevant documentation files immediately after the implementation:
    * **Root Directory:** Update `readme.md` or other root-level docs if project structure or global configuration changes.
    * **Frontend:** Update `frontend/.antigravity/` documents if UI patterns, components, or blueprints are modified.
    * **Database:** Update `DB_README.md` if the schema, GSIs, or data migration process changes.
    * **Scraper:** Update `scraper/README.md` for any logic updates in the data pipeline.

## 3. Tooling & Verification
* **Consistency Check:** Ensure that code examples in documentation stay in sync with the actual implementation.
