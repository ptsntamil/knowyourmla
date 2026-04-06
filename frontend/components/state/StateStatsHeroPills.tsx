import React from 'react';
import { Target, Users, Map, PieChart } from 'lucide-react';

interface StateStatsHeroPillsProps {
  totalConstituencies: number;
  totalMLAs: number;
  totalDistricts: number;
  partySpread: number;
}

export default function StateStatsHeroPills({
  totalConstituencies,
  totalMLAs,
  totalDistricts,
  partySpread
}: StateStatsHeroPillsProps) {
  const stats = [
    { label: 'Constituencies', value: totalConstituencies, icon: Target },
    { label: 'Total MLAs', value: totalMLAs, icon: Users },
    { label: 'Districts', value: totalDistricts, icon: Map },
    { label: 'Parties', value: `${partySpread}+`, icon: PieChart },
  ];

  return (
    <div className="flex flex-wrap gap-3 mt-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-lg transition-all hover:bg-white/20"
        >
          <stat.icon className="w-3 h-3 text-brand-gold" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
            <span className="text-brand-gold mr-1">{stat.value}</span> {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
