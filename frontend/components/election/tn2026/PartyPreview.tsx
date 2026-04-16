import React from 'react';
import Link from 'next/link';
import { ChevronRight, Landmark } from 'lucide-react';
import { PartyRolloutSummary } from '@/lib/elections/preElectionDashboard/dashboard.types';
import PartyBadge from '@/components/ui/PartyBadge';

interface PartyPreviewProps {
  partyRollout: PartyRolloutSummary[];
}

export default function PartyPreview({ partyRollout }: PartyPreviewProps) {
  // Show top 5 parties
  const previewParties = partyRollout.slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tighter italic">
              Party Rollout
            </h2>
          </div>
          <p className="text-slate-500 font-medium text-sm">Track party-wise candidate announcements and seat coverage across Tamil Nadu Assembly Election 2026.</p>
        </div>

        <Link
          href="/tn/elections/2026/parties"
          className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold hover:text-brand-dark transition-colors group"
        >
          View Party Tracker <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Political Party</th>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidates</th>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Snapshot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {previewParties.map((p, idx) => (
              <tr key={`${p.partyId}-${idx}`} className="group hover:bg-slate-50/50 transition-colors">
                <td className="py-6 px-8">
                  <div className="flex items-center gap-3">
                    <PartyBadge 
                      party={p.partyName}
                      shortName={p.shortName}
                      logoUrl={p.logoUrl}
                      showName={false}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-brand-dark uppercase tracking-tight italic leading-tight">
                        {p.partyName}
                      </span>
                      {/* <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                        {p.shortName}
                      </span> */}
                    </div>
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-brand-dark">{p.candidatesAnnounced}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ 234</span>
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-gold rounded-full"
                        style={{ width: `${(p.candidatesAnnounced / 234) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-400">
                      {((p.candidatesAnnounced / 234) * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden pt-4">
        <Link
          href="/tn/elections/2026/parties"
          className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600"
        >
          View Party Tracker <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
