import React from 'react';
import { VoteShareEntry } from '@/lib/analytics/transformVoteShareHistory';
import { formatIndianNumberCompact } from '@/lib/utils/formatIndianNumberCompact';

interface VoteShareSnapshotCardProps {
  selectedYear: number | null;
  selectedData: VoteShareEntry | null;
  isLatest?: boolean;
}

export default function VoteShareSnapshotCard({ selectedYear, selectedData, isLatest }: VoteShareSnapshotCardProps) {
  if (!selectedData) return null;

  return (
    <div className="bg-brand-dark dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-white/5 relative overflow-hidden flex flex-col justify-between h-full group hover:scale-[1.02] transition-transform duration-300">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full -mr-16 -mt-16 blur-xl pointer-events-none" />
      
      <div className="relative z-10 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-brand-light-gold font-black uppercase tracking-[0.3em] text-[10px]">
              {isLatest ? 'Latest Election' : 'Selected Election'}
            </h3>
            {isLatest && !selectedYear && (
              <span className="text-[8px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                Latest Auto-selected
              </span>
            )}
          </div>
          <p className="text-3xl font-black text-white tracking-tighter">
            {selectedData.year} <span className="text-lg opacity-40">Assembly</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Vote Share</p>
            <p className="text-2xl font-black text-brand-green">{selectedData.voteShare.toFixed(1)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Total Votes</p>
            <p className="text-lg font-black text-white tracking-tight">{formatIndianNumberCompact(selectedData.votes, 1)}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-6 mt-6 border-t border-white/5">
        <p className="text-[10px] font-bold text-white/40 leading-relaxed italic">
          Data reflected based on the official ECI records for {selectedData.year}.
        </p>
      </div>
    </div>
  );
}
