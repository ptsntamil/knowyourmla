'use client';
import React, { useState } from 'react';
import {
  Info,
  Zap,
  Target,
  TrendingUp,
  ShieldAlert,
  ChevronDown,
  Activity
} from 'lucide-react';

interface PollingStationInsightsProps {
  insights: string[];
}

const PollingStationInsights: React.FC<PollingStationInsightsProps> = ({ insights }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!insights || insights.length === 0) return null;

  const getIcon = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('stronghold')) return <Target className="w-5 h-5 text-emerald-400" />;
    if (t.includes('turnout')) return <TrendingUp className="w-5 h-5 text-blue-400" />;
    if (t.includes('nota')) return <ShieldAlert className="w-5 h-5 text-rose-400" />;
    if (t.includes('closest')) return <Zap className="w-5 h-5 text-amber-400" />;
    return <Activity className="w-5 h-5 text-slate-400" />;
  };

  return (
    <section className="bg-gradient-to-br from-[#071120] to-[#10263A] rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden group shadow-2xl border border-white/5">
      {/* Premium gold background icon */}
      <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none">
        <Activity size={200} className="text-[#F4B63D]" />
      </div>

      {/* Subtle gold radial glow */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[#F4B63D]/5 rounded-full blur-[80px] -ml-32 -mt-32" />

      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-[#F4B63D] p-3 rounded-2xl shadow-xl shadow-[#F4B63D]/20">
              <Zap className="w-5 h-5 text-[#071120]" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase italic">Booth Intelligence</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#F4B63D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F4B63D]"></span>
                </span>
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">AI Trend Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden p-2.5 bg-white/5 rounded-xl border border-white/10"
          >
            <ChevronDown className={`w-5 h-5 text-[#F4B63D] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <ul className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 ${!isExpanded ? 'max-h-[300px] md:max-h-none overflow-hidden' : 'max-h-[2000px]'}`}>
          {insights.map((insight, index) => (
            <li
              key={index}
              className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-xl flex items-start gap-4 group/item hover:bg-white/10 hover:border-[#F4B63D]/30 transition-all duration-300 shadow-xl"
            >
              <div className="p-2.5 bg-[#071120] rounded-xl border border-white/10 group-hover/item:border-[#F4B63D]/50 transition-colors shadow-lg">
                {getIcon(insight)}
              </div>
              <p className="text-white/80 leading-relaxed font-bold text-xs md:text-base">{insight}</p>
            </li>
          ))}
        </ul>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-white/5">
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
            <Info className="w-3.5 h-3.5 text-[#F4B63D]" />
            * Granular trend synthesis
          </p>
          <div className="flex items-center gap-2">
            {['TURN-OUT', 'MARGIN', 'STRONGHOLD'].map(tag => (
              <span key={tag} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-white/40 uppercase tracking-widest hover:text-[#F4B63D] hover:border-[#F4B63D]/30 transition-all cursor-default">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PollingStationInsights;
