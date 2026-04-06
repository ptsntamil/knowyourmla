import React from 'react';
import { VoteShareEntry } from '@/lib/analytics/transformVoteShareHistory';
import { formatIndianNumberCompact } from '@/lib/utils/formatIndianNumberCompact';

interface VoteShareSummaryCardsProps {
  data: VoteShareEntry[];
}

export default function VoteShareSummaryCards({ data }: VoteShareSummaryCardsProps) {
  if (!data || data.length === 0) return null;

  const latestEntry = data[data.length - 1];
  const highestEntry = [...data].sort((a, b) => b.voteShare - a.voteShare)[0];

  const cards = [
    {
      label: "Highest Vote Share",
      value: `${highestEntry.voteShare.toFixed(1)}%`,
      subtext: highestEntry.year.toString(),
      icon: "📈"
    },
    {
      label: "Latest Vote Share",
      value: `${latestEntry.voteShare.toFixed(1)}%`,
      subtext: "Latest election",
      icon: "🗳️"
    },
    {
      label: "Total Votes (Latest)",
      value: formatIndianNumberCompact(latestEntry.votes),
      subtext: `${latestEntry.year} Election`,
      icon: "👥"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
            {card.icon}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{card.label}</p>
            <div className="flex items-baseline gap-2">
               <span className="text-2xl font-black text-brand-dark dark:text-slate-100 tracking-tighter">{card.value}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
