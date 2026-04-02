This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## API Reference (V2)

The application uses an internal V2 API for enhanced analytics and performance.

### Parties API

#### `GET /api/v2/parties/[slug]`
Returns party metadata, analytics, and available election years.
- **Query Params**:
  - `year`: Optional. Filter analytics by a specific election year (e.g., `2021`). Default is "all".
- **Response**:
  - `party`: Party details
  - `analytics`: Detailed stats, age insights, asset data, and historical timeline
  - `availableElections`: List of all elections where the party contested

#### `GET /api/v2/parties/[slug]/candidates`
Returns the list of candidates for a specific party and year.
- **Query Params**:
  - `year`: Required. The election year.
