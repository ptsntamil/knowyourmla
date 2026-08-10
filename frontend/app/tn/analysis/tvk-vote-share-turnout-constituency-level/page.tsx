import React from 'react';
import { Metadata } from 'next';
import { TvkAnalysisService } from '@/lib/services/tvk-analysis.service';
import TvkCorrelationCharts from '@/components/analysis/TvkCorrelationCharts';
import TvkConstituencyTable from '@/components/analysis/TvkConstituencyTable';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: 'TVK Vote Share vs Vote Growth Analysis | Tamil Nadu Election 2026',
  description: 'Explore whether higher TVK vote share was associated with larger increases in voter turnout across Tamil Nadu constituencies.',
  alternates: {
    canonical: '/tn/analysis/tvk-vote-share-turnout-constituency-level',
  }
};

export default async function TvkAnalysisPage() {
  const service = new TvkAnalysisService();
  const data = await service.getTvkCorrelationAnalysis();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "TVK Vote Share and Vote Growth Analysis (2021-2026)",
    "description": "Statistical correlation analysis between TVK party vote share and overall vote growth across 234 assembly constituencies in Tamil Nadu.",
    "spatialCoverage": "Tamil Nadu, India",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Data Analysis
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            TVK Vote Share vs Vote Growth Analysis
          </h1>
          <p className="text-xl text-gray-500 max-w-3xl">
            Explore whether higher TVK vote share was associated with larger increases in actual votes polled between the 2021 and 2026 Assembly elections.
          </p>

          {/* Key Metrics */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Statewide TVK Avg Share</p>
              <div className="text-3xl font-bold text-gray-900">{data.metrics.average_tvk_share}%</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Statewide Avg Vote Growth</p>
              <div className="text-3xl font-bold text-gray-900">{data.metrics.average_vote_growth > 0 ? '+' : ''}{data.metrics.average_vote_growth}%</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Correlation Coefficient</p>
              <div className={`text-3xl font-bold ${Math.abs(data.metrics.correlation_share_vs_growth) > 0.3 ? 'text-blue-600' : 'text-gray-900'}`}>
                {data.metrics.correlation_share_vs_growth}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Highest TVK Share</p>
              <div className="text-3xl font-bold text-gray-900">{data.metrics.highest_tvk_share?.tvk_vote_share}%</div>
              <p className="text-xs text-gray-400 mt-1">{data.metrics.highest_tvk_share?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Important Methodology Warning */}
        <section>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
            <h3 className="text-lg font-bold text-blue-900 mb-2">Statistical Note: Correlation ≠ Causation</h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              This page measures the <strong>association</strong> between TVK's performance and the overall growth in voter turnout (absolute votes added). A positive correlation does <strong>not</strong> prove that TVK caused voter participation to increase. Other factors—such as underlying demographic shifts, local anti-incumbency, population growth, and competitive races—heavily influence turnout metrics. This analysis is presented purely for observational purposes.
            </p>
          </div>
        </section>

        {/* Dynamic Insights */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Observations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.metrics.insights.map((insight, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed pt-1">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Charts */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Visual Analysis</h2>
          <TvkCorrelationCharts data={data} />
        </section>

        {/* Full Constituency Table */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Constituency Breakdown</h2>
          <TvkConstituencyTable data={data} />
        </section>

      </main>
    </div>
  );
}
