# SEO Best Practices

## 1. Metadata Mandate
Whenever a new page is created, it **MUST** include SEO metadata. This is handled via the Next.js `generateMetadata` or `metadata` export.

### Required Fields
- **Title:** A unique, descriptive title for the page (max 60 characters). Prefixed or suffixed with `| KnowYourMLA`.
- **Description:** A compelling summary of the page content (max 160 characters).
- **Keywords:** A list of relevant keywords, including the **main keyword** for the page.

## 2. Implementation Pattern
Use the `getBaseMetadata` helper from `frontend/lib/seo.ts` to ensure consistency.

```typescript
import { Metadata } from "next";
import { getBaseMetadata } from "@/lib/seo";

export const metadata: Metadata = getBaseMetadata(
  "MLA Name - Constituency", // Title
  "Detailed profile of MLA Name, their track record, and constituency details.", // Description
  "mla/mla-name", // URL path
  ["MLA Name", "Constituency", "Tamil Nadu Politics", "Main Keyword"] // Keywords
);
```

## 3. SEO Checklist
- [ ] Is the title unique and relevant?
- [ ] Does the description summarize the page and contain the main keyword?
- [ ] Are the keywords relevant and do they include the main keyword?
- [ ] Is the canonical URL correctly specified?
- [ ] Are OpenGraph (OG) and Twitter tags correctly generated?
