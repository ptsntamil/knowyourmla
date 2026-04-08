"use client";

import React from 'react';
import { Users, Award, CheckCircle2, TrendingUp } from 'lucide-react';
import { WomenRepresentation } from '@/lib/services/election-analytics.service';
import Badge from '@/components/ui/Badge';

interface WomenRepresentationSummaryProps {
  data: WomenRepresentation;
  year: number;
}

export default function WomenRepresentationSummary({ data, year }: WomenRepresentationSummaryProps) {
  const { totalCandidates, totalWinners, winRate } = data;

  return (
    <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center">
            <Users className="text-rose-500" size={20} />
          </div>
          <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Women Representation</h3>
        </div>
        <Badge variant="outline" size="sm" dot className="bg-rose-50/50 border-rose-100 text-rose-600">Gender Insights</Badge>
      </div>

      {/* Main Metric */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Contestants</span>
            <div className="flex items-baseline gap-3">
              <h4 className="text-6xl font-black text-brand-dark tabular-nums tracking-tighter">{totalCandidates}</h4>
              <span className="text-sm font-bold text-slate-400">Women</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Total number of female candidates who contested in the {year} Assembly Election across all constituencies.
          </p>
        </div>

        <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
           <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Winners</p>
              <p className="text-3xl font-black text-rose-500 tabular-nums">{totalWinners}</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
              <CheckCircle2 className="text-rose-500" size={18} />
            </div>
          </div>

          <div className="h-px bg-slate-200/60" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Win Rate</p>
              <p className="text-3xl font-black text-emerald-500 tabular-nums">{winRate.toFixed(1)}%</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
              <TrendingUp className="text-emerald-500" size={18} />
            </div>
          </div>

          <div className="h-px bg-slate-200/60" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Contestant %</p>
              <p className="text-3xl font-black text-indigo-500 tabular-nums">{data.contestantPercentage.toFixed(1)}%</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
              <Users className="text-indigo-500" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Note */}
      <div className="pt-4 border-t border-slate-100">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Representation analysis: Women accounted for {((totalCandidates / 234) * 100).toFixed(1)}% of the typical assembly size (234 seats) in terms of total contestants.
        </p>
      </div>
    </div>
  );
}
