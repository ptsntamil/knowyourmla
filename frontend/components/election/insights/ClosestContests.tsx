"use client";

import React from 'react';
import Link from 'next/link';
import { Target, ChevronRight, Award } from 'lucide-react';
import { ConstituencyResult } from '@/lib/services/election-analytics.service';
import Badge from '@/components/ui/Badge';

interface ClosestContestsProps {
  data: ConstituencyResult[];
  year: number;
  limit?: number;
}

export default function ClosestContests({ data, year, limit = 5 }: ClosestContestsProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center">
            <Target className="text-rose-500" size={20} />
          </div>
          <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Closest Contests</h3>
        </div>
        <Badge variant="outline" size="sm" dot className="bg-rose-50/50 border-rose-100 text-rose-600">Competitive</Badge>
      </div>

      <div className="space-y-6">
        {data.slice(0, limit).map((result, index) => (
          <div key={index} className="group p-5 bg-slate-50/50 hover:bg-white rounded-3xl border border-transparent hover:border-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/40 relative">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm z-10 group-hover:scale-110 transition-transform">
              {index + 1}
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <Link 
                  href={`/tn/constituency/${result.constituencyId?.toLowerCase()}`}
                  className="text-lg font-black text-brand-dark uppercase tracking-tight hover:text-brand-gold transition-colors block"
                >
                  {result.constituencyName}
                </Link>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {result.districtName}
                  </p>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Award size={12} className="text-brand-gold flex-shrink-0" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex-shrink-0">Winner:</span>
                    {result.winnerPersonId ? (
                      <Link 
                        href={`/tn/mla/${result.winnerPersonId}`}
                        className="text-[11px] font-bold text-slate-600 hover:text-brand-gold truncate max-w-[150px] leading-none transition-colors"
                      >
                        {result.winnerName}
                      </Link>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px] leading-none">{result.winnerName}</span>
                    )}
                    <span className="text-[11px] font-bold text-slate-400 leading-none">({result.winnerPartyShort})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="text-right flex-shrink-0">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Margin</p>
                  <p className="text-xl font-black text-rose-500 tabular-nums">+{result.margin}</p>
                </div>
                <Link
                  href={`/tn/constituency/${result.constituencyId?.toLowerCase()}/election/${year}`}
                  className="w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-dark group-hover:text-white transition-all shadow-sm"
                >
                  <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
