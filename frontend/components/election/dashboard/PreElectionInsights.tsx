"use client";

import React from 'react';
import { DashboardInsights, ElectionInsightCandidate, ContestCard } from '@/lib/elections/preElectionDashboard/dashboard.types';
import PartyBadge from '@/components/ui/PartyBadge';
import Link from 'next/link';
import { Trophy, TrendingUp, AlertTriangle, Scale, Target, Users, MapPin } from 'lucide-react';

interface PreElectionInsightsProps {
  insights: DashboardInsights;
}

export default function PreElectionInsightsSection({ insights }: PreElectionInsightsProps) {

  const CardWrapper = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 flex flex-col h-full">
      <div className="bg-slate-50/80 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-black text-brand-dark uppercase tracking-[0.1em] text-xs italic">{title}</h3>
        <div className="w-8 h-8 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
          <Icon size={16} />
        </div>
      </div>
      <div className="divide-y divide-slate-50 flex-grow">
        {children}
      </div>
    </div>
  );

  const renderCandidateItem = (c: ElectionInsightCandidate, idx: number) => (
    <div key={`${c.name}-${idx}`} className="group p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all">
      <div className="flex items-center gap-4">
        <Link 
          href={`/tn/mla/${c.personId}`}
          className="w-10 h-10 rounded-2xl border border-brand-gold bg-slate-50 overflow-hidden flex items-center justify-center text-[10px] font-black text-brand-gold hover:opacity-80 transition-all italic relative shrink-0"
        >
          {c.profilePic ? (
            <img src={c.profilePic} alt={c.name} className="w-full h-full object-cover" />
          ) : (
            <span>#{idx + 1}</span>
          )}
        </Link>
        <div>
          <Link 
            href={`/tn/mla/${c.personId}`}
            className="font-black text-brand-dark text-sm uppercase italic tracking-tight leading-none mb-1.5 hover:text-brand-gold transition-colors block"
          >
            {c.name}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.constituencyName}</span>
            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">{c.party}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-black text-slate-800 italic">{c.formattedValue}</span>
      </div>
    </div>
  );

  const renderContestItem = (c: ContestCard, idx: number, value: string | number, label: string) => (
    <div key={`${c.constituencyId}-${idx}`} className="group p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-brand-gold flex items-center justify-center text-[10px] font-black text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-dark group-hover:border-brand-gold transition-all italic">
          #{idx + 1}
        </div>
        <div>
          <Link
            href={`/tn/constituency/${c.constituencyId}`}
            className="font-black text-brand-dark text-sm uppercase italic tracking-tight leading-none mb-1.5 hover:text-brand-gold transition-colors block"
          >
            {c.constituencyName}
          </Link>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{c.districtName}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-black text-slate-800 italic">{value}</span>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mt-1">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
            <h2 className="text-2xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter italic leading-none">
              Affidavit & Pattern Insights
            </h2>
          </div>
          <p className="text-slate-500 font-medium text-sm max-w-xl">
            Deep dive into candidate backgrounds and constituency contest patterns discovered through cross-year analysis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">

        <CardWrapper title="Richest Candidates" icon={IndianRupeeIcon}>
          {insights.richestCandidates.slice(0, 5).map((c: ElectionInsightCandidate, idx: number) => renderCandidateItem(c, idx))}
        </CardWrapper>

        <CardWrapper title="Youngest Candidates" icon={TrendingUp}>
          {insights.youngestCandidates.slice(0, 5).map((c: ElectionInsightCandidate, idx: number) => renderCandidateItem(c, idx))}
        </CardWrapper>

        {insights.mostCriminalCases.length > 0 && (
          <CardWrapper title="Highest Criminal Record" icon={GavelIcon}>
            {insights.mostCriminalCases.slice(0, 5).map((c: ElectionInsightCandidate, idx: number) => renderCandidateItem(c, idx))}
          </CardWrapper>
        )}

        <CardWrapper title="Closest 2021 Contests" icon={Target}>
          {insights.closestLastElectionSeats.slice(0, 5).map((c: ContestCard, idx: number) =>
            renderContestItem(c, idx, c.lastMargin?.toLocaleString() || '--', '21 Margin')
          )}
        </CardWrapper>

        <CardWrapper title="Most Crowded Contests" icon={Users}>
          {insights.multiCornerContests.slice(0, 5).map((c: ContestCard, idx: number) =>
            renderContestItem(c, idx, c.candidateCount, 'Candidates')
          )}
        </CardWrapper>

        <CardWrapper title="Election Shape Stats" icon={Scale}>
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl">
              <div>
                <p className="text-2xl font-black italic text-brand-dark">{insights.openSeatsCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Seats</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-gold shadow-sm">
                <span className="text-xl font-black italic">!</span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl">
              <div>
                <p className="text-2xl font-black italic text-brand-dark">{insights.incumbentRecontestCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sitting MLAs Fielding</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-gold shadow-sm">
                <Users size={20} />
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl">
              <div>
                <p className="text-2xl font-black italic text-brand-dark">{insights.averageCandidateAge || '--'}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Age</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-gold shadow-sm">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        </CardWrapper>

        {insights.contestTypePatterns && (
          <CardWrapper title="Contesting Patterns" icon={MapPin}>
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-black italic text-brand-dark">{insights.contestTypePatterns.crossPercent}%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cross-Constituency</p>
                </div>
                <div className="w-16 h-16 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                    <circle
                      cx="32" cy="32" r="28" fill="transparent" stroke="#eab308" strokeWidth="8"
                      strokeDasharray={175.9}
                      strokeDashoffset={175.9 * (1 - insights.contestTypePatterns.crossPercent / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-black italic text-brand-dark">AI</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Cross-Contest Parties</h4>
                <div className="space-y-3">
                  {insights.contestTypePatterns.topCrossParties.map((p: any) => (
                    <div key={p.partyName} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        {p.partyLogoUrl ? (
                          <img src={p.partyLogoUrl} alt={p.partyName} className="w-6 h-6 rounded-lg object-contain bg-white p-0.5" />
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[8px] font-black text-slate-400">{p.partyName.substring(0, 2)}</div>
                        )}
                        <span className="text-[10px] font-bold text-slate-700">{p.partyName}</span>
                      </div>
                      <span className="text-[10px] font-black text-brand-gold italic">{p.count} Candidates</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardWrapper>
        )}
      </div>
    </div>
  );
}

function IndianRupeeIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}

function GavelIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m14 13-5 5" /><path d="m3 21 2-2" /><path d="m9 15 5-5" /><path d="m15 9 2-2" /><path d="M3 9 9 3" /><path d="m21 15-6-6" /><path d="m15 21-6-6" /><path d="m9 3 12 12" />
    </svg>
  );
}
