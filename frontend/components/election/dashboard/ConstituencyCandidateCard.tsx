import React from 'react';
import Link from 'next/link';
import { OverlayCandidate } from '@/lib/elections/preElectionDashboard/dashboard.types';
import { Briefcase, GraduationCap, Scale, History, ShieldCheck, MapPin } from 'lucide-react';
import PartyBadge from '@/components/ui/PartyBadge';

interface ConstituencyCandidateCardProps {
  candidate: OverlayCandidate;
}

export default function ConstituencyCandidateCard({ candidate }: ConstituencyCandidateCardProps) {
  const profileHref = `/tn/mla/${candidate.personId}`;
  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "N/A";
    if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)} L`;
    return val.toLocaleString();
  };

  return (
    <div className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-brand-gold/10 hover:-translate-y-1 relative overflow-hidden flex flex-col h-full">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
      
      <div className="relative z-10 flex flex-col h-full space-y-6">
        {/* Header: Name and Party */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Link href={profileHref}>
              <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight italic leading-tight hover:text-brand-gold transition-colors">
                {candidate.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2">
              <PartyBadge 
                party={candidate.partyName || "Independent"}
                shortName={candidate.partyShortName}
                logoUrl={candidate.partyLogoUrl}
                showName={false}
              />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{candidate.partyName}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1.5 shrink-0">
             {candidate.isIncumbent && (
               <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-brand-gold/10 text-brand-gold border border-brand-gold/10 shadow-sm whitespace-nowrap flex items-center gap-1">
                 <ShieldCheck size={10} />
                 Incumbent
               </span>
             )}
             {candidate.isNewcomer && (
               <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 shadow-sm whitespace-nowrap">
                 Newcomer
               </span>
             )}
          </div>
        </div>

        {/* Intelligence Badges */}
        <div className="flex flex-wrap gap-2">
          {candidate.constituencyContestType === 'own_constituency' && (
            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-brand-green/10 text-brand-green border border-brand-green/10 flex items-center gap-1">
              <MapPin size={10} />
              Home Contest
            </span>
          )}
          {candidate.constituencyContestType === 'cross_constituency' && (
            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center gap-1">
              <MapPin size={10} />
              Cross-Constituency
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Scale size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Total Assets</span>
            </div>
            <p className="text-sm font-black text-brand-dark">{formatCurrency(candidate.totalAssets)}</p>
          </div>
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <History size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Criminal Cases</span>
            </div>
            <p className={`text-sm font-black ${candidate.criminalCases && candidate.criminalCases > 0 ? 'text-rose-600' : 'text-brand-green'}`}>
              {candidate.criminalCases || 0} Cases
            </p>
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-4 py-2 flex-grow">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
              <GraduationCap size={16} className="text-slate-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Education</p>
              <p className="text-xs font-bold text-slate-700 leading-tight line-clamp-2 md:line-clamp-none">{candidate.education || "Information Awaited"}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
              <Briefcase size={16} className="text-slate-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Profession</p>
              <p className="text-xs font-bold text-slate-700 leading-tight line-clamp-2 md:line-clamp-none">{candidate.profession || "Information Awaited"}</p>
            </div>
          </div>
        </div>

        {/* Footer Link / Profile Action */}
        <div className="pt-4 border-t border-slate-50 mt-auto">
          <Link 
            href={profileHref}
            className="w-full py-3 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center hover:bg-brand-gold transition-all shadow-md shadow-brand-dark/10"
          >
            View Full Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
