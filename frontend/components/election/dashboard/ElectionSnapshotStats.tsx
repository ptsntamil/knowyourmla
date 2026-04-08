import React from 'react';
import { PreElectionSnapshotStats } from '@/types/pre-election';
import { Users, Landmark, MapPin, UserCheck, Unlock, UserCircle2, Calendar, IndianRupee } from 'lucide-react';

interface ElectionSnapshotStatsProps {
  stats: PreElectionSnapshotStats;
}

export default function ElectionSnapshotStats({ stats }: ElectionSnapshotStatsProps) {
  const StatCard = ({ 
    label, 
    value, 
    subtext, 
    icon: Icon,
    highlight = false 
  }: { 
    label: string, 
    value: string | number | null, 
    subtext?: string, 
    icon: any,
    highlight?: boolean 
  }) => (
    <div className={`group relative p-8 rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl hover:shadow-brand-gold/10 hover:-translate-y-1 ${
      highlight 
        ? 'bg-brand-dark border-brand-dark shadow-xl text-white' 
        : 'bg-white border-slate-100 shadow-sm text-slate-800'
    }`}>
      {highlight && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/10 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150"></div>
      )}
      
      <div className="relative z-10 space-y-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
          highlight ? 'bg-brand-gold text-brand-dark' : 'bg-brand-gold/10 text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-dark'
        }`}>
          <Icon size={24} />
        </div>
        
        <div className="space-y-1">
          <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${
            highlight ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {label}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black tracking-tighter italic">
              {value !== null && value !== undefined ? value : '--'}
            </span>
            {subtext && (
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                highlight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {subtext}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-px bg-slate-200 flex-grow"></div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">At a Glance Dashboard</h2>
        <div className="h-px bg-slate-200 flex-grow"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          label="Total Constituencies" 
          value={stats.totalConstituencies} 
          icon={MapPin}
        />
        <StatCard 
          label="Candidates Announced" 
          value={stats.totalCandidatesAnnounced} 
          icon={Users}
          highlight={true}
        />
        <StatCard 
          label="Parties in Contest" 
          value={stats.partiesWithCandidates} 
          icon={Landmark}
        />
        <StatCard 
          label="Seats Covered" 
          value={stats.seatsWithAnnouncedCandidates} 
          subtext={`of ${stats.totalConstituencies}`}
          icon={UserCheck}
        />
        <StatCard 
          label="Incumbents Recontesting" 
          value={stats.incumbentsRecontestingPercent !== null ? `${stats.incumbentsRecontestingPercent}%` : '--'} 
          subtext="Retained faces"
          icon={UserCircle2}
        />
        <StatCard 
          label="Open Seats" 
          value={stats.openSeatsPercent !== null ? `${stats.openSeatsPercent}%` : '--'} 
          subtext="New MLA Guaranteed"
          icon={Unlock}
        />
        <StatCard 
          label="Own Constituency" 
          value={stats.ownConstituencyPercent !== null ? `${stats.ownConstituencyPercent}%` : '--'} 
          subtext="Locals"
          icon={MapPin}
        />
        <StatCard 
          label="Cross-Constituency" 
          value={stats.crossConstituencyPercent !== null ? `${stats.crossConstituencyPercent}%` : '--'} 
          subtext="Outsiders"
          icon={Users}
        />
        <StatCard 
          label="Average Age" 
          value={stats.averageCandidateAge} 
          subtext="Years old"
          icon={Calendar}
        />
        <StatCard 
          label="Average Assets" 
          value={stats.averageAssets ? `₹${(stats.averageAssets / 10000000).toFixed(1)}Cr` : '--'} 
          subtext="Per candidate"
          icon={IndianRupee}
        />
      </div>
    </div>
  );
}
