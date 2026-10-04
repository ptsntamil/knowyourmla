import React from 'react';
import { notFound } from 'next/navigation';
import { getTamilNaduPreElectionDashboardData } from '@/lib/elections/preElectionDashboard/getTamilNaduPreElectionDashboardData';
import CandidateDirectory from '@/components/election/dashboard/CandidateDirectory';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { commonBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const urlYear = year;
  const displayYear = urlYear === "202610" ? "2026 Bye-Election" : urlYear;
  return buildMetadata({
    title: `Tamil Nadu MLA Candidates ${displayYear} – Full List`,
    description: `Explore all announced candidates for the ${displayYear} Tamil Nadu Assembly Election. Filter by party, district, education, assets, and criminal cases.`,
    path: `/tn/elections/${urlYear}/candidates`,
    keywords: [
      `TN candidates ${displayYear}`,
      `Tamil Nadu MLA candidate list 2026`,
      `TN election candidate search`,
      `Tamil Nadu assembly candidates data`
    ]
  });
}

export default async function CandidatesExplorerPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const urlYear = year;
  const displayYear = urlYear === "202610" ? "2026 Bye-Election" : urlYear;
  const priorYear = urlYear === "202610" ? 2026 : 2021;
  const data = await getTamilNaduPreElectionDashboardData(urlYear, priorYear);

  if (!data) {
    notFound();
  }

  const { candidates, filters } = data;

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema
        items={[
          commonBreadcrumbs.home,
          { name: "Elections", item: "/tn/elections" },
          { name: `Tamil Nadu ${displayYear} Overview`, item: `/tn/elections/${urlYear}/dashboard` },
          { name: "Candidates", item: `/tn/elections/${urlYear}/candidates` }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12 space-y-4">
          <h1 className="text-3xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter italic">
            Candidates List <span className="text-brand-gold">2026</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-3xl leading-relaxed">
            Explore the complete list of candidates contesting in the Tamil Nadu Assembly Election 2026. 
            Filter by constituency, district, party, and candidate profile to gain deep insights into the election landscape.
          </p>
        </div>

        <React.Suspense fallback={<div className="h-96 w-full animate-pulse bg-slate-100 rounded-[2.5rem]" />}>
          <CandidateDirectory
            initialCandidates={candidates}
            filterOptions={filters}
          />
        </React.Suspense>
      </main>
    </div>
  );
}
