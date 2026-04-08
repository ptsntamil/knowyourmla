"use client";

import React from 'react';
import { Target, TrendingUp, Users, Wallet, Baby, Award, CheckCircle2, Swords } from 'lucide-react';
import { ElectionInsights } from '@/lib/services/election-analytics.service';

interface QuickInsightSnapshotsProps {
  insights: ElectionInsights;
}

export default function QuickInsightSnapshots({ insights }: QuickInsightSnapshotsProps) {
  const {
    closestContests,
    biggestVictories,
    highestTurnout,
    lowestTurnout,
    womenRepresentation,
    richestContestants,
    youngestContestants
  } = insights;

  const cards = [
    {
      label: 'Closest Margin',
      value: `+${closestContests?.[0]?.margin?.toLocaleString()}`,
      helper: closestContests?.[0]?.constituencyName,
      icon: Target,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    {
      label: 'Biggest Victory',
      value: `+${biggestVictories?.[0]?.margin?.toLocaleString()}`,
      helper: biggestVictories?.[0]?.constituencyName,
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Highest Turnout',
      value: `${highestTurnout?.[0]?.turnoutPercent?.toFixed(1)}%`,
      helper: highestTurnout?.[0]?.constituencyName,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Lowest Turnout',
      value: `${lowestTurnout?.[0]?.turnoutPercent?.toFixed(1)}%`,
      helper: lowestTurnout?.[0]?.constituencyName,
      icon: TrendingUp,
      color: 'text-slate-500',
      bg: 'bg-slate-100'
    },
    {
      label: 'Women Winners',
      value: womenRepresentation.totalWinners,
      helper: `Win Rate: ${womenRepresentation.winRate.toFixed(1)}%`,
      icon: CheckCircle2,
      color: 'text-brand-gold',
      bg: 'bg-brand-gold/10'
    },
    {
      label: 'Women Contestants',
      value: womenRepresentation.totalCandidates,
      helper: 'Female Candidates',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Richest Contestant',
      value: richestContestants?.[0]?.formattedValue,
      helper: richestContestants?.[0]?.name,
      icon: Wallet,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100'
    },
    {
      label: 'Youngest Contestant',
      value: youngestContestants?.[0]?.formattedValue,
      helper: youngestContestants?.[0]?.name,
      icon: Baby,
      color: 'text-sky-600',
      bg: 'bg-sky-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
            <card.icon size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
            <h4 className="text-xl md:text-2xl font-black text-brand-dark tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis italic">
              {card.value}
            </h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2 truncate">
              {card.helper}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
