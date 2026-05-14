import React from 'react';
import { PreElectionSnapshotStats } from '@/types/pre-election';
import { Users, User, UserCheck, Shield } from 'lucide-react';

interface VotersCountSectionProps {
  stats: PreElectionSnapshotStats;
}

export default function VotersCountSection({ stats }: VotersCountSectionProps) {
  if (!stats.totalVoters) return null;

  const malePercent = stats.maleVoters && stats.totalVoters ? Math.round((stats.maleVoters / stats.totalVoters) * 100) : 0;
  const femalePercent = stats.femaleVoters && stats.totalVoters ? Math.round((stats.femaleVoters / stats.totalVoters) * 100) : 0;
  const thirdGenderPercent = stats.thirdGenderVoters && stats.totalVoters ? (stats.thirdGenderVoters / stats.totalVoters) * 100 : 0;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <section className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                <Users size={20} />
             </div>
             <h2 className="text-3xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter italic">Total Electorate</h2>
          </div>
          <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
            The official voter strength for the 2026 Assembly Election across all 234 constituencies. 
            Demographic distribution highlights the scale of democratic participation in Tamil Nadu.
          </p>
        </div>
        
        <div className="bg-brand-dark text-white px-8 py-6 rounded-[2rem] shadow-xl shadow-brand-dark/20 border border-white/10 group hover:scale-105 transition-transform duration-500">
           <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total Voters</span>
              <div className="text-4xl md:text-5xl font-black italic tracking-tighter text-brand-gold">
                {formatNumber(stats.totalVoters)}
              </div>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Male Voters */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:shadow-lg transition-all duration-500">
           <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                 <User size={24} />
              </div>
              <span className="text-2xl font-black italic text-slate-200 group-hover:text-blue-100 transition-colors">{malePercent}%</span>
           </div>
           <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Male Voters</h3>
              <p className="text-3xl font-black text-slate-800 tracking-tighter italic">{formatNumber(stats.maleVoters || 0)}</p>
           </div>
           <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                style={{ width: `${malePercent}%` }}
              ></div>
           </div>
        </div>

        {/* Female Voters */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:shadow-lg transition-all duration-500">
           <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500">
                 <UserCheck size={24} />
              </div>
              <span className="text-2xl font-black italic text-slate-200 group-hover:text-rose-100 transition-colors">{femalePercent}%</span>
           </div>
           <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Female Voters</h3>
              <p className="text-3xl font-black text-slate-800 tracking-tighter italic">{formatNumber(stats.femaleVoters || 0)}</p>
           </div>
           <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-1000" 
                style={{ width: `${femalePercent}%` }}
              ></div>
           </div>
        </div>

        {/* Third Gender */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:shadow-lg transition-all duration-500">
           <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500">
                 <Shield size={24} />
              </div>
              <span className="text-2xl font-black italic text-slate-200 group-hover:text-purple-100 transition-colors">
                {thirdGenderPercent.toFixed(2)}%
              </span>
           </div>
           <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Third Gender</h3>
              <p className="text-3xl font-black text-slate-800 tracking-tighter italic">{formatNumber(stats.thirdGenderVoters || 0)}</p>
           </div>
           <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(thirdGenderPercent * 50, 100)}%` }}
              ></div>
           </div>
        </div>
      </div>
    </section>
  );
}
