# KnowYourMLA Project Rules

This document defines the architectural patterns, coding standards, and development rules for the KnowYourMLA project. All future development must adhere to these conventions to maintain consistency and search performance.

## 1. Project Overview
KnowYourMLA is a production-grade Next.js application (App Router) designed for high SEO performance, accessibility, and data-rich election analytics. It serves as an "Election Intelligence Dashboard" for Tamil Nadu politics.

## 2. Route Structure Rules
The project follows a strict hierarchical URL structure to optimize for crawlability:

- **State Home:** `/tn`
- **Districts:** `/tn/districts/[slug]`
- **MLAs:**
  - List: `/tn/mla/list`
  - Profile: `/tn/mla/[slug]`
- **Constituencies:** `/tn/constituency/[slug]`
- **Parties:**
  - List: `/parties`
  - Detail: `/parties/[slug]` (supports `?election=[year]` search param)

### Conventions:
- All core political entities must be prefixed with `/tn/` (except Parties).
- Slugs must be lowercase, hyphenated (e.g., `chennai-central`).
- Use `generateStaticParams` for high-traffic entity pages to enable ISR/Static generation.

## 3. Page File Rules
- **Server Components by Default:** All pages in `app/` should be Server Components unless interactivity is required at the top level.
- **Dynamic Fetching:** Use `export const dynamic = "force-dynamic"` for pages requiring real-time or frequently updated data (like profiles or filtered lists).
- **Metadata Handling:** Every page MUST implement `generateMetadata()` using the `buildMetadata` helper from `@/lib/seo/metadata`.
- **Composition:** Pages should be composed of high-level section components rather than deep JSX nesting.

## 4. Component Architecture Rules
Components are organized by responsibility:

- `components/ui`: Atomic UI primitives (`Badge`, `Card`, `SectionHeader`).
- `components/seo`: SEO-specific helpers (`AnswerSnippet`, `BreadcrumbSchema`, `FAQSection`, `SEOIntro`).
- `components/shared`: Global elements (`Navbar`, `Footer`, `CoverImage`).
- `components/features`: Domain-specific components (e.g., `MLAHeader`, `HistoryTable`, `PartyHero`, `PartySummaryStats`).

### Guidelines:
- **Consistency:** Reuse `Badge` and `Card` primitives for all data displays.
- **Density:** Favor "High-Density" layouts for profile pages (vertical sidebars within cards).
- **Interactive:** Keep "use client" components as small as possible (e.g., `FeedbackModal`, `ShareButton`).

## 5. SEO & Structured Data Rules
SEO is a first-class citizen in this codebase:

- **Metadata:** Title format: `Primary Title | KnowYourMLA`.
- **JSON-LD:** Every entity page must include:
  - `BreadcrumbSchema`
  - `ItemListSchema` (for lists)
  - `PersonSchema` (for MLA profiles via `JsonLd` component)
  - `FAQSchema` (where applicable)
- **Content:** Use `SEOIntro` for `h1` and introductory text. Use `AnswerSnippet` for "Featured Snippet" optimization.

## 6. Data Fetching Rules
- **Centralized API:** All external data fetching must go through `services/api.ts`.
- **V2 API Pattern:** The project is migrating to a "V2 API" which uses direct service imports (`@/lib/services/...`) on the server side.
- **Validation:** Handle missing data gracefully with fallbacks and "Not Found" states (use `not-found.tsx`).

## 7. Analytics & Data Visualization
Analytics sections (Youngest/Oldest candidate, Assets, etc.) follow a specific pattern:
- Use **Recharts** via the `AnalyticsCharts.tsx` wrapper for consistency.
- **Metric Widgets:** Use `MetricWidgets.tsx` for standalone KPI cards (e.g., Attendance, Questions).
- **Party Insights:** Group complex demographic data into "Insights" sections (e.g., `PartyKeyInsights`).

## 8. Styling Rules (Tailwind CSS)
- **Color Palette:**
  - `brand-dark`: Primary dark theme / text.
  - `brand-gold`: Accent / highlight.
  - `brand-green`: Success / positive growth.
  - `brand-light-gold`: Secondary accent.
  - `bg-page-bg`: Global background color.
- **Design Tokens:**
  - Card Radius: `rounded-[2rem]` or `rounded-[3rem]`.
  - Section Spacing: `space-y-12` (standard) or `space-y-16` (large).
  - Container: `max-w-7xl mx-auto px-4`.

## 9. Naming Conventions
- **Files:** `PascalCase.tsx` for components, `camelCase.ts` for libs/services.
- **Variables:** `camelCase`.
- **Constants:** `UPPER_SNAKE_CASE`.
- **Slugs:** `kebab-case`.

## 10. Future Development Workflow
1.  **Plan:** Define the route and necessary metadata.
2.  **API:** Add required fetching logic to `services/api.ts`.
3.  **UI:** Check `components/ui` and `components/seo` for reusable blocks.
4.  **SEO:** Implement `generateMetadata` and appropriate JSON-LD schemas.
5.  **Analytics:** Use existing chart components for data visualization.
