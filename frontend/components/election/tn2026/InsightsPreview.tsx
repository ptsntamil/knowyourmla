import React from 'react';
import Link from 'next/link';
import { ChevronRight, CreditCard, User, Gavel, Calendar } from 'lucide-react';
import { DashboardInsights } from '@/lib/elections/preElectionDashboard/dashboard.types';

interface InsightsPreviewProps {
  insights: DashboardInsights;
}

export default function InsightsPreview({ insights }: InsightsPreviewProps) {
  const highlights = [
    {
      title: 'Richest Candidate',
      data: insights.richestCandidates[0],
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Youngest Candidate',
      data: insights.youngestCandidates[0],
      icon: Calendar,
      color: 'bg-brand-gold/10 text-brand-gold',
    },
    {
      title: 'Most Criminal Cases',
      data: insights.mostCriminalCases[0],
      icon: Gavel,
      color: 'bg-rose-50 text-rose-500',
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tighter italic">
              Key Insights
            </h2>
          </div>
          <p className="text-slate-500 font-medium text-sm">Pre-election database highlights and numeric patterns.</p>
        </div>
        
        <Link 
          href="/tn/elections/2026/insights"
          className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold hover:text-brand-dark transition-colors group"
        >
          View Full Insights <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {highlights.map((h, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 space-y-6 hover:translate-y-[-4px] transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${h.color}`}>
                <h.icon size={20} />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                {h.title}
              </h3>
            </div>

            {h.data ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link href={`/tn/mla/${h.data.personId}`} className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0 hover:opacity-80 transition-opacity">
                    {h.data.profilePic ? (
                      <img src={h.data.profilePic} className="w-full h-full object-cover" alt={h.data.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User size={14} />
                      </div>
                    )}
                  </Link>
                  <div>
                    <Link href={`/tn/mla/${h.data.personId}`}>
                      <p className="text-xs font-black text-brand-dark truncate max-w-[120px] hover:text-brand-gold transition-colors">{h.data.name}</p>
                    </Link>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{h.data.party}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-50">
                  <p className="text-lg font-black text-brand-dark">{h.data.formattedValue}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-400 italic">No data available yet</p>
            )}
          </div>
        ))}
      </div>

      <div className="sm:hidden pt-4">
        <Link 
          href="/tn/elections/2026/insights"
          className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600"
        >
          View Full Insights <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
