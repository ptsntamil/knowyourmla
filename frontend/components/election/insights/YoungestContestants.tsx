"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Baby, ChevronRight, Trophy, Filter } from 'lucide-react';
import { CandidateInsight } from '@/lib/services/election-analytics.service';
import Badge from '@/components/ui/Badge';
import Image from 'next/image';

interface YoungestContestantsProps {
  data: CandidateInsight[];
  year: number;
  limit?: number;
  showFilter?: boolean;
}

export default function YoungestContestants({ data, year, limit = 5, showFilter = true }: YoungestContestantsProps) {
  const [selectedParty, setSelectedParty] = useState<string>('all');

  // Derive unique parties from the data
  const availableParties = useMemo(() => {
    const parties = new Map<string, string>();
    data.forEach(c => {
      if (c.partyShort) parties.set(c.partyShort, c.partyShort);
    });
    return Array.from(parties.values()).sort();
  }, [data]);

  // Filter and slice data based on selection
  const filteredData = useMemo(() => {
    const list = selectedParty === 'all' 
      ? data 
      : data.filter(c => c.partyShort === selectedParty);
    return list.slice(0, limit);
  }, [data, selectedParty, limit]);

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white p-6 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Baby className="text-amber-500" size={20} />
            </div>
            <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Youngest Contestants</h3>
          </div>

          {/* Local Party Filter */}
          {showFilter && (
            <div className="relative flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-2xl group focus-within:ring-2 focus-within:ring-brand-gold/20 focus-within:bg-white transition-all w-fit sm:min-w-[140px]">
              <Filter size={14} className="text-slate-400 group-focus-within:text-brand-gold" />
              <select 
                className="bg-transparent text-[11px] font-black text-slate-500 uppercase tracking-wider outline-none cursor-pointer pr-4 appearance-none"
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
              >
                <option value="all">All Parties</option>
                {availableParties.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="absolute right-3 pointer-events-none text-slate-400">
                <ChevronRight size={12} className="rotate-90" />
              </div>
            </div>
          )}
        </div>

      <div className="space-y-6">
        {filteredData.length > 0 ? (
          filteredData.map((candidate, index) => (
            <div key={index} className="group p-5 bg-slate-50/50 hover:bg-white rounded-3xl border border-transparent hover:border-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/40 relative">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm z-10 group-hover:scale-110 transition-transform">
                {index + 1}
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-brand-dark uppercase tracking-tight leading-none truncate max-w-[200px]">
                        {candidate.name}
                      </p>
                      {candidate.isWinner && (
                        <Badge variant="gold" size="xs" className="px-2 py-0.5 rounded-lg border-none shadow-sm flex items-center gap-1">
                          <Trophy size={10} /> Won
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      {candidate.constituencyName} • {candidate.districtName}
                    </p>
                  </div>

                  <Link 
                    href={`/parties/${candidate.partyId}`}
                    className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-2 w-fit shadow-xs border transition-all hover:scale-105"
                    style={{
                      backgroundColor: candidate.partyColorBg || '#f8fafc',
                      color: candidate.partyColorText || '#1e293b',
                      borderColor: candidate.partyColorBorder || '#e2e8f0'
                    }}
                  >
                     {candidate.partyLogoUrl && (
                      <div className="relative w-4 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10 shadow-inner">
                        <Image
                          src={candidate.partyLogoUrl}
                          alt={candidate.partyShort}
                          width={12}
                          height={12}
                          className="object-contain"
                        />
                      </div>
                    )}
                    {candidate.partyShort}
                  </Link>
                </div>

                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Age</p>
                    <p className="text-xl font-black text-amber-600 tabular-nums">{candidate.value} Yrs</p>
                  </div>
                  <Link
                    href={`/tn/constituency/${candidate.constituencyId.toLowerCase()}/election/${year}`}
                    className="w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-dark group-hover:text-white transition-all shadow-sm"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No candidates found for this party</p>
          </div>
        )}
      </div>
    </div>
  );
}
