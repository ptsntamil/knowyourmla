# KnowYourMLA Page Blueprints

This document defines the recommended structure and composition for the primary page types in the KnowYourMLA project. All new pages should follow these blueprints to maintain a consistent user experience and SEO performance.

## 1. District Page Blueprint
**Purpose:** Provide an overview of a district's political landscape.

### Required Structure:
1.  **Metadata:** `generateMetadata` using `buildMetadata`.
2.  **BreadcrumbSchema:** Standardized path (Home > TN > District Name).
3.  **ItemListSchema:** List of constituencies in the district.
4.  **CoverImage (Hero):** Title (`[Name] District`) and subtitle (constituent count).
5.  **SEOIntro:** `h1` and summary paragraph.
6.  **AnswerSnippet:** High-level FAQ snippet (MLA count, voter population).
7.  **Main Content:**
    - Left Column (2/3): `ConstituencyList`.
    - Right Column (1/3): `District Electorate` card (Progress bars for Male/Female/Others).
8.  **FAQSection:** 4-5 district-specific questions.

## 2. MLA Profile Page Blueprint
**Purpose:** Deliver a high-density, data-rich political biography.

### Required Structure:
1.  **Metadata:** Name, Title (MLA/Candidate), Constituency, and Party.
2.  **Schema:** `PersonSchema`.
3.  **BreadcrumbSchema:** Context-aware path (Home > TN > District > Constituency > Name).
4.  **MLAHeader:** High-density profile card with facts (Gold, Land, Vehicles, Criminal cases).
5.  **SEOIntro:** `h1` and intro summary.
6.  **AnswerSnippet:** Quick identification (Who is [Name]?).
7.  **Performance Metrics Section:**
    - `AssetChart`, `VoteTrendChart`, `MarginTrendChart`.
8.  **Historical Records:** `HistoryTable`.
9.  **Financial Details:** `IncomeDetailsTable`.
10. **Insights Aside:** Quick tips and internal links to constituency/party.
11. **FAQSection:** Profile-specific questions.

## 3. Party Dashboard Blueprint
**Purpose:** Aggregate party-wide candidate data and election performance.

### Required Structure:
1.  **Metadata:** Party Name, Short Name, and TN context.
2.  **PartyHero:** Party logo, name, and high-level summary cards.
3.  **ElectionFilter:** Sticky year/all-elections toggle.
4.  **SectionNav:** Sticky local navigation (Overview, Insights, Trends, Analytics, Candidates).
5.  **SEOIntro & AnswerSnippet:** Focused on party strength and candidate count.
6.  **Performance Overview:** `PartySummaryStats`.
7.  **Key Insights:** `PartyKeyInsights` (Crorepatis, Criminal records, Education).
8.  **Trends Section:** `PartyTimelineCharts` (Growth over time).
9.  **Demographic Tabs:** `PartyAnalyticsTabs` (Education, Gender, Asset breakdown).
10. **Candidate Roster:** `PartyElectionView`.
11. **FAQSection:** Party-specific questions.

## 4. Constituency Detail Blueprint
**Purpose:** Show historical data and electorate trends for a specific seat.

### Recommended Structure:
1.  **Metadata & Schema:** `BreadcrumbSchema`, `ItemListSchema` (for winner history).
2.  **CoverImage:** Seat name and district context.
3.  **SEOIntro:** `h1` and historical summary.
4.  **Main Content:**
    - `ConstituencyMap` (if available).
    - `HistoryTable` (Winner history over the years).
    - `ElectorateStats` (Gender-wise breakdown).
5.  **FAQSection:** Seat-specific questions.

## 5. Election Results Page Blueprint
**Purpose:** Provide analytics and seat-wise results for a specific election year.

### Required Structure:
1.  **Metadata:** `generateMetadata` (Year, Summary, Party results).
2.  **BreadcrumbSchema:** Context-aware path (Home > TN > Elections > [Year]).
3.  **CoverImage (Hero):** 
    - `title`: `${stateName} Election ${year}`
    - `subtitle`: `summarySentence` (fetched from service).
    - `children`: `ElectionHero` (rendering ONLY breadcrumbs).
4.  **Main Content:**
    - `ElectionSnapshotCards`: Row of cards with major outcomes.
    - `Charts Section`: `SeatsByPartyChart` and `VoteShareChart` in a 2-column grid.
    - `Results Table`: `ConstituencyResultsTable` (searchable/sortable).
5.  **FAQSection:** Election-specific questions.

## 6. General SEO Page Blueprint
**Purpose:** Use for any new indexable content pages.

### Template:
```tsx
export default async function GenericPage() {
  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema items={...} />
      <CoverImage title="..." subtitle="..." >
         <Breadcrumbs />
      </CoverImage>
      <main className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        <SEOIntro h1="..." intro="..." />
        <AnswerSnippet question="..." answer="..." />
        {/* Page specific sections */}
        <div className="pt-16 border-t border-slate-100">
           <FAQSection faqs={...} />
        </div>
      </main>
    </div>
  )
}
```

## 7. Hero & Header Standards (Critical)
To avoid vertical spacing breakage between the navbar, hero, and main content:

- **Use `CoverImage` props for text**: Always pass the primary page title to `title` and the summary to `subtitle`.
- **Reserve `children` for overlays**: Use the `children` slot *only* for secondary UI elements like breadcrumbs, stats pills, or tags.
- **NEVER duplicate titles**: Avoid rendering a separate `h1` or summary paragraph inside the `children` of `CoverImage` if they are already provided via props.
- **Padding consistency**: Use `main.max-w-7xl.mx-auto.px-4.py-20.space-y-32` for the main content area immediately following a hero to ensure balanced negative space.
