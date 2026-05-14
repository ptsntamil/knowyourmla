import React from 'react';
import Link from 'next/link';
import { MapPin, Users, History, ArrowRight } from 'lucide-react';
import { ContestCard } from '@/lib/elections/preElectionDashboard/dashboard.types';
import PartyBadge from '@/components/ui/PartyBadge';

interface ConstituencyPreviewCardProps {
  contest: ContestCard;
}

export default function ConstituencyPreviewCard({ contest }: ConstituencyPreviewCardProps) {
  return (
    <div className="group bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 hover:shadow-brand-gold/10 hover:-translate-y-1 transition-all flex flex-col h-full relative overflow-hidden">
      {/* Accent Background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>

      <div className="relative z-10 space-y-6 flex flex-col h-full">
        {/* Header */}
        <div className="space-y-1">
          <Link
            href={`/tn/constituency/${contest.constituencyId}`}
            className="text-xl font-black text-brand-dark uppercase tracking-tight italic hover:text-brand-gold transition-colors block leading-tight pt-1"
          >
            {contest.constituencyName}
          </Link>
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
            <MapPin size={10} className="text-brand-gold" />
            {contest.districtName}
          </div>
        </div>

        {/* Current Info */}
        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50 space-y-3">
          <div className="flex items-center gap-1.5 opacity-60">
            <History size={12} className="text-slate-400" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">2021 Results</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              {contest.lastWinner ? (
                <Link 
                  href={`/tn/mla/${contest.lastWinnerPersonId}`}
                  className="text-xs font-bold text-slate-700 leading-tight truncate max-w-[120px] hover:text-brand-gold transition-colors block"
                >
                  {contest.lastWinner}
                </Link>
              ) : (
                <p className="text-xs font-bold text-slate-700 leading-tight">N/A</p>
              )}
              {/* <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                {contest.lastWinnerPartyShort || "IND"}
              </p> */}
            </div>
            <PartyBadge 
              party={contest.lastWinnerParty || "Independent"}
              shortName={contest.lastWinnerPartyShort}
              colorBg={contest.lastWinnerPartyColorBg}
              colorText={contest.lastWinnerPartyColorText}
              colorBorder={contest.lastWinnerPartyColorBorder}
            />
          </div>
        </div>

        {/* 2026 Candidates */}
        <div className="space-y-3 flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 opacity-60">
              <Users size={12} className="text-slate-400" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">2026 Candidates</span>
            </div>
            <span className="text-xs font-black text-brand-dark bg-slate-100 px-2 py-0.5 rounded-lg">
              {contest.candidateCount}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {contest.tags.slice(0, 2).map((t, i) => (
              <span key={i} className="text-[8px] font-black uppercase tracking-widest bg-brand-gold/10 text-brand-gold border border-brand-gold/10 px-2 py-1 rounded-lg">
                {t}
              </span>
            ))}
            {contest.tags.length > 2 && (
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest py-1">
                + {contest.tags.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Footer Link */}
        <Link 
          href={`/tn/constituency/${contest.constituencyId}`}
          className="pt-4 border-t border-slate-50 mt-auto flex items-center justify-between group/footer"
        >
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/footer:text-brand-gold transition-colors">Full Details</span>
          <div className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center text-white transform transition-all group-hover/footer:translate-x-1 group-hover/footer:bg-brand-gold">
            <ArrowRight size={14} />
          </div>
        </Link>
      </div>
    </div>
  );
}
