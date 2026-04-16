import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { ContestCard } from '@/lib/elections/preElectionDashboard/dashboard.types';
import ConstituencyPreviewCard from '@/components/election/tn2026/ConstituencyPreviewCard';

interface ConstituencyPreviewProps {
  contests: ContestCard[];
}

export default function ConstituencyPreview({ contests }: ConstituencyPreviewProps) {
  // Show 8 contests for the grid
  const previewContests = contests.slice(0, 8);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tighter italic">
              Constituency Contests
            </h2>
          </div>
          <p className="text-slate-500 font-medium text-sm">Explore constituency-wise contests and candidate presence across all Tamil Nadu constituencies for the 2026 election.</p>
        </div>

        <Link
          href="/tn/elections/2026/constituencies"
          className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold hover:text-brand-dark transition-colors group"
        >
          Explore All Contests <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {previewContests.map((contest, idx) => (
          <ConstituencyPreviewCard
            key={`${contest.constituencyId}-${idx}`}
            contest={contest}
          />
        ))}
      </div>

      <div className="pt-8">
        <Link
          href="/tn/elections/2026/constituencies"
          className="flex items-center justify-center gap-3 w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:border-brand-gold hover:text-brand-gold transition-all group"
        >
          <span>See results for all 234 constituencies</span>
          <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
