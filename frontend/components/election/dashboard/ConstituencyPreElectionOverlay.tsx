import React from 'react';
import { ConstituencyPreElectionOverlayData } from '@/lib/elections/preElectionDashboard/dashboard.types';
import ConstituencyElectionBanner from './ConstituencyElectionBanner';
import ConstituencyContestSnapshot from './ConstituencyContestSnapshot';
import ConstituencyCandidateLineup from './ConstituencyCandidateLineup';
import ConstituencyWatchSignals from './ConstituencyWatchSignals';
import ConstituencyHistoricalComparison from './ConstituencyHistoricalComparison';
import { Lightbulb } from 'lucide-react';

interface ConstituencyPreElectionOverlayProps {
  data: ConstituencyPreElectionOverlayData;
}

export default function ConstituencyPreElectionOverlay({ data }: ConstituencyPreElectionOverlayProps) {
  const isLive = data.overlayStatus === 'live';

  return (
    <div className="space-y-12">
      {/* Section 1: Banner */}
      <ConstituencyElectionBanner 
        constituencyName={data.constituencyName}
        overlayStatus={data.overlayStatus}
        tags={data.contestSummary?.tags || []}
      />

      {/* Section 2: Snapshot */}
      <ConstituencyContestSnapshot 
        currentMLA={data.currentMLA}
        lastWinner={data.lastElection}
        candidateCount={data.candidateCount}
        isOpenSeat={data.contestSummary?.isOpenSeat || false}
        isIncumbentRecontest={data.contestSummary?.isIncumbentRecontest || false}
        overlayStatus={data.overlayStatus}
      />

      {/* Section 3: Candidate Lineup */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tighter italic leading-none">
              2026 Candidate Lineup
            </h2>
          </div>
          {isLive && (
            <span className="bg-brand-dark text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">
              {data.candidateCount} Candidates
            </span>
          )}
        </div>
        
        <ConstituencyCandidateLineup 
          candidates={data.candidates}
          overlayStatus={data.overlayStatus}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Section 4: Insights */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
              <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tighter italic leading-none">
                Contest Insights
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] space-y-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <Lightbulb size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-brand-dark uppercase tracking-tight italic">Contest Shape</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {isLive 
                        ? `A ${data.candidateCount}-way contest featuring ${data.insights.majorParties.length} major parties. ${data.insights.newcomerCount} newcomers are in the fray.`
                        : `Contest shape will be determined once party nominations are finalized and candidates are added.`
                      }
                    </p>
                  </div>
               </div>
               
               <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] space-y-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <Lightbulb size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-brand-dark uppercase tracking-tight italic">Locality Intelligence</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {isLive 
                        ? `${data.insights.ownCount} candidates are local residents, while ${data.insights.crossCount} are contesting from outside their home constituency.`
                        : `Locality badges will identify "insider" vs "outsider" status for all announced candidates.`
                      }
                    </p>
                  </div>
               </div>
            </div>
          </div>

          {/* Section 5: Historical vs 2026 Comparison */}
          <ConstituencyHistoricalComparison 
            lastElection={data.lastElection}
            currentOverlay={{
              candidateCount: data.candidateCount,
              isIncumbentRecontest: data.contestSummary?.isIncumbentRecontest || false,
              isOpenSeat: data.contestSummary?.isOpenSeat || false,
              majorParties: data.insights.majorParties
            }}
            overlayStatus={data.overlayStatus}
          />
        </div>

        <div className="lg:col-span-1">
          {/* Section 6: Watch Signals */}
          <ConstituencyWatchSignals tags={data.contestSummary?.tags || []} />
        </div>
      </div>
    </div>
  );
}
