"use client";

import React, { useState, useMemo } from 'react';
import { ContestCard } from '@/lib/elections/preElectionDashboard/dashboard.types';
import Link from 'next/link';
import PartyBadge from '@/components/ui/PartyBadge';
import { Search, MapPin, Users, History, ArrowRight } from 'lucide-react';

interface ConstituencyContestExplorerProps {
  contests: ContestCard[];
}

export default function ConstituencyContestExplorer({ contests }: ConstituencyContestExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState<string>("All");

  const tags = useMemo(() => {
    const allTags = new Set<string>();
    contests.forEach(c => c.tags.forEach(t => allTags.add(t)));
    return ["All", ...Array.from(allTags)];
  }, [contests]);

  const filteredContests = useMemo(() => {
    return contests.filter(c => {
      const matchesSearch = c.constituencyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.districtName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = filterTag === "All" || c.tags.includes(filterTag);
      return matchesSearch && matchesTag;
    });
  }, [contests, searchTerm, filterTag]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
            <h2 className="text-2xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter italic leading-none">
              Contest Explorer
            </h2>
          </div>
          <p className="text-slate-500 font-medium text-sm max-w-xl">
            Analyze election dynamics across 234 seats. Identify open contests, incumbent defenses, and regional battlegrounds.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex flex-col gap-1.5 min-w-[240px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Find Seat</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Constituency name..."
                className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all shadow-sm shadow-slate-200/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Pattern</label>
             <div className="flex bg-slate-100 p-1 rounded-xl">
               {tags.slice(0, 4).map((tag, idx) => (
                 <button
                    key={`${tag}-${idx}`}
                    onClick={() => setFilterTag(tag)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      filterTag === tag ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                 >
                   {tag}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredContests.slice(0, 18).map((contest, idx) => (
          <div key={`${contest.constituencyId}-${idx}`} className="group flex flex-col bg-white border border-slate-100 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-brand-gold/10 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative z-10 flex flex-col h-full space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Link 
                    href={`/tn/constituency/${contest.constituencyId}`} 
                    className="text-2xl font-black text-brand-dark uppercase tracking-tight italic hover:text-brand-gold transition-colors block leading-none"
                  >
                    {contest.constituencyName}
                  </Link>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <MapPin size={10} className="text-brand-gold" />
                    {contest.districtName}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                   {contest.tags.map((t, idx) => (
                     <span key={`${t}-${idx}`} className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-brand-gold/10 text-brand-gold border border-brand-gold/10 shadow-sm whitespace-nowrap">
                       {t}
                     </span>
                   ))}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <History size={14} className="text-slate-400" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">2021 Winner</span>
                   </div>
                   {typeof contest.lastMargin === 'number' && (
                     <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                       contest.lastMargin < 5000 ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'
                     }`}>
                       +{contest.lastMargin.toLocaleString()} Margin
                     </span>
                   )}
                </div>

                <div className="flex items-center justify-between px-1">
                  {contest.lastWinner ? (
                    <>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-700 text-sm leading-tight">{contest.lastWinner}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{contest.lastWinnerPartyShort}</p>
                      </div>
                      <PartyBadge 
                        party={contest.lastWinnerPartyShort || "IND"} 
                      />
                    </>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 italic">No historical data found</p>
                  )}
                </div>
              </div>

              {/* 2026 Candidates */}
              <div className="flex-grow space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Users size={14} className="text-slate-400" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2026 Candidates</span>
                   </div>
                   <span className="bg-brand-dark text-white text-[10px] font-black px-2.5 py-1 rounded-lg">{contest.candidateCount}</span>
                </div>

                <div className="space-y-3">
                  {contest.candidates.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {contest.candidates.slice(0, 3).map((cand, idx) => (
                          <div key={`${cand.id}-${idx}`} className="flex items-center justify-between group/row p-2 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                 {cand.partyLogoUrl ? (
                                   <img src={cand.partyLogoUrl} alt={cand.partyShortName} className="w-5 h-5 object-contain" />
                                 ) : (
                                   <div className="text-[8px] font-black uppercase">{cand.partyShortName}</div>
                                 )}
                               </div>
                               <div className="space-y-0.5">
                                 <Link 
                                   href={`/tn/mla/${cand.personId}`}
                                   className="font-bold text-brand-dark text-sm leading-none hover:text-brand-gold transition-colors block"
                                 >
                                   {cand.name}
                                 </Link>
                                 {cand.isIncumbent && <p className="text-[9px] font-black text-brand-gold uppercase tracking-widest italic">Defending MLA</p>}
                               </div>
                             </div>
                             <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover/row:opacity-100 -translate-x-2 group-hover/row:translate-x-0 transition-all" />
                          </div>
                        ))}
                      </div>
                      {contest.candidateCount > 3 && (
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+ {contest.candidateCount - 3} more announced</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-4 text-center">
                       <p className="text-sm font-medium text-slate-400 italic">No candidates announced yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredContests.length > 18 && (
        <div className="flex flex-col items-center gap-4 py-8">
           <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Showing {18} of {filteredContests.length} seats</p>
           <div className="h-1 w-48 bg-slate-100 rounded-full">
            <div className="h-full bg-brand-gold rounded-full" style={{ width: `${(18 / filteredContests.length) * 100}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
