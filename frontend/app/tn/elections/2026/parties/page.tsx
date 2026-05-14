import React from 'react';
import { notFound } from 'next/navigation';
import { getTamilNaduPreElectionDashboardData } from '@/lib/elections/preElectionDashboard/getTamilNaduPreElectionDashboardData';
import PartyRolloutSnapshot from '@/components/election/dashboard/PartyRolloutSnapshot';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { commonBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata() {
  const year = 2026;
  return buildMetadata({
    title: `Tamil Nadu Party Candidate Rollout ${year} | Live Tracker`,
    description: `Track the progress of candidate announcements by DMK, AIADMK, BJP, NTK and other major parties in Tamil Nadu for the ${year} Assembly Election.`,
    path: `/tn/elections/${year}/parties`,
    keywords: [
      `TN party rollout 2026`,
      `DMK candidate list 2026`,
      `AIADMK candidate list 2026`,
      `party wise candidates TN 2026`
    ]
  });
}

export default async function PartiesTrackerPage() {
  const year = 2026;
  const data = await getTamilNaduPreElectionDashboardData();

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
          { name: `Tamil Nadu ${year} Overview`, item: `/tn/elections/${year}/dashboard` },
          { name: "Parties", item: `/tn/elections/${year}/parties` }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <PartyRolloutSnapshot partyRollout={partyRollout} />
      </main>
    </div>
  );
}
