import React from 'react';
import { History, TrendingUp, Users } from 'lucide-react';

interface ConstituencyHistoricalComparisonProps {
  lastElection?: {
    year: number;
    winner?: string | null;
    partyShort?: string | null;
    margin?: number | null;
  } | null;
  currentOverlay: {
    candidateCount: number;
    isIncumbentRecontest: boolean;
    isOpenSeat: boolean;
    majorParties: string[];
  };
  overlayStatus: 'live' | 'upcoming';
}

export default function ConstituencyHistoricalComparison({
  lastElection,
  currentOverlay,
  overlayStatus
}: ConstituencyHistoricalComparisonProps) {
  const isLive = overlayStatus === 'live';

  return (
    <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
      <div className="px-10 py-8 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <History className="text-brand-gold" size={20} />
          <h3 className="font-black uppercase tracking-widest text-sm italic">Historical vs 2026 Contest</h3>
        </div>
        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Single Seat Intelligence</span>
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-50">
        {/* Previous Election Column */}
        <div className="p-10 space-y-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Previous Election</p>
            <h4 className="text-xl font-black text-brand-dark uppercase tracking-tight italic">2021 Assembly</h4>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="text-slate-400" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Winning Candidate</p>
                <p className="text-sm font-black text-brand-dark uppercase tracking-tight italic leading-tight">
                  {lastElection?.winner || "No winner found"} 
                  <span className="ml-2 text-slate-400 text-xs">({lastElection?.partyShort || "IND"})</span>
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Victory Margin</span>
               <span className="text-sm font-black text-brand-green">
                 {lastElection?.margin ? `+${lastElection.margin.toLocaleString()}` : "N/A"}
               </span>
            </div>
          </div>
        </div>

        {/* 2026 Overlay Column */}
        <div className="p-10 space-y-8 bg-slate-50/20">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest leading-none">Current Overlay</p>
            <h4 className="text-xl font-black text-brand-dark uppercase tracking-tight italic">2026 Pre-Election</h4>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                <Users size={18} className="text-brand-gold" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Candidate Count</p>
                <p className="text-sm font-black text-brand-dark uppercase tracking-tight italic leading-tight">
                   {isLive ? `${currentOverlay.candidateCount} Candidates Announced` : "Awaiting Announcements"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incumbent Contesting</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${currentOverlay.isIncumbentRecontest ? 'bg-brand-green/10 text-brand-green' : 'bg-slate-100 text-slate-400'}`}>
                  {currentOverlay.isIncumbentRecontest ? 'YES' : (isLive ? 'NO' : 'AWAITED')}
                </span>
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Seat Status</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${currentOverlay.isOpenSeat ? 'bg-brand-gold/10 text-brand-gold' : 'bg-slate-100 text-slate-400'}`}>
                  {currentOverlay.isOpenSeat ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
