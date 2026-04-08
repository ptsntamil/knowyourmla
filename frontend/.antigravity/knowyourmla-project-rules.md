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
- **Error Boundaries & Fallback UI:** Every dynamic route (e.g., `[slug]`) must implement route-segment-level `loading.tsx` and `error.tsx` boundaries. If data is completely missing, explicitly trigger Next.js's `notFound()` function to ensure correct 404 HTTP status codes for search engines.

## 4. Component Architecture Rules
Components are organized by responsibility:

- `components/ui`: Atomic UI primitives (`Badge`, `Card`, `SectionHeader`).
- `components/seo`: SEO-specific helpers (`AnswerSnippet`, `BreadcrumbSchema`, `FAQSection`, `SEOIntro`).
- `components/shared`: Global elements (`Navbar`, `Footer`, `CoverImage`).
- `components/features`: Domain-specific components (e.g., `MLAHeader`, `HistoryTable`, `PartyHero`, `PartySummaryStats`).

### Guidelines:
- **Consistency:** Reuse `Badge` and `Card` primitives for all data displays.
- **Party Display Template:** Always use the `PartyBadge` component from `components/ui/PartyBadge` when displaying a party name with its logo. Do not inline the styling or the `Link` tag for party display. This ensures consistent URL routing, branding colors, and logo handling.
- **Density:** Favor "High-Density" layouts for profile pages (vertical sidebars within cards).
- **Interactive:** Keep "use client" components as small as possible (e.g., `FeedbackModal`, `ShareButton`).
- **State Management & Filtering (SEO-First):** Prefer URL Search Parameters over React Local State (`useState`) for filtering (e.g., `?party=dmk&year=2021`). This ensures specific views remain shareable and crawlable.
- **Component Extraction (Rule of Three):** If a JSX layout, data formatting utility, or specific Tailwind styling block is repeated three times across the repository, it MUST be extracted into `components/ui/` or `lib/utils/`.

## 5. SEO & Structured Data Rules
SEO is a first-class citizen in this codebase:

- **Metadata:** Title format: `Primary Title | KnowYourMLA`.
- **JSON-LD:** Every entity page must include:
  - `BreadcrumbSchema`
  - `ItemListSchema` (for lists)
  - `PersonSchema` (for MLA profiles via `JsonLd` component)
  - `FAQSchema` (where applicable)
- **Content:** Use `SEOIntro` for `h1` and introductory text. Use `AnswerSnippet` for "Featured Snippet" optimization.

## 6. Data Fetching & Backend Access Rules (Full-stack Next.js)
- **Strict Three-Tier Isolation:** UI Server Components (`page.tsx`) must NEVER import from `lib/repositories/` or connect to the database directly. They must *only* interact with `lib/services/` (e.g., `MLAService`).
- **Data Source of Truth (Database Normalization):** When fetching aggregated data, always prioritize the primary master tables for core traits to avoid denormalization sync issues. *Example: always fetch `district_name` from the `Constituency` table, and fetch `age/birth_year` and `sex/gender` from the `Person` table, rather than relying on stale copies in the `Candidate` history table.*
- **No Internal Fetching:** Server Components MUST NOT perform internal HTTP fetches (e.g., `fetch('/api/...')`). They must fetch data by directly calling internal Service methods, saving HTTP wrapper overhead. Reserve `fetch()` for external endpoints or Client Components.
- **Server Actions vs. Route Handlers:** Use Next.js Server Actions (`"use server"`) for internal client mutations and form submissions. Use API Route Handlers (`app/api/route.ts`) *only* when exposing data to an external webhook or client app.
- **Prop Drilling & Payload Optimization:** Never pass massive raw database records (e.g., entire DynamoDB responses) down to Client Components. Only pass exactly the fields required by the UI to prevent serializing multi-megabyte payloads over the network.
- **Environment Variable Safety:** Database credentials and backend secret tokens must never be prefixed with `NEXT_PUBLIC_` to prevent security leaks into the client bundle.
- **Centralized External API:** All third-party external data fetching must go through `services/api.ts` or structured adapters.
- **Strict TypeScript (Zero `any` Policy):** All data structures fetched from the DB must strictly conform to interfaces defined in `types/models.ts`. Avoid `any`.
- **Validation:** Handle missing data gracefully with fallbacks and "Not Found" states (use `not-found.tsx`).

## 7. Analytics & Data Visualization
Analytics sections (Youngest/Oldest candidate, Assets, etc.) follow a specific pattern:
- Use **Recharts** via the `AnalyticsCharts.tsx` wrapper for consistency.
- **Metric Widgets:** Use `MetricWidgets.tsx` for standalone KPI cards (e.g., Attendance, Questions).
- **Party Insights:** Group complex demographic data into "Insights" sections (e.g., `PartyKeyInsights`).

## 8. Styling & Media Rules (Tailwind CSS)
- **Image Optimization:** All images must use Next.js `<Image />` component with strict `width` and `height` dimensions to prevent Cumulative Layout Shift (CLS). Implement fallback logic for broken or missing candidate portraits.
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
