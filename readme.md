KnowYourMLA – Tamil Nadu Political Intelligence Platform
📌 Project Vision

KnowYourMLA is a political intelligence platform designed to build a structured, historical, and analytics-ready database of Tamil Nadu Assembly elections.

The platform aggregates and enriches data from:

IndiaVotes (Election Results Summary)

Myneta (Affidavit & Financial Data)

Future: Election Commission of India (Official Records)

The goal is to create a scalable data foundation for:

MLA Profiles

Asset Growth Tracking

Criminal Case Monitoring

Education & Profession Insights

Reservation Rotation Analysis

Constituency-Level Political Trends

⚠️ Database Structure Update

The original single-table DynamoDB structure has been updated.

👉 Please refer to @db_readme.md for the latest and authoritative database schema, key structure, and access patterns.

This README focuses on system architecture and data pipeline concepts.
All database-specific details must be taken from @db_readme.md.

🏗 System Architecture

The platform follows a dual-layer architecture designed for high performance, SEO, and scalable data ingestion.

### 1️⃣ Application Layer (Unified Full Stack)
- **Next.js (App Router)**: A unified full-stack application serving both the UI and the API layer.
- **SSR-First**: Prioritizes Server-Side Rendering for maximum SEO and performance.
- **Direct Data Access**: Fetches data from DynamoDB via the AWS SDK for efficient, low-latency responses.

### 2️⃣ Data Pipeline Layer (Python)
- **Scraper Suite**: Python-based scrapers (BeautifulSoup/Requests) that extract and normalize data from IndiaVotes and Myneta.
- **Ingestion Engine**: Processes raw data and populates the structured DynamoDB tables.
- **Independent Life Cycle**: The data layer runs independently of the web application, ensuring reliable updates without impacting live traffic.

Core Database: **AWS DynamoDB** (Single Table Design — see @db_readme.md)

📊 Data Sources
1️⃣ Election Results (IndiaVotes)

From IndiaVotes we collect:

AC Name

AC No

Reservation Type (GEN / SC / ST)

District

Winning Candidate

Party

Total Electors

Total Votes

Poll %

Winning Margin

Only one AJAX call per election year is required to extract all constituency summary data.

2️⃣ Affidavit Data (Myneta)

From Myneta candidate affidavit pages we extract:

Total Assets

Total Liabilities

Criminal Cases

Education Qualification

Income (as per ITR)

Election Expenses

Profession

This enriches our MLA data layer with financial and legal intelligence.

🔄 Data Pipeline
Step 1 – Election Ingestion

For each election year:

Warm up HTTP session

Make one AJAX request to fetch full summary table

Parse constituency-level data

Insert structured data into DynamoDB

This builds:

Constituency master data

Year-specific metadata

Winning candidate records

Step 2 – Affidavit Enrichment

For each winning candidate:

Search Myneta for candidate affidavit

Match candidate by name and constituency

Extract affidavit details

Normalize monetary values

Store enriched data in DynamoDB

Compute asset growth if previous affidavit exists

Asset Growth Formula:

Growth % = ((Current Assets − Previous Assets) / Previous Assets) × 100

📈 Analytics Capabilities

After enrichment, the system can support:

Asset growth trends

Wealth ranking of MLAs

Criminal case tracking over time

Education distribution analysis

Reservation impact analysis

Party dominance trends

Margin swing comparison

Poll percentage evolution

🧠 Design Principles

Single table DynamoDB modeling

Time-series aware structure

Batch write optimization

Scalable architecture

Clean separation of ingestion and enrichment

Analytics-friendly schema

(Refer to @db_readme.md for exact entity structure and keys.)

🚀 Future Enhancements

Planned expansions include:

- Official Election Commission data integration
- Party switching history tracking
- Constituency development indicators
- ML-based anomaly detection (asset growth outliers)
- S3 archival of raw HTML
- Step Functions orchestration
- Antigravity AI Branding & Intelligent Assistance

🛡 Stability & Risk Management

IndiaVotes scraping minimized (1 call per year)

Myneta scraping rate-limited

DynamoDB batch writes used

Normalization ensures key consistency

Graceful handling of missing data

🎯 End Goal

To build a transparent, structured, and analytics-driven MLA intelligence platform for Tamil Nadu.

KnowYourMLA will allow users to:

View complete MLA profiles

Track financial growth across elections

Analyze political trends

Understand criminal background history

Study reservation rotation impact

Make data-driven political comparisons

📌 Technology Stack

- **Unified Full Stack**: Next.js 16+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS (Lucide Icons)
- **Data Layer**: Python (BeautifulSoup, Requests)
- **Infrastructure**: AWS (DynamoDB, Lambda, S3, Secrets Manager)
- **Analytics**: Recharts, Vercel Analytics
- **Project Tracking & Quality**: Sonar Way compliance, Antigravity AI Standards