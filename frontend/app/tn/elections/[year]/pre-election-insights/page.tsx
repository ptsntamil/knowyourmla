import React from 'react';
import { notFound } from 'next/navigation';
import { getTamilNaduPreElectionDashboardData } from '@/lib/elections/preElectionDashboard/getTamilNaduPreElectionDashboardData';
import PreElectionInsights from '@/components/election/dashboard/PreElectionInsights';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { commonBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const urlYear = year;
  const displayYear = urlYear === "202610" ? "2026 Bye-Election" : urlYear;
  return buildMetadata({
    title: `Tamil Nadu Election Insights ${displayYear} | Financials, Criminal Cases & Demographics`,
    description: `Deep dive into the data behind the ${displayYear} Tamil Nadu Assembly Election. Analyze candidate assets, criminal records, age distributions, and incumbency patterns.`,
    path: `/tn/elections/${urlYear}/pre-election-insights`,
    keywords: [
      `TN election insights ${displayYear}`,
      `Tamil Nadu assembly election analytics`,
      `ML candidates wealth analysis`,
      `criminal cases in TN elections 2026`
    ]
  });
}

export default async function InsightsPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const urlYear = year;
  const displayYear = urlYear === "202610" ? "2026 Bye-Election" : urlYear;
  const priorYear = urlYear === "202610" ? 2026 : 2021;
  const data = await getTamilNaduPreElectionDashboardData(urlYear, priorYear);

  if (!data) {
    notFound();
  }

  const { insights } = data;

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema
        items={[
          commonBreadcrumbs.home,
          { name: "Elections", item: "/tn/elections" },
          { name: `Tamil Nadu ${displayYear} Overview`, item: `/tn/elections/${urlYear}/dashboard` },
          { name: "Pre-Election Insights", item: `/tn/elections/${urlYear}/pre-election-insights` }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <PreElectionInsights insights={insights} urlYear={urlYear} />
      </main>
    </div>
  );
}
