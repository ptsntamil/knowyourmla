import React from 'react';
import VoteShareSummaryCards from './VoteShareSummaryCards';
import VoteShareTrendChart from './VoteShareTrendChart';
import VoteShareTable from './VoteShareTable';
import VoteShareSnapshotCard from './VoteShareSnapshotCard';
import { transformVoteShareHistory, VoteShareEntry } from '@/lib/analytics/transformVoteShareHistory';

interface VoteShareByElectionSectionProps {
  voteShare: any; // party.vote_share
  selectedYear?: number | null;
}

export default function VoteShareByElectionSection({ voteShare, selectedYear }: VoteShareByElectionSectionProps) {
  const assemblyData = transformVoteShareHistory(voteShare?.assembly);

  if (assemblyData.length === 0) {
    return (
      <section id="vote-share" className="space-y-8 mt-24 sm:mt-32">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-5xl font-black text-brand-dark dark:text-slate-900 uppercase tracking-tighter">Vote Share by Election</h2>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">No assembly vote share history available.</p>
        </div>
      </section>
    );
  }

  // Find data for the selected year or fallback to latest
  const latestData = assemblyData[assemblyData.length - 1];
  const selectedData = selectedYear 
    ? (assemblyData.find(d => d.year === selectedYear) || latestData)
    : latestData;

  const isFallback = selectedYear && !assemblyData.find(d => d.year === selectedYear);

  // Compute trend insight
  let trendInsight = "";
  const selectedIndex = assemblyData.findIndex(d => d.year === selectedData.year);
  if (selectedIndex > 0) {
    const prevData = assemblyData[selectedIndex - 1];
    const diff = selectedData.voteShare - prevData.voteShare;
    trendInsight = `Vote share ${diff >= 0 ? 'increased' : 'decreased'} ${Math.abs(diff).toFixed(1)} pts from ${prevData.year}`;
  } else {
    trendInsight = `Latest vote share: ${selectedData.voteShare.toFixed(1)}%`;
  }

  return (
    <section id="vote-share" className="space-y-12 sm:space-y-16 mt-24 sm:mt-32">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-5xl font-black text-brand-dark dark:text-slate-900 uppercase tracking-tighter transition-all">
            Vote Share Across Elections
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] max-w-2xl leading-relaxed">
            See how this party’s assembly vote share has changed over time.
          </p>
        </div>
        {selectedYear && (
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
             Highlighting: <span className="text-brand-dark dark:text-slate-200">{selectedData.year} Election</span>
             {isFallback && <span className="ml-2 text-brand-gold opacity-75">(Data fallback)</span>}
           </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-2">
          <VoteShareTrendChart data={assemblyData} selectedYear={selectedYear} />
        </div>
        <div className="lg:col-span-1">
          <VoteShareSnapshotCard 
            selectedYear={selectedYear ?? null} 
            selectedData={selectedData} 
            isLatest={!!(!selectedYear || isFallback)}
          />
        </div>
      </div>

      {/* Trend Insight & Summary */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          <span className="text-[10px] font-black text-brand-green uppercase tracking-[0.3em] px-4 py-1.5 bg-brand-green/5 rounded-full border border-brand-green/10">
            {trendInsight}
          </span>
          <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        </div>

        {/* Search-friendly explanatory block */}
        <div className="max-w-4xl mx-auto text-center space-y-4 pb-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            This analytical chart tracks voter support trends for the party across Tamil Nadu Assembly elections. 
            While <strong>seats won</strong> reflect electoral victories in specific constituencies, 
            <strong>vote share percentage</strong> represents the broader base of support among the electorate. 
            The latest results highlight the party's current standing and growth patterns compared to previous cycles.
          </p>
        </div>

        <VoteShareSummaryCards data={assemblyData} />
      </div>

      {/* Breakdown Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Election Breakdown</h3>
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sorted Newest First</span>
        </div>
        <VoteShareTable data={assemblyData} />
      </div>
    </section>
  );
}
