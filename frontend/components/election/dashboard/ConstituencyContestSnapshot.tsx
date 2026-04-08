import React from 'react';
import { User, Flag, TrendingUp, Users } from 'lucide-react';

interface ConstituencyContestSnapshotProps {
  currentMLA?: {
    name: string;
    partyShort?: string;
  } | null;
  lastWinner?: {
    winner?: string | null;
    partyShort?: string | null;
    margin?: number | null;
  } | null;
  candidateCount: number;
  isOpenSeat: boolean;
  isIncumbentRecontest: boolean;
  overlayStatus: 'live' | 'upcoming';
}

export default function ConstituencyContestSnapshot({
  currentMLA,
  lastWinner,
  candidateCount,
  isOpenSeat,
  isIncumbentRecontest,
  overlayStatus
}: ConstituencyContestSnapshotProps) {
  const isLive = overlayStatus === 'live';

  const stats = [
    {
      label: "Current MLA",
      value: currentMLA?.name || "N/A",
      subValue: currentMLA?.partyShort || "",
      icon: User,
      color: "text-brand-dark"
    },
    {
      label: "2021 Winner",
      value: lastWinner?.winner || "N/A",
      subValue: lastWinner?.margin ? `+${lastWinner.margin.toLocaleString()} Margin` : "",
      icon: TrendingUp,
      color: "text-brand-green"
    },
    {
      label: "2026 Candidates",
      value: isLive ? candidateCount.toString() : "Awaited",
      subValue: isLive ? "Announced" : "Coming Soon",
      icon: Users,
      color: "text-brand-gold"
    },
    {
      label: "Seat Status",
      value: !isLive ? "Upcoming" : (isOpenSeat ? "Open Seat" : "Incumbent Resisting"),
      subValue: isIncumbentRecontest ? "MLA Re-contesting" : (!isLive ? "Awaiting Entry" : "New Face Likely"),
      icon: Flag,
      color: "text-slate-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-full -mr-8 -mt-8 group-hover:bg-brand-gold/5 transition-colors"></div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-40`} />
            </div>
            
            <div className="space-y-1">
              <p className="text-xl font-black text-brand-dark uppercase tracking-tight italic leading-none truncate">
                {stat.value}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {stat.subValue}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
