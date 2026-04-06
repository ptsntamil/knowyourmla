import React from 'react';
import { Target, Users, Shield, Star, TrendingUp, Calendar } from 'lucide-react';
import { DistrictInsights } from '@/types/models';

interface StateSnapshotProps {
  totalConstituencies: number;
  totalMLAs: number;
  insights: DistrictInsights;
}

export default function StateSnapshot({
  totalConstituencies,
  totalMLAs,
  insights
}: StateSnapshotProps) {
  const {
    averageAge,
    dominantParty,
    genderSplit,
    fresherVsRepeat
  } = insights;

  const womenPercentage = ((genderSplit.female / totalMLAs) * 100).toFixed(1);
  const newcomerPercentage = ((fresherVsRepeat.fresher / totalMLAs) * 100).toFixed(1);

  const cards = [
    {
      label: 'Constituencies',
      value: totalConstituencies,
      helper: 'Total Assembly Seats',
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Total MLAs',
      value: totalMLAs,
      helper: 'Current Representatives',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Party Spread',
      value: dominantParty?.party || 'Multiple',
      helper: dominantParty ? `${dominantParty.seats} seats held by largest party` : 'Multi-party representation',
      icon: Shield,
      color: 'text-brand-gold',
      bg: 'bg-brand-gold/10'
    },
    {
      label: 'Women MLAs',
      value: `${womenPercentage}%`,
      helper: `${genderSplit.female} Women Representatives`,
      icon: Star,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    {
      label: 'Average Age',
      value: `${averageAge} yrs`,
      helper: 'Of current assembly',
      icon: Calendar,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Newcomer Mix',
      value: `${newcomerPercentage}%`,
      helper: `${fresherVsRepeat.fresher} First-time MLAs`,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50'
    }
  ];

  return (
    <section className="space-y-8">
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
              <h4 className="text-xl font-black text-brand-dark tracking-tight leading-tight">{card.value}</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2">{card.helper}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
