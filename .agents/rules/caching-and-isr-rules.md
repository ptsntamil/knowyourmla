# Caching, ISR & Serverless CPU Optimization Rules

## 1. Core Purpose
Prevent excessive CPU-minute consumption and unnecessary DynamoDB RCUs on Vercel Serverless Functions. High-traffic crawler visits (Googlebot, Bingbot, social media scrapers) must hit edge-cached content rather than triggering fresh serverless executions.

---

## 2. Hard Non-Negotiable Rules

### Rule 1: Never Use `force-dynamic` on Content Pages
- **DO NOT** use `export const dynamic = "force-dynamic"` on content, profile, or listing pages.
- `force-dynamic` disables all Next.js static caching and ISR, forcing full SSR execution on every request.
- **MUST** use Page-Level ISR with `export const revalidate = 86400;` (24 hours) instead.

```tsx
// ❌ WRONG: Burns serverless CPU on every bot/user hit
export const dynamic = "force-dynamic";

// ✅ CORRECT: Serves from Vercel Edge CDN for 24h, background revalidation
export const revalidate = 86400;
```

---

### Rule 2: Mandatory Page-Level ISR (`export const revalidate = 86400`)
Every public content route in `frontend/app/` must export `revalidate`:
- **MLA Profiles:** `/tn/mla/[slug]/page.tsx`
- **Polling Station Listings & Booths:**
  - `/tn/constituency/[slug]/election/[year]/polling-stations/page.tsx`
  - `/tn/constituency/[slug]/election/[year]/polling-station/[number]/page.tsx`
- **Constituency Pages:** `/tn/constituency/[slug]/election/[year]/page.tsx`, `/tn/constituency/[slug]/page.tsx`
- **Party Profiles & Listings:** `/parties/[slug]/page.tsx`, `/parties/page.tsx`
- **District Detail Pages:** `/tn/districts/[slug]/page.tsx`
- **Election Dashboards & Insights:** `/tn/elections/[year]/...`

---

### Rule 3: Persistent Data Caching in Service Layer (`unstable_cache`)
- **DO NOT** rely solely on React `cache()` for heavy queries or data processing.
- React `cache()` is **request-scoped only** — it does not persist across requests. When crawlers index 200–400 polling booths in a constituency, React `cache()` re-executes all DB queries and calculations on every single booth request.
- **MUST** wrap all multi-query fetches and heavy data transformations in `unstable_cache` from `next/cache`:
  - Set TTL to `86400` (24 hours).
  - Include all dynamic arguments in the cache key array.
  - Provide descriptive cache tags for targeted revalidation (`revalidateTag`).
  - Combine with React `cache()` when the method can be called multiple times in a single render (e.g. `generateMetadata` and `Page`).

```ts
// ✅ CORRECT PATTERN: Persistent across serverless instances + deduped per request
export class ElectionAnalyticsService {
  getPollingStationResults = cache(async (constituencyId: string, year: number): Promise<ConstituencyPollingData | null> => {
    const cid = constituencyId.startsWith("CONSTITUENCY#") ? constituencyId : `CONSTITUENCY#${constituencyId}`;

    return unstable_cache(
      async (cIdStr: string, yrNum: number) => {
        // Expensive DynamoDB queries & analytics transformations here
      },
      ["polling-station-results", cid, year.toString()],
      { revalidate: 86400, tags: ["polling-results", `polling-results-${cid}-${year}`] }
    )(cid, year);
  });
}
```

---

### Rule 4: Mandatory Edge Caching for Social Preview (OG) Images
Generating OpenGraph preview images with `@vercel/og` (`ImageResponse`) invokes Satori and Resvg WASM, which is CPU-heavy (200–500ms per card). Social scrapers (Twitter, Facebook, WhatsApp, Telegram, LinkedIn) fetch preview images frequently.

- **MUST** export `export const revalidate = 86400;` on:
  - All `opengraph-image.tsx` files.
  - All dynamic image route handlers (`app/og/.../route.tsx`).

```tsx
// frontend/app/tn/mla/[slug]/opengraph-image.tsx
export const alt = 'MLA Profile';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const revalidate = 86400; // ✅ Caches generated PNG at Vercel Edge CDN
```

---

### Rule 5: Hot Path Query & Metadata Discipline
- **DO NOT** call un-cached repository scan/query methods in loops or hot paths (e.g., `districtRepo.getAllDistricts()`).
- **MUST** consume pre-cached service methods (e.g., `districtService.getAllDistricts()`) or shared cached maps (`getSharedPartyInfo` from `shared/party-cache.ts`).
- When looking up items by exact PK + SK, always use `GetItem` instead of `QueryCommand`.

---

## 3. Checklist for New Routes and Services
Before opening a PR or completing code generation for any route or service:
- [ ] Does the page route export `revalidate = 86400`?
- [ ] Is `force-dynamic` strictly avoided?
- [ ] Are expensive data queries/transforms wrapped in `unstable_cache` with a 24h TTL and explicit tags?
- [ ] If an `opengraph-image.tsx` or `/og/` route is created, does it export `revalidate = 86400`?
- [ ] Are shared metadata entities (districts, parties) fetched via cached services rather than direct repo scans?
- [ ] Does `npx tsc --noEmit` pass with zero errors?
