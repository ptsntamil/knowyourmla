import React from 'react';
import { notFound } from 'next/navigation';
import { getTamilNaduPreElectionDashboardData } from '@/lib/elections/preElectionDashboard/getTamilNaduPreElectionDashboardData';
import PreElectionInsights from '@/components/election/dashboard/PreElectionInsights';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { commonBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata() {
  const year = 2026;
  return buildMetadata({
    title: `Tamil Nadu Election Insights ${year} | Financials, Criminal Cases & Demographics`,
    description: `Deep dive into the data behind the ${year} Tamil Nadu Assembly Election. Analyze candidate assets, criminal records, age distributions, and incumbency patterns.`,
    path: `/tn/elections/${year}/insights`,
    keywords: [
      `TN election insights ${year}`,
      `Tamil Nadu assembly election analytics`,
      `ML candidates wealth analysis`,
      `criminal cases in TN elections 2026`
    ]
  });
}

export default async function InsightsPage() {
  const year = 2026;
  const data = await getTamilNaduPreElectionDashboardData();

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
          { name: `Tamil Nadu ${year} Overview`, item: `/tn/elections/${year}/dashboard` },
          { name: "Insights", item: `/tn/elections/${year}/insights` }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <PreElectionInsights insights={insights} />
      </main>
    </div>
  );
}
