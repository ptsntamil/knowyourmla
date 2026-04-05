---
trigger: always_on
---

# Antigravity Rule File — Next.js + SSR + SEO + Tailwind + Code Guidelines

## Project Role
You are working on a **production-grade Next.js App Router application** that prioritizes:

- Server-side rendering (SSR)
- SEO
- Performance
- Maintainability
- Clean architecture
- Tailwind consistency
- Strong code quality

Treat every change like a **safe production PR**.

---

# 1. NON-NEGOTIABLE RULES

## DO NOT
- Do not change URL structure
- Do not break SEO behavior
- Do not remove metadata
- Do not convert SSR → CSR
- Do not add "use client" unnecessarily
- Do not change business logic unless buggy
- Do not add unnecessary libraries
- Do not over-engineer
- Do not redesign UI unless asked

## MUST
- Prefer clarity over cleverness
- Prefer Server Components
- Preserve behavior and SEO intent
- Keep code simple and scalable

---

# 2. NEXT.JS RULES

## Server Components by default
Use Server Components unless:
- event handlers needed
- browser APIs required
- local interactive state needed

## Architecture
- Page → Server
- Data → Server
- SEO → Server
- Interactivity → small Client components

---

# 3. DATA FETCHING

## Rules
- Fetch on server for SEO content
- Never use useEffect for critical data

## Use:
```ts
await fetch(url, { next: { revalidate: 3600 } })
```

or

```ts
await fetch(url, { cache: 'no-store' })
```

---

# 4. SEO RULES

## Every page must have:
- title
- description
- canonical
- openGraph
- twitter

## Use generateMetadata()

## Rules:
- unique titles
- no duplicates
- keyword relevant
- human readable

---

# 5. STRUCTURED DATA

## Use:
- BreadcrumbList
- ItemList
- FAQPage
- Organization

## Rules:
- generate server-side
- keep accurate
- no fake schema

---

# 6. HTML STRUCTURE

## Use semantic HTML:
- main
- section
- article
- header
- nav
- footer

## Heading rules:
- one h1 per page
- proper hierarchy

## Avoid:
- div-only layouts
- hidden SEO content

---

# 7. TAILWIND RULES

## DO NOT:
- repeat long class strings
- use too many arbitrary values
- create inconsistent spacing
- hardcode colors everywhere

## MUST:
- normalize spacing
- normalize typography
- reuse patterns

## Rule:
If used 3+ times → extract it

---

# 8. COMPONENT DESIGN

## Rules:
- one responsibility per component
- avoid large components

## Split into:
- container
- section
- UI primitives

---

# 9. TYPESCRIPT

## MUST:
- strict typing
- no `any`
- typed props

## Prefer:
- enums
- constants
- safe types

---

# 10. CODE GUIDELINES

## General Coding Principles
- Write code for **readability first**
- Prefer **simple, explicit logic**
- Keep functions and components **small and focused**
- Avoid clever shortcuts that reduce clarity
- Optimize for **long-term maintainability**

## Naming Rules
### Use descriptive names
Good:
- `candidateList`
- `partyStats`
- `districtSummary`
- `getMlaProfileBySlug`

Bad:
- `data`
- `item`
- `val`
- `temp`
- `x`

### Naming Conventions
- **Components** → `PascalCase`
- **Functions** → `camelCase`
- **Variables** → `camelCase`
- **Constants** → `UPPER_SNAKE_CASE` only if truly constant
- **Files** → follow existing project convention consistently

## Function Rules
- Prefer **pure functions**
- Keep functions focused on **one responsibility**
- Avoid functions that do too many unrelated things
- Prefer early returns over deep nesting

Good:
```ts
function getCandidateAgeLabel(age: number) {
  if (age < 30) return "Young"
  if (age < 50) return "Mid-age"
  return "Senior"
}
```

Bad:
```ts
function processCandidate(candidate: any, config: any, flag: any, mode: any) {
  // too many responsibilities
}
```

## Component Rules
- A component should ideally do **one thing well**
- If a component becomes too large, split it into:
  - layout/container
  - section
  - card/item
  - utility/helper

## Props Rules
- Keep props minimal and meaningful
- Avoid passing entire objects if only 2–3 fields are needed
- Avoid deeply nested prop chains
- Prefer typed interfaces for props

## State Rules
- Do not store derived values in state
- Keep state as small as possible
- Prefer server-rendered data over client state for SEO pages
- Use local state only for real UI interaction

Bad:
```tsx
const [filteredList, setFilteredList] = useState([])
```

If it can be derived from props/data, compute it instead.

## Conditional Rendering Rules
- Keep JSX conditions easy to read
- Extract complex conditional UI into helper components
- Avoid deeply nested ternaries

Bad:
```tsx
{loading ? (...) : error ? (...) : data?.length ? (...) : (...)}
```

Prefer extracted readable blocks.

## Reusability Rules
Extract only when:
- a pattern repeats 3+ times
- it clearly improves readability
- it reduces bugs or inconsistency

Do not abstract too early.

## Constants & Config
Move repeated values into:
- constants
- config maps
- reusable helpers

Examples:
- labels
- badge types
- filter options
- sort options
- stat card definitions

## Error Handling
- Handle null/undefined safely
- Do not assume API data is always complete
- Use safe fallbacks
- Avoid runtime crashes from missing nested properties

Good:
```ts
const name = candidate?.name ?? "Unknown"
```

## Async Rules
- Use `async/await` consistently
- Avoid unnecessary Promise chains
- Handle failures gracefully
- Keep fetch logic close to where it belongs

## Import Rules
- Remove unused imports
- Group imports cleanly:
  1. React / Next
  2. third-party libs
  3. internal modules
  4. relative imports

## Comments Rules
- Avoid obvious comments
- Use comments only when explaining:
  - why a decision exists
  - a tricky edge case
  - non-obvious business logic

Bad:
```ts
// increment count
count++
```

Good:
```ts
// We keep this fallback because older election records may not have affidavit data
```

## Code Smell Rules
Refactor when you see:
- duplicated JSX
- repeated fetch logic
- oversized files
- magic strings/numbers
- unnecessary wrappers
- repeated Tailwind utility blocks
- too many responsibilities in one file

---

# 11. FOLDER STRUCTURE

```text
app/
components/
  ui/
  shared/
  seo/
lib/
  seo/
  utils/
types/
constants/
```

---

# 12. PERFORMANCE

## MUST:
- minimize JS
- prefer SSR
- avoid heavy hydration

## Use:
- next/image
- dynamic imports (only if needed)

---

# 13. ACCESSIBILITY

## MUST:
- semantic elements
- alt text
- proper labels
- keyboard navigation

## NEVER:
- clickable divs
- remove focus states

---

# 14. REFACTORING

## DO:
- small safe changes
- reduce duplication
- improve readability

## DO NOT:
- rewrite everything
- over-abstract

## Rule:
If already clean → leave it

---

# 15. REVIEW CHECKLIST

## Functionality
- [ ] behavior unchanged
- [ ] routes safe

## Next.js
- [ ] server components used
- [ ] no unnecessary client code

## SEO
- [ ] metadata present
- [ ] canonical correct
- [ ] SSR content intact

## UI
- [ ] consistent styles
- [ ] responsive intact

## Code
- [ ] no dead code
- [ ] readable
- [ ] typed

---

# 16. RESPONSE STYLE

When making changes:

1. Explain what changed
2. Explain why
3. Keep changes minimal
4. Prefer production-safe solutions

---

# 17. PROJECT PRIORITY

Always optimize for:

- Crawlability
- SSR-first rendering
- Clean HTML
- Low JS
- Scalable SEO architecture

---

# 18. DEFAULT BEHAVIOR

Always choose:

- Server-first
- SEO-safe
- Tailwind-consistent
- Minimal-change
- Production-safe