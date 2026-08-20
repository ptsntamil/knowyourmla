---
name: next-dynamodb-code-review
description: Audits Next.js (App Router), React, and AWS DynamoDB codebases. Analyzes logic correctness, code standards, runtime performance, AWS cost optimization, caching strategies, and SEO implementation.
---

# Next.js + React + DynamoDB Code Reviewer

Perform a strict code review on the provided pull request, directory, or code snippet. Focus specifically on full-stack React/Next.js architecture combined with AWS DynamoDB best practices.

---

## Review Checklist

### 1. Logic & Fault Tolerance
* **DynamoDB Operations:** Verify conditional writes (`ConditionExpression`) exist for updates/inserts to prevent race conditions or unintentional overwrites.
* **Server Actions & Route Handlers:** Ensure all server-side mutations use `try/catch` blocks and return typed error responses without leaking internal AWS errors.
* **Idempotency:** Verify API endpoints and Server Actions handle duplicate requests safely (e.g., using idempotency keys for database writes).
* **Null/Undefined Checks:** Confirm DynamoDB optional attributes are handled gracefully, as DynamoDB omits null/empty string fields depending on SDK config.

### 2. Code Standards & Architecture
* **SDK Version:** Ensure `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` (AWS SDK v3) are used, not v2 (`aws-sdk`).
* **Component Separation:** Verify proper split between Server Components (RSC) and Client Components (`"use client"`). AWS SDK calls MUST only exist in server-side files.
* **Data Access Layer (DAL):** Ensure DynamoDB client initialization and query abstractions are isolated from UI components.
* **TypeScript Typing:** Confirm DynamoDB items are strictly typed with interface schemas rather than using `any` or untyped `Record<string, any>`.

### 3. Performance
* **Query Patterns:** Flag any use of `ScanCommand`. Enforce `QueryCommand` or `GetItemCommand` with proper Partition (PK) and Sort Keys (SK).
* **Parallel Execution:** Ensure independent async operations in Server Components or API routes use `Promise.all()` instead of sequential `await` chains.
* **Bundle Optimization:** Verify heavy libraries (e.g., `@aws-sdk`) are never imported into Client Components.
* **Core Web Vitals:** Ensure dynamic imports (`next/dynamic`) are used for heavy client component trees to reduce initial JavaScript payload.

### 4. DynamoDB Cost Optimization
* **Projection Expressions:** Check that `ProjectionExpression` is defined when fetching items to avoid reading unused large attributes into memory.
* **Payload Size:** Flag items exceeding 4KB/400KB thresholds. Large blobs or media must be stored in AWS S3 with URLs stored in DynamoDB.
* **Batching:** Verify `BatchGetItemCommand` or `BatchWriteItemCommand` are used when fetching or inserting multiple records simultaneously.
* **Capacity Planning:** Confirm global secondary indexes (GSIs) project only necessary keys (`KEYS_ONLY` or `INCLUDE`) rather than `ALL`.

### 5. Caching Strategy
* **Next.js Data Cache:** Check if `fetch` calls or custom data fetchers implement appropriate revalidation options (`next: { revalidate: seconds, tags: [...] }`).
* **Request Deduplication:** Ensure database queries inside React Server Components are wrapped in React's `cache()` function to avoid duplicate network calls per request.
* **Cache Invalidation:** Verify that mutations trigger `revalidateTag()` or `revalidatePath()` to prevent stale UI state.

### 6. SEO & Metadata
* **Metadata API:** Check that pages export dynamic metadata via `generateMetadata()` or static `metadata` objects.
* **Open Graph & Twitter Cards:** Ensure complete social preview tags (`og:title`, `og:image`, `og:description`) are defined.
* **Semantic Structure:** Verify server-rendered pages use semantic HTML elements (`<header>`, `<main>`, `<h1>`) for crawler indexability.
* **Dynamic Routes:** Ensure `generateStaticParams()` is implemented where appropriate to pre-render static paths for search engines.

---

## Output Format

Structure your review feedback using the template below:

**Overview**
A 2-3 sentence summary of the code quality and high-priority concerns.

**Findings by Severity**

| Severity | File / Line | Issue Description | Suggested Fix |
| :--- | :--- | :--- | :--- |
| **Critical** | `lib/db.ts:14` | `ScanCommand` used on main table | Replace with `QueryCommand` on GSI |
| **High** | `app/api/users/route.ts:42` | AWS SDK imported in Client Component | Move DB execution to Server Action |
| **Medium** | `app/products/[id]/page.tsx` | Missing `generateMetadata` function | Add dynamic OpenGraph tags |
| **Low** | `components/Card.tsx` | Missing `React.cache()` on RSC fetch | Wrap DAL fetch function in `cache()` |

**Actionable Code Suggestions**
Provide refactored code snippets showing concrete fixes for any **Critical** or **High** severity issues found.