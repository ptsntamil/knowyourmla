# KnowYourMLA Agent Implementation Guide

This guide defines the mandatory technical constraints and patterns for the KnowYourMLA project. Agents must strictly adhere to these rules to maintain architectural integrity and SEO performance.

## 1. Architectural Mandates (3-Tier Isolation)
All data flow must follow a strict three-tier hierarchy: **UI Components -> Service Layer -> Repository Layer -> Database**.

- **Rule 1.1 (Service Only):** Next.js Pages and Components MUST NOT import from `lib/repositories/` or connect to the database directly. They must only interface with `lib/services/` (e.g., `MLAService`).
- **Rule 1.2 (No Internal Fetch):** Server Components MUST NOT perform internal HTTP fetches (e.g., `fetch('/api/...')`). Call internal Service methods directly.
- **Rule 1.3 (Payload Optimization):** Do not pass raw database records to Client Components. Serialize only the required fields into the props.
- **Rule 1.4 (Type Safety):** All data structures must strictly conform to interfaces in `types/models.ts`. **Zero `any` policy.**

## 2. Route & Pathing Standards
The project uses a hierarchical URL structure optimized for crawlability.

- **Slugs:** All dynamic slugs must be lowercase and hyphenated (e.g., `chennai-central`).
- **Core Entities:** All Tamil Nadu political entities must be prefixed with `/tn/`.
  - District: `/tn/districts/[slug]`
  - MLA Profile: `/tn/mla/[slug]`
  - Constituency: `/tn/constituency/[slug]`
  - Election Dashboard: `/tn/elections/[year]/dashboard`
- **ISR:** Use `generateStaticParams` for high-traffic entity pages to enable Static generation.

## 3. SEO & Structured Data Checklist
Every indexable route MUST implement the following:

- **Metadata:** Implement `generateMetadata()` using the `buildMetadata` helper from `@/lib/seo/metadata`.
- **JSON-LD:** Inject structured data schemas via the `JsonLd` component:
  - `BreadcrumbSchema` (All pages)
  - `PersonSchema` (MLA Profiles)
  - `ItemListSchema` (Listing pages)
  - `FAQSchema` (Where applicable)
- **H1 Optimization:** Use the `SEOIntro` component for the primary page heading and summary.

## 4. Mandatory Component Patterns
To ensure UI consistency, use established components; **NEVER inline styles** for these patterns.

- **Rule 4.1 (Party Branding):** ALWAYS use the `PartyBadge` component from `@/components/ui/PartyBadge`. Never inline the party logo, color, or redirection URL logic.
- **Rule 4.2 (Containers):** Wrap main content in `<main className="max-w-7xl mx-auto px-4 md:px-6 py-20 space-y-32">`.
- **Rule 4.3 (Cards):** Use the `Card` component from `@/components/ui/Card`. Standard: `rounded-[2rem] border-slate-100 shadow-sm`.
- **Rule 4.4 (Tables):** Use `w-full text-left border-collapse`. Headers must use `bg-slate-50/50` with `text-[10px] font-black uppercase tracking-widest text-slate-400`.
- **Rule 4.5 (Inputs):** Use `rounded-2xl border-slate-200 py-3 focus:ring-brand-gold/10 focus:border-brand-gold`.

## 5. Data Normalization & Processing
- **Normalization:** Use `@/lib/utils/profile-normalizers` for:
  - `normalizeProfileEducation`
  - `normalizeProfileProfession`
  - `normalizeTotalAssets` (handles HUF/Spouse/Dependents)
- **Social Links:** Use the `ensureAbsoluteUrl` utility in `MLAHeader.tsx` to normalize social handles into full platform URLs.
- **Asset Aggregation:** For multi-seat candidates, aggregate assets and cases across the latest affidavits at the Service layer.

## 6. Project Branding (Antigravity)
- **Built with Antigravity:** All major content pages and the "About" page must include the "Built with Antigravity" branding block using `Google_Antigravity_Logo_2025.svg`.

## 7. Global Layout Tokens
- **Sticky Navbar:** `sticky top-0 z-50 bg-brand-dark h-16 border-b border-white/5`.
- **Footer:** `bg-slate-900 border-t border-white/5 py-12 text-slate-400`.
- **Colors:**
  - `brand-dark`: #0F172A (Primary)
  - `brand-gold`: #D4AF37 (Accent)
  - `brand-green`: #10B981 (Success)
  - `bg-page-bg`: #F8FAFC (Background)
