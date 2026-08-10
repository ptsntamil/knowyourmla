import React from 'react';
import { Metadata } from 'next';
import { getCachedUrbanRuralComparison } from '@/lib/services/analysis.service';
import UrbanRuralComparisonCharts from '@/components/analysis/UrbanRuralComparisonCharts';
import UrbanRuralConstituencyTables from '@/components/analysis/UrbanRuralConstituencyTables';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function generateMetadata(): Metadata {
  return {
    title: "Urban vs Rural Voter Participation Analysis | Tamil Nadu Assembly Election 2026 | KnowYourMLA",
    description: "Compare how actual votes polled changed across Urban, Semi-Urban and Rural Assembly constituencies in Tamil Nadu between 2021 and 2026.",
    keywords: [
      "Urban voter turnout",
      "Rural voter turnout",
      "Urban vs rural voting",
      "Urban vote growth",
      "Rural vote growth",
      "Urban constituencies",
      "Rural constituencies",
      "Votes polled comparison",
      "Tamil Nadu election statistics",
      "Constituency-wise voting trends",
    ],
    alternates: {
      canonical: "/tn/analysis/urban-rural-2026-comparison",
    },
    openGraph: {
      title: "Urban vs Rural Voting Trends (2021 vs 2026)",
      description: "Compare how actual votes polled changed across Urban, Semi-Urban and Rural Assembly constituencies in Tamil Nadu.",
      url: "/tn/analysis/urban-rural-2026-comparison",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: "Urban vs Rural Voting Trends (2021 vs 2026)",
      description: "Compare how actual votes polled changed across Urban, Semi-Urban and Rural Assembly constituencies in Tamil Nadu.",
    }
  };
}

export default async function UrbanRuralAnalysisPage() {
  const data = await getCachedUrbanRuralComparison();
  const totalConstituencies = data.allConstituencies.length;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-500 gap-2">
            <Link href="/tn" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/tn/analysis" className="hover:text-blue-600 transition-colors">Analysis</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Urban vs Rural</span>
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <section className="mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Urban vs Rural Voting Trends (2021 vs 2026)
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-4xl">
            Compare how actual votes polled changed across Urban, Semi-Urban and Rural Assembly constituencies in Tamil Nadu between 2021 and 2026.
          </p>

          {/* Hero Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Urban Votes Added</p>
              <p className={`text-2xl font-bold ${data.urban.totalVotesAdded > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(data.urban.totalVotesAdded / 100000).toFixed(2)}L
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Semi-Urban Added</p>
              <p className={`text-2xl font-bold ${data.semiUrban.totalVotesAdded > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(data.semiUrban.totalVotesAdded / 100000).toFixed(2)}L
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Rural Votes Added</p>
              <p className={`text-2xl font-bold ${data.rural.totalVotesAdded > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(data.rural.totalVotesAdded / 100000).toFixed(2)}L
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Urban Growth %</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.urban.averageGrowthPercentage.toFixed(2)}%
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Semi-Urban Growth %</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.semiUrban.averageGrowthPercentage.toFixed(2)}%
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Rural Growth %</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.rural.averageGrowthPercentage.toFixed(2)}%
              </p>
            </div>

          </div>
        </section>

        {/* Methodology Note */}
        <div className="mb-12 bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3 shadow-sm">
          <div className="mt-0.5 flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong>Note on Methodology:</strong> The analysis on this page classifies all {totalConstituencies} Tamil Nadu constituencies into three distinct buckets: Urban, Semi-Urban, and Rural. This allows us to neutrally observe raw electoral participation growth based on regional demographics.
          </p>
        </div>

        {/* Automated Insights Section */}
        <section className="mt-12 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Insights</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {data.insights.slice(0, Math.ceil(data.insights.length / 2)).map((insight, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">{insight}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {data.insights.slice(Math.ceil(data.insights.length / 2)).map((insight, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visualizations Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Voting Trends Visualized</h2>
          <UrbanRuralComparisonCharts data={data} />
        </section>

        {/* Tables Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Constituency Data</h2>
          <UrbanRuralConstituencyTables 
            urbanData={data.allConstituencies.filter(c => c.category === "Urban")} 
            semiUrbanData={data.allConstituencies.filter(c => c.category === "Semi Urban")} 
            ruralData={data.allConstituencies.filter(c => c.category === "Rural")} 
          />
        </section>

      </main>
    </div>
  );
}
