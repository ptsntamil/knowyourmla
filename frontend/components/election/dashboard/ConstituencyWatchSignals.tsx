import React from 'react';
import { Target, Zap, Waves, Repeat, History } from 'lucide-react';

interface ConstituencyWatchSignalsProps {
  tags: string[];
}

export default function ConstituencyWatchSignals({ tags }: ConstituencyWatchSignalsProps) {
  if (tags.length === 0) return null;

  const signalIcons: Record<string, any> = {
    "Open Seat": Zap,
    "Incumbent Recontest": Target,
    "Multi-Corner Contest": Waves,
    "Close Margin '21": History,
    "Repeat Contest": Repeat,
    "Upcoming": Zap,
    "Awaiting Candidates": History
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 bg-brand-gold rounded-full" />
        <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest">Watch Signals</h3>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {tags.map(tag => {
          const Icon = signalIcons[tag] || Zap;
          return (
            <div key={tag} className="flex items-center gap-3 bg-white border border-slate-100 px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all group">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                <Icon size={18} className="text-slate-400 group-hover:text-brand-gold transition-colors" />
              </div>
              <span className="text-xs font-black text-brand-dark uppercase tracking-widest">
                {tag}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
