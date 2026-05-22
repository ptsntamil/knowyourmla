'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Zap, 
  User, 
  ChevronRight,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { PollingStationAnalysis } from '@/lib/services/election-analytics.service';
import PartyBadge from '@/components/ui/PartyBadge';

interface WinnerStats {
  candidateId: string;
  name: string;
  partyName: string;
  partyShort: string;
  partyLogoUrl?: string;
  profilePic?: string | null;
  colorBg?: string;
  colorText?: string;
  colorBorder?: string;
  stationsWon: number;
  dominancePercent: number;
  strongestBooth: { no: string; share: number };
  highestMarginBooth: { no: string; margin: number; marginPercent: number };
  avgVoteShare: number;
  avgMarginPercent: number;
  closestWonBooth: { no: string; margin: number };
}

interface WinnerFilterCardsProps {
  stations: PollingStationAnalysis[];
  selectedWinnerId: string | null;
  onSelectWinner: (candidateId: string | null) => void;
}

const WinnerFilterCards: React.FC<WinnerFilterCardsProps> = ({
  stations,
  selectedWinnerId,
  onSelectWinner
}) => {
  // Precompute stats for each candidate
  const stats = React.useMemo(() => {
    const winnerMap = new Map<string, WinnerStats>();
    const totalStations = stations.length;

    stations.forEach(station => {
      const winnerId = station.winnerCandidateId;
      if (winnerId === 'N/A') return;

      const winnerResult = station.candidateResults.find(r => r.candidateId === winnerId);
      if (!winnerResult) return;

      if (!winnerMap.has(winnerId)) {
        winnerMap.set(winnerId, {
          candidateId: winnerId,
          name: winnerResult.name,
          partyName: winnerResult.party,
          partyShort: winnerResult.partyShort,
          partyLogoUrl: winnerResult.partyLogoUrl,
          profilePic: winnerResult.profilePic,
          colorBg: winnerResult.partyColorBg,
          colorText: winnerResult.partyColorText,
          colorBorder: winnerResult.partyColorBorder,
          stationsWon: 0,
          dominancePercent: 0,
          strongestBooth: { no: '0', share: 0 },
          highestMarginBooth: { no: '0', margin: -1, marginPercent: 0 },
          avgVoteShare: 0,
          avgMarginPercent: 0,
          closestWonBooth: { no: '0', margin: Infinity }
        });
      }

      const stat = winnerMap.get(winnerId)!;
      stat.stationsWon += 1;
      stat.avgVoteShare += winnerResult.voteShare;
      
      const marginPercent = station.totalVotes > 0 ? (station.marginVotes / station.totalVotes) * 100 : 0;
      stat.avgMarginPercent += marginPercent;

      if (winnerResult.voteShare > stat.strongestBooth.share) {
        stat.strongestBooth = { no: station.pollingStationNo, share: winnerResult.voteShare };
      }

      if (station.marginVotes > stat.highestMarginBooth.margin) {
        stat.highestMarginBooth = { 
          no: station.pollingStationNo, 
          margin: station.marginVotes,
          marginPercent: marginPercent
        };
      }

      if (station.marginVotes < stat.closestWonBooth.margin) {
        stat.closestWonBooth = { no: station.pollingStationNo, margin: station.marginVotes };
      }
    });

    return Array.from(winnerMap.values())
      .map(stat => ({
        ...stat,
        dominancePercent: (stat.stationsWon / totalStations) * 100,
        avgVoteShare: stat.avgVoteShare / stat.stationsWon,
        avgMarginPercent: stat.avgMarginPercent / stat.stationsWon
      }))
      .sort((a, b) => b.stationsWon - a.stationsWon);
  }, [stations]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-[#F4B63D] rounded-2xl shadow-xl shadow-[#F4B63D]/20">
            <Trophy className="w-6 h-6 text-[#071120]" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black text-[#0D1B2A] uppercase tracking-tighter italic">
              Dominance Analytics
            </h3>
            <p className="text-[10px] text-[#5C6773] font-black uppercase tracking-[0.2em] mt-1">Granular candidate performance across all polling stations</p>
          </div>
        </div>
        {selectedWinnerId && (
          <button 
            onClick={() => onSelectWinner(null)}
            className="text-[10px] font-black text-[#071120] bg-[#F4B63D] px-6 py-2.5 rounded-2xl shadow-lg shadow-[#F4B63D]/20 uppercase tracking-[0.2em] hover:scale-105 transition-all flex items-center gap-3 border border-[#F4B63D]"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Reset Analysis
          </button>
        )}
      </div>

      <div className="flex overflow-x-auto pb-10 gap-8 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 snap-x">
        {stats.map((stat) => {
          const isActive = selectedWinnerId === stat.candidateId;
          
          return (
            <button
              key={stat.candidateId}
              onClick={() => {
                onSelectWinner(isActive ? null : stat.candidateId);
                // Smooth scroll to table
                if (!isActive) {
                  document.getElementById('ps-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`
                flex-shrink-0 w-[280px] md:w-[300px] rounded-[1.5rem] border-2 transition-all text-left group relative overflow-hidden snap-center flex flex-col
                ${isActive 
                  ? 'bg-[#FFFDF8] border-[#F4B63D] shadow-xl scale-[1.01] ring-4 ring-[#F4B63D]/5' 
                  : 'bg-[#F8F6F1] border-[#F4B63D]/5 hover:border-[#F4B63D]/30 hover:shadow-xl hover:-translate-y-0.5'
                }
              `}
            >
              {/* TOP AREA: Candidate Identity */}
              <div className="p-5 pb-4 relative">
                {/* Gold Top Accent */}
                <div 
                  className={`absolute top-0 left-0 right-0 h-1 transition-all ${isActive ? 'bg-[#F4B63D]' : 'bg-[#F4B63D]/10 group-hover:bg-[#F4B63D]/50'}`}
                />

                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className={`
                      w-12 h-12 rounded-xl overflow-hidden bg-white border-2 transition-all
                      ${isActive ? 'border-[#F4B63D] shadow-lg' : 'border-[#F4B63D]/5 group-hover:border-[#F4B63D]/30'}
                    `}>
                      {stat.profilePic ? (
                        <Image 
                          src={stat.profilePic} 
                          alt={stat.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                          <User className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 shadow-lg">
                      <PartyBadge 
                        party={stat.partyName}
                        shortName={stat.partyShort}
                        logoUrl={stat.partyLogoUrl}
                        colorBg={stat.colorBg}
                        colorText={stat.colorText}
                        colorBorder={stat.colorBorder}
                        showName={false}
                        size="xs"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h4 className={`text-sm md:text-base font-black truncate leading-tight mb-0.5 transition-colors ${isActive ? 'text-[#0D1B2A]' : 'text-[#0D1B2A] group-hover:text-[#F4B63D]'}`}>
                      {stat.name}
                    </h4>
                    <p className="text-[8px] font-black text-[#5C6773] uppercase tracking-widest">{stat.partyShort}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${isActive ? 'bg-[#F4B63D] text-[#071120]' : 'bg-[#071120] text-white'}`}>
                        Won {stat.stationsWon} Booths
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MIDDLE ANALYTICS: 3 Metrics */}
              <div className={`mx-5 py-3 border-y grid grid-cols-3 gap-2 ${isActive ? 'border-[#F4B63D]/20 bg-[#F4B63D]/5 rounded-xl' : 'border-[#F4B63D]/5'}`}>
                <div className="text-center space-y-0.5">
                  <p className="text-[8px] font-black text-[#7D8790] uppercase tracking-tighter">Dominance</p>
                  <p className={`text-sm font-black tabular-nums ${isActive ? 'text-[#071120]' : 'text-[#0D1B2A]'}`}>{stat.dominancePercent.toFixed(1)}%</p>
                </div>
                <div className="text-center border-x border-[#F4B63D]/10 space-y-0.5">
                  <p className="text-[8px] font-black text-[#7D8790] uppercase tracking-tighter">Avg Share</p>
                  <p className={`text-sm font-black tabular-nums ${isActive ? 'text-[#071120]' : 'text-[#0D1B2A]'}`}>{stat.avgVoteShare.toFixed(1)}%</p>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-[8px] font-black text-[#7D8790] uppercase tracking-tighter">Avg Margin</p>
                  <p className={`text-sm font-black tabular-nums ${isActive ? 'text-[#071120]' : 'text-[#0D1B2A]'}`}>{stat.avgMarginPercent.toFixed(1)}%</p>
                </div>
              </div>

              {/* BOTTOM INSIGHTS: Chips */}
              <div className="p-5 space-y-2.5">
                {[
                  { label: 'Strongest', value: `PS ${stat.strongestBooth.no} (${stat.strongestBooth.share.toFixed(1)}%)`, icon: Zap, color: 'text-amber-500' },
                  { label: 'Closest Win', value: `PS ${stat.closestWonBooth.no} (+${stat.closestWonBooth.margin})`, icon: Target, color: 'text-rose-500' },
                  { label: 'High Margin', value: `PS ${stat.highestMarginBooth.no} (${stat.highestMarginBooth.marginPercent.toFixed(1)}%)`, icon: TrendingUp, color: 'text-emerald-500' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between group/row">
                    <span className="text-[9px] font-black text-[#5C6773] uppercase tracking-widest flex items-center gap-2">
                      <item.icon className={`w-3 h-3 ${item.color}`} /> {item.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tabular-nums ${isActive ? 'bg-[#F4B63D]/20 text-[#071120]' : 'bg-[#071120]/5 text-[#0D1B2A]'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {isActive && (
                <div className="absolute top-4 right-5 pointer-events-none">
                  <div className="bg-[#F4B63D] p-1 rounded-full shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-[#071120] fill-[#071120]" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WinnerFilterCards;

