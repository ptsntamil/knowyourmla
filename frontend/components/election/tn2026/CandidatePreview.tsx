import React from 'react';
import Link from 'next/link';
import { User, IndianRupee, Gavel, ChevronRight } from 'lucide-react';
import { DashboardCandidate } from '@/lib/elections/preElectionDashboard/dashboard.types';
import PartyBadge from '@/components/ui/PartyBadge';
import { sortByPartyOrder, getPartyRank } from '@/lib/elections/preElectionDashboard/dashboard.utils';

interface CandidatePreviewProps {
  candidates: DashboardCandidate[];
}

export default function CandidatePreview({ candidates }: CandidatePreviewProps) {
  // Show top 6 for a nice grid, sorted primarily by constituency then party priority
  const previewCandidates = [...candidates]
    .sort((a, b) => {
      const conComp = a.constituencyName.localeCompare(b.constituencyName);
      if (conComp !== 0) return conComp;
      return getPartyRank(a.partyShortName) - getPartyRank(b.partyShortName);
    })
    .slice(0, 6);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tighter italic">
              Candidates (2026)
            </h2>
          </div>
          <p className="text-slate-500 font-medium text-sm">Browse announced candidates across Tamil Nadu.</p>
        </div>

        <Link
          href="/tn/elections/2026/candidates"
          className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold hover:text-brand-dark transition-colors group"
        >
          View All Candidates <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {previewCandidates.map((c, idx) => (
          <div key={`${c.id}-${idx}`} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 space-y-6 hover:border-brand-gold/20 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <Link href={`/tn/mla/${c.personId}`} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden hover:opacity-80 transition-opacity">
                  {c.profilePic ? (
                    <img src={c.profilePic} className="w-full h-full object-cover" alt={c.name} />
                  ) : (
                    <User size={20} />
                  )}
                </Link>
                <div className="space-y-0.5">
                  <Link href={`/tn/mla/${c.personId}`}>
                    <h3 className="font-black text-brand-dark uppercase italic tracking-tight truncate max-w-[120px] hover:text-brand-gold transition-colors">
                      {c.name}
                    </h3>
                  </Link>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.constituencyName}</p>
                </div>
              </div>
              <PartyBadge
                party={c.partyShortName || "IND"}
                colorBg={c.partyColorBg}
                colorText={c.partyColorText}
                colorBorder={c.partyColorBorder}
                logoUrl={c.partyLogoUrl}
                showName={false}
              />
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-1.5 text-slate-600">
                <IndianRupee size={12} className="text-emerald-500" />
                <span className="text-xs font-black">{c.totalAssets ? `₹${(c.totalAssets / 10000000).toFixed(1)}Cr` : '--'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${c.criminalCases && c.criminalCases > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                <Gavel size={12} />
                <span className="text-xs font-black">{c.criminalCases || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sm:hidden pt-4">
        <Link
          href="/tn/elections/2026/candidates"
          className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600"
        >
          View All Candidates <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
