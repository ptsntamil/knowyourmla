import React from 'react';
import { notFound } from 'next/navigation';
import { getTamilNaduPreElectionDashboardData } from '@/lib/elections/preElectionDashboard/getTamilNaduPreElectionDashboardData';
import ConstituencyContestExplorer from '@/components/election/dashboard/ConstituencyContestExplorer';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { commonBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const urlYear = year;
  const displayYear = urlYear === "202610" ? "2026 Bye-Election" : urlYear;
  return buildMetadata({
    title: `Tamil Nadu Constituency Contests ${displayYear} | Search contesting Seats`,
    description: `Detailed tracking of candidates across contesting constituencies in the ${displayYear} Tamil Nadu Assembly Election. Identify multi-cornered contests and open seats.`,
    path: `/tn/elections/${urlYear}/constituencies`,
    keywords: [
      `TN constituency contests ${displayYear}`,
      `Tamil Nadu assembly seats 2026`,
      `constituency wise candidates tracking`,
      `TN election contest explorer`
    ]
  });
}

export default async function ConstituenciesExplorerPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const urlYear = year;
  const displayYear = urlYear === "202610" ? "2026 Bye-Election" : urlYear;
  const priorYear = urlYear === "202610" ? 2026 : 2021;
  const data = await getTamilNaduPreElectionDashboardData(urlYear, priorYear);

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
          { name: `Tamil Nadu ${displayYear} Overview`, item: `/tn/elections/${urlYear}/dashboard` },
          { name: "Constituencies", item: `/tn/elections/${urlYear}/constituencies` }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <React.Suspense fallback={<div className="min-h-screen animate-pulse bg-slate-50 rounded-[3rem]" />}>
          <ConstituencyContestExplorer contests={contests} filters={filters} urlYear={urlYear} />
        </React.Suspense>
      </main>
    </div>
  );
}
