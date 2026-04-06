import React from 'react';
import { VoteShareEntry } from '@/lib/analytics/transformVoteShareHistory';
import { formatIndianNumberCompact } from '@/lib/utils/formatIndianNumberCompact';

interface VoteShareTableProps {
  data: VoteShareEntry[];
}

export default function VoteShareTable({ data }: VoteShareTableProps) {
  if (!data || data.length === 0) return null;

  // Show newest first in table
  const displayData = [...data].reverse();

  return (
    <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Election Year</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Vote Share %</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Total Votes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {displayData.map((entry) => (
            <tr key={entry.year} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-gold rounded-full group-hover:scale-150 transition-transform" />
                  <span className="text-sm font-black text-brand-dark dark:text-slate-100">{entry.year}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-brand-green">
                {entry.voteShare.toFixed(1)}%
              </td>
              <td className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                {formatIndianNumberCompact(entry.votes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
