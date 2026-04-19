import React from 'react';
import { PartyRolloutSummary } from '@/lib/elections/preElectionDashboard/dashboard.types';
import PartyBadge from '@/components/ui/PartyBadge';
import { IndianRupee, Users, TrendingUp, Gavel } from 'lucide-react';

interface PartyRolloutSnapshotProps {
  partyRollout: PartyRolloutSummary[];
}

export default function PartyRolloutSnapshot({ partyRollout }: PartyRolloutSnapshotProps) {
  if (!partyRollout || partyRollout.length === 0) return null;

  const maxAvgAssets = Math.max(...partyRollout.map(p => p.averageAssets || 0), 1);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
            <h2 className="text-2xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter italic leading-none">
              Party Rollout
            </h2>
          </div>
          <p className="text-slate-500 font-medium text-sm max-w-xl">
            Real-time tracking of candidate announcements across major political parties.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parties Fielding Candidates:</span>
             <span className="ml-2 font-black text-brand-dark">{partyRollout.length}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {partyRollout.map((party) => (
          <div key={party.partyId} className="group relative flex flex-col bg-white border border-slate-100 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-brand-gold/10 hover:-translate-y-1 overflow-hidden">
            {/* Background accent line using party color if available */}
            {party.colorBg && (
              <div 
                className="absolute top-0 left-0 w-full h-1.5" 
                style={{ backgroundColor: party.colorBg }}
              />
            )}

            <div className="relative z-10 flex flex-col h-full space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <PartyBadge 
                    party={party.partyName} 
                    shortName={party.shortName}
                    logoUrl={party.logoUrl}
                    colorBg={party.colorBg}
                    colorText={party.colorText}
                    colorBorder={party.colorBorder}
                  />
                  <div>
                    <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight italic leading-tight">{party.partyName}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{party.shortName}</p>
                  </div>
                </div>
                
                <div className="bg-brand-dark text-white p-4 rounded-3xl flex flex-col items-center justify-center min-w-[80px] group-hover:bg-brand-gold group-hover:text-brand-dark transition-colors duration-500">
                  <span className="text-3xl font-black italic leading-none">{party.candidatesAnnounced}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Seats</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <TrendingUp size={12} />
                    <p className="text-[9px] uppercase font-black tracking-widest leading-none">Retained</p>
                  </div>
                  <p className="text-xl font-black text-slate-800 italic">{party.incumbentsRetained}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Incumbents</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users size={12} />
                    <p className="text-[9px] uppercase font-black tracking-widest leading-none">New Faces</p>
                  </div>
                  <p className="text-xl font-black text-slate-800 italic">{party.newcomersFielded}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Newcomers</p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {party.averageAssets !== null && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <IndianRupee size={10} className="text-emerald-500" />
                        <span>Average Assets</span>
                      </div>
                      <span className="text-emerald-600">
                        {party.averageAssets >= 10000000 
                          ? `₹${(party.averageAssets / 10000000).toFixed(1)} Cr` 
                          : `₹${(party.averageAssets / 100000).toFixed(1)} L`}
                      </span>
                    </div>
                    <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000" 
                        style={{ width: `${((party.averageAssets || 0) / maxAvgAssets) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {party.totalCriminalCases !== null && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Gavel size={10} className="text-rose-500" />
                        <span>Total Cases</span>
                      </div>
                      <span className={(party.totalCriminalCases ?? 0) > 0 ? 'text-rose-500' : 'text-slate-400'}>
                        {party.totalCriminalCases}
                      </span>
                    </div>
                    <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                       <div 
                          className="h-full bg-rose-500 transition-all duration-1000" 
                          style={{ width: `${party.criminalCandidatePercentage || 0}%` }}
                       ></div>
                    </div>
                  </div>
                )}

                {(party.ownConstituencyPercent !== null || party.crossConstituencyPercent !== null) && (
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Locality Trends</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Own Constituency</span>
                        <span className="text-emerald-500">{party.ownConstituencyPercent}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${party.ownConstituencyPercent || 0}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Cross-Constituency</span>
                        <span className="text-blue-500">{party.crossConstituencyPercent}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${party.crossConstituencyPercent || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
