# KnowYourMLA Architecture Map

This map provides a high-level overview of the KnowYourMLA project structure, making it easy for developers and AI to understand the relationship between different layers of the application.

## 1. App Route Map
- `/tn` → **State Home:** Overview of districts and entry point to TN analytics.
- `/tn/districts/[slug]` → **District Detail:** List of constituencies and district-level electorate stats.
- `/tn/mla/list` → **MLA Search:** Statewide searchable and filterable list of all MLAs.
- `/tn/mla/[slug]` → **MLA Profile:** Deep dive into a specific candidate's history, assets, and performance.
- `/tn/constituency/[slug]` → **Constituency Detail:** Historical winner data and electorate trends for a specific seat.
- `/parties` → **Parties Index:** List of all political parties with filter options.
- `/parties/[slug]` → **Party Dashboard:** Comprehensive analytics, candidate roster, and election performance for a party.

## 2. Page Type Taxonomy
- **List Pages:** `/tn`, `/tn/mla/list`, `/parties`. Focus on navigation, filtering, and high-level summaries.
- **Detail Pages:** `/tn/mla/[slug]`, `/tn/constituency/[slug]`, `/tn/districts/[slug]`. Focus on specific entity data and deep insights.
- **Analytics Dashboards:** `/parties/[slug]`. Data-heavy pages with multiple charts, tabs, and filtered views.

## 3. Component Responsibility Map
- **UI Primitives (`/components/ui`):** Functional, style-only components.
- **SEO Layer (`/components/seo`):** Components that inject metadata, schema, or SEO-optimized content blocks.
- **Feature Components (`/components/`):** Business-logic heavy components tied to specific entities (MLA, Party, etc.).
- **Layout Layer (`/components/layout`):** Navigation, footer, and structural wrappers.

## 4. Data Layer Architecture
- **Consumer:** Next.js Page (Server Component).
- **Service Layer:** `services/api.ts` (Aggregates and fetches data).
- **Internal Services (`/lib/services/`):** Direct database/logic access used by the V2 API pattern.
- **Types:** Defined in `types/models.ts` and `types/api.ts`.

## 5. SEO & Metadata Layer
- **Logic:** `lib/seo/metadata.ts` (Builds Metadata objects).
- **Paths:** `lib/seo/breadcrumbs.ts` (Standardizes navigation paths).
- **Schemas:** `lib/seo/jsonld.ts` (Generates JSON-LD for Search Engines).

## 6. Reusable UI Patterns
- **Cards:** `DistrictCard`, `PartyCard`, `CandidateMiniCard`.
- **Tables:** `HistoryTable`, `IncomeDetailsTable`.
- **Charts:** `AssetChart`, `VoteTrendChart`, `MarginTrendChart` (from `AnalyticsCharts.tsx`).
- **Widgets:** `MetricWidgets.tsx` (Attendance, Questions), `ElectionExpensesWidget`.
- **Layouts:** `CoverImage` (Hero), `SectionNav` (Sticky local navigation).
