import React from 'react';
import { notFound } from 'next/navigation';
import { getTamilNaduPreElectionDashboardData } from '@/lib/elections/preElectionDashboard/getTamilNaduPreElectionDashboardData';
import PartyRolloutSnapshot from '@/components/election/dashboard/PartyRolloutSnapshot';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { commonBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const urlYear = year;
  const displayYear = urlYear === "202610" ? "2026 Bye-Election" : urlYear;
  return buildMetadata({
    title: `Tamil Nadu Party Candidate Rollout ${displayYear} | Live Tracker`,
    description: `Track the progress of candidate announcements by DMK, AIADMK, BJP, NTK and other major parties in Tamil Nadu for the ${displayYear} Assembly Election.`,
    path: `/tn/elections/${urlYear}/parties`,
    keywords: [
      `TN party rollout 2026`,
      `DMK candidate list 2026`,
      `AIADMK candidate list 2026`,
      `party wise candidates TN 2026`
    ]
  });
}

export default async function PartiesTrackerPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const urlYear = year;
  const displayYear = urlYear === "202610" ? "2026 Bye-Election" : urlYear;
  const priorYear = urlYear === "202610" ? 2026 : 2021;
  const data = await getTamilNaduPreElectionDashboardData(urlYear, priorYear);

  if (!data) {
    notFound();
  }

  const { partyRollout } = data;

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema
        items={[
          commonBreadcrumbs.home,
          { name: "Elections", item: "/tn/elections" },
          { name: `Tamil Nadu ${displayYear} Overview`, item: `/tn/elections/${urlYear}/dashboard` },
          { name: "Parties", item: `/tn/elections/${urlYear}/parties` }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <PartyRolloutSnapshot partyRollout={partyRollout} />
      </main>
    </div>
  );
}
