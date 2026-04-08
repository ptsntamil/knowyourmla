import React from 'react';
import { notFound } from 'next/navigation';
import { getTamilNaduPreElectionDashboardData } from '@/lib/elections/preElectionDashboard/getTamilNaduPreElectionDashboardData';
import DashboardHero from '@/components/election/dashboard/DashboardHero';
import ElectionSnapshotStats from '@/components/election/dashboard/ElectionSnapshotStats';
import PartyRolloutSnapshot from '@/components/election/dashboard/PartyRolloutSnapshot';
import ConstituencyContestExplorer from '@/components/election/dashboard/ConstituencyContestExplorer';
import CandidateDirectory from '@/components/election/dashboard/CandidateDirectory';
import PreElectionInsights from '@/components/election/dashboard/PreElectionInsights';
import ElectionDashboardSEOContent from '@/components/election/dashboard/ElectionDashboardSEOContent';
import ElectionDashboardFAQ from '@/components/election/dashboard/ElectionDashboardFAQ';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { commonBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata() {
  const year = 2026;
  return buildMetadata({
    title: `Tamil Nadu Assembly Election ${year} Dashboard | Candidate Tracking & Contests`,
    description: `Track announced candidates, constituency contests, party rollout strategies, and real-time election insights across Tamil Nadu for the upcoming ${year} Assembly Election.`,
    path: `/tn/elections/${year}/dashboard`,
    keywords: [
      `Tamil Nadu Election ${year} candidates`,
      `Tamil Nadu Assembly Election ${year} dashboard`,
      `TN election candidate list ${year}`,
      `constituency-wise candidates TN ${year}`,
      `party rollout Tamil Nadu 2026`
    ]
  });
}

export default async function PreElectionDashboardPage() {
  const year = 2026;
  const data = await getTamilNaduPreElectionDashboardData();

  if (!data) {
    notFound();
  }

  const { stats, partyRollout, contests, candidates, insights, filters } = data;

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema
        items={[
          commonBreadcrumbs.home,
          { name: "Elections", item: "/tn/elections" },
          { name: `Tamil Nadu ${year} Dashboard`, item: `/tn/elections/${year}/dashboard` }
        ]}
      />

      <DashboardHero
        title={`Tamil Nadu Assembly Election ${year} Dashboard`}
        description="Track candidates, constituency-level contests, party rollout, and affidavit-based election insights across Tamil Nadu."
      />

      <main className="max-w-7xl mx-auto px-4 py-12 space-y-24">
        {/* 1. Election Snapshot Stats */}
        <section id="stats">
          <ElectionSnapshotStats stats={stats} />
        </section>

        {/* 2. Candidate Directory */}
        <section id="directory">
          <React.Suspense fallback={<div className="h-96 w-full animate-pulse bg-slate-100 rounded-[2.5rem]" />}>
            <CandidateDirectory
              initialCandidates={candidates}
              filterOptions={filters}
            />
          </React.Suspense>
        </section>

        {/* 3. Constituency Contest Explorer */}
        <section id="contests" className="pt-12 border-t border-slate-200">
          <ConstituencyContestExplorer contests={contests} />
        </section>

        {/* 4. Party Rollout Summary */}
        <section id="party-rollout" className="pt-12 border-t border-slate-200">
          <PartyRolloutSnapshot partyRollout={partyRollout} />
        </section>

        {/* 5. Pre-Election Insights */}
        <section id="insights" className="pt-12 border-t border-slate-200">
          <PreElectionInsights insights={insights} />
        </section>

        {/* 6. SEO Content */}
        <section id="about" className="pt-16">
          <ElectionDashboardSEOContent />
        </section>

        {/* 7. FAQ Section */}
        <section id="faq">
          <ElectionDashboardFAQ />
        </section>

        {/* 8. Internal Linking */}
        <section id="internal-links" className="pt-16 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">States & Elections</h3>
              <ul className="space-y-2">
                <li><a href="/tn" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">Tamil Nadu State Overview</a></li>
                <li><a href="/tn/elections/2021" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">2021 Assembly Results</a></li>
                <li><a href="/tn/elections" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">Election Archive</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">MLA Directory</h3>
              <ul className="space-y-2">
                <li><a href="/tn/mla/list" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">Current Tamil Nadu MLAs</a></li>
                <li><a href="/parties" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">Political Party Index</a></li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
