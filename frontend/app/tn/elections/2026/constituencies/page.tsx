import React from 'react';
import { notFound } from 'next/navigation';
import { getTamilNaduPreElectionDashboardData } from '@/lib/elections/preElectionDashboard/getTamilNaduPreElectionDashboardData';
import ConstituencyContestExplorer from '@/components/election/dashboard/ConstituencyContestExplorer';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { commonBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata() {
  const year = 2026;
  return buildMetadata({
    title: `Tamil Nadu Constituency Contests ${year} | Search all 234 Seats`,
    description: `Detailed tracking of candidates across all 234 constituencies in the ${year} Tamil Nadu Assembly Election. Identify multi-cornered contests and open seats.`,
    path: `/tn/elections/${year}/constituencies`,
    keywords: [
      `TN constituency contests ${year}`,
      `Tamil Nadu assembly seats 2026`,
      `constituency wise candidates tracking`,
      `TN election contest explorer`
    ]
  });
}

export default async function ConstituenciesExplorerPage() {
  const year = 2026;
  const data = await getTamilNaduPreElectionDashboardData();

  if (!data) {
    notFound();
  }

  const { contests, filters } = data;

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema
        items={[
          commonBreadcrumbs.home,
          { name: "Elections", item: "/tn/elections" },
          { name: `Tamil Nadu ${year} Overview`, item: `/tn/elections/${year}/dashboard` },
          { name: "Constituencies", item: `/tn/elections/${year}/constituencies` }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <React.Suspense fallback={<div className="min-h-screen animate-pulse bg-slate-50 rounded-[3rem]" />}>
          <ConstituencyContestExplorer contests={contests} filters={filters} />
        </React.Suspense>
      </main>
    </div>
  );
}
