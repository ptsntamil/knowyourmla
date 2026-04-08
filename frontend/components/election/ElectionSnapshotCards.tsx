import React from 'react';
import { Target, Users, Shield, TrendingUp, PieChart, Layers, UserCheck } from 'lucide-react';
import { ElectionSummary } from '@/lib/services/election-analytics.service';
import PartyBadge from '@/components/ui/PartyBadge';

interface ElectionSnapshotCardsProps {
  summary: ElectionSummary;
}

export default function ElectionSnapshotCards({ summary }: ElectionSnapshotCardsProps) {
  const {
    totalSeats,
    majorityMark,
    winningParty,
    winningAlliance,
    turnoutPercentage,
    totalPartiesContested
  } = summary;

  const cards = [
    {
      label: 'Total Seats',
      value: totalSeats,
      helper: 'Assembly Constituencies',
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Majority Mark',
      value: majorityMark,
      helper: 'Seats needed to win',
      icon: UserCheck,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Winning Party',
      value: winningParty,
      helper: 'Leader in current year',
      icon: Shield,
      color: 'text-brand-gold',
      bg: 'bg-brand-gold/10'
    },
    ...(winningAlliance ? [{
      label: 'Winning Alliance',
      value: winningAlliance,
      helper: 'Coalition lead',
      icon: Layers,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }] : []),
    ...(turnoutPercentage ? [{
      label: 'Voter Turnout',
      value: `${turnoutPercentage}%`,
      helper: 'Total votes polled',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }] : []),
    ...(totalPartiesContested ? [{
      label: 'Parties Contested',
      value: totalPartiesContested,
      helper: 'Political diversity',
      icon: PieChart,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    }] : []),
    ...(summary.totalCandidates ? [{
      label: 'Total Candidates',
      value: summary.totalCandidates.toLocaleString(),
      helper: 'Total contestants',
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }] : [])
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow"
        >
          <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
            <card.icon size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
            {card.label === 'Winning Party' && summary.winningParty && summary.winningParty !== 'N/A' ? (
              <div className="mt-2 mb-1">
                <PartyBadge
                  party={summary.winningPartyShort || summary.winningParty}
                  logoUrl={summary.winningPartyLogoUrl}
                  colorBg={summary.winningPartyColorBg}
                  colorText={summary.winningPartyColorText}
                  colorBorder={summary.winningPartyColorBorder}
                />
              </div>
            ) : (
              <h4 className="text-xl font-black text-brand-dark tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{card.value}</h4>
            )}
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2">{card.helper}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
