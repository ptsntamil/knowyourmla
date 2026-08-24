# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KnowYourMLA is a Tamil Nadu political intelligence platform. It scrapes election data from IndiaVotes and affidavit data from Myneta, stores it in DynamoDB, and serves it via a Next.js frontend deployed on Vercel.

## Repository Structure

| Directory | Purpose |
|-----------|---------|
| `frontend/` | Next.js 16 App Router (React 19, TypeScript, Tailwind CSS v4) — deployed on Vercel |
| `backend/` | FastAPI + Mangum (AWS Lambda) — legacy/secondary API |
| `scraper/` | Python data pipeline — scrapers, enrichment, CSV importers, PDF extractors |
| `infra/` | Terraform IaC for AWS (DynamoDB, Lambda, API Gateway) |
| `.agents/` | AI agent rules for code style, SEO, and documentation workflows |

## Common Commands

### Frontend
```bash
cd frontend
npm install           # Install dependencies
npm run dev           # Dev server on localhost:3000
npm run build         # Production build
npm run lint          # ESLint (core-web-vitals + typescript)
```

### Scraper (Python)
```bash
cd scraper
source venv/bin/activate
pip install -r requirements.txt
pytest tests/                           # Run all tests
pytest tests/test_enrichment.py -k "test_name"  # Run single test
radon cc <file> -s                      # Check cyclomatic complexity
radon mi <file> -s                      # Check maintainability index
```

### Backend (Python)
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload               # Local dev server
pytest tests/                           # Run tests
```

### Infrastructure
```bash
cd infra
terraform plan && terraform apply
bash package.sh                         # Package Lambda deployment
```

## Architecture

### Frontend 3-Tier Isolation (Mandatory)

```
Pages/Components → Service Layer → Repository Layer → DynamoDB
(app/)              (lib/services/)   (lib/repositories/)  (@aws-sdk)
```

**Hard rules:**
- Pages MUST NOT import from `lib/repositories/` directly
- Server Components MUST NOT call internal HTTP APIs (`fetch('/api/...')`) — call service methods directly
- Services use `unstable_cache` for caching
- `services/api.ts` is a smart client: uses direct service imports on server, HTTP fetch on client

### URL Structure

All TN routes are under `/tn/`:
- `/tn/mla/[slug]` — MLA profiles
- `/tn/constituency/[slug]` — Constituency detail
- `/tn/constituency/[slug]/election/[year]` — Election results by year
- `/tn/constituency/[slug]/election/[year]/polling-station/[number]` — Booth-level results
- `/tn/elections/[year]` — Election dashboard
- `/tn/districts/[slug]` — District detail
- `/tn/party/[slug]/[year]` — Party analytics

Root `/` redirects to `/tn`. Slugs are lowercase, hyphenated (e.g., `chennai-central`).

### Database

**AWS DynamoDB** (region: `ap-south-2`, PAY_PER_REQUEST billing). See `DB_README.md` for authoritative schema.

Key tables: `knowyourmla_constituencies`, `knowyourmla_persons`, `knowyourmla_candidates`, `knowyourmla_polling_results`, `knowyourmla_political_parties`, `knowyourmla_elections`, `knowyourmla_states`, `knowyourmla_districts`.

All PK/SK keys use normalized names (lowercase, non-alphanumeric stripped). DynamoDB wrapper: `frontend/lib/dynamodb.ts`.

### Data Pipeline (Scraper)

Python pipeline that scrapes IndiaVotes (election results) and Myneta (affidavit/financial data), enriches records, and writes to DynamoDB. Uses Gemini AI for affidavit PDF extraction. Entry points: `scraper/enrichment.py`, `scraper/import_election_csv.py`.

## Code Conventions

### Frontend (Next.js)
- **Server Components by default** — only add `"use client"` when event handlers, browser APIs, or local state are needed
- **Never change URL structure or break SEO** — every page needs `generateMetadata()` with title, description, canonical, OpenGraph, Twitter cards
- **Structured data required** — BreadcrumbList on all pages, PersonSchema on MLA profiles, ItemListSchema on listings
- **Zero `any` policy** — all types conform to `types/models.ts`
- **Path alias:** `@/*` maps to project root
- **Import order:** React/Next → third-party → internal (`@/`) → relative

### Python (Scraper/Backend)
- **pytest** with `unittest.mock` for isolation; `asyncio_mode = strict`
- **Google-style docstrings** on all public functions
- **Cyclomatic complexity:** max 20 per function, refactor at >15
- **Maintainability index:** target 65–85
- **PEP 8** compliance

### Documentation-First
When changing database schema, frontend architecture, or scraper logic, update the corresponding docs:
- Database changes → `DB_README.md`
- Frontend patterns → `frontend/.antigravity/` docs
- Scraper logic → `scraper/README.md`

## Environment Variables

### Frontend
- `AWS_REGION` (default: `ap-south-2`), AWS credentials for DynamoDB
- `NEXT_PUBLIC_BASE_URL` — site URL
- `NEXT_PUBLIC_ELECTION_EXPENSE_LIMIT` — expense threshold (4000000)
- `REVALIDATE_TIME` — ISR interval (default: 3600)

### Scraper
- AWS credentials for DynamoDB
- Gemini API key for AI-powered affidavit extraction

## Deployment

- **Frontend:** Vercel (auto-deploys from git)
- **Backend:** AWS Lambda behind API Gateway (packaged via `infra/package.sh`, deployed via Terraform)
- **No CI/CD pipelines** — deployments are manual/Vercel auto-deploy
