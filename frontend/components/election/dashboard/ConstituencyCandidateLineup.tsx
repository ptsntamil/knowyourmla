import React from 'react';
import { OverlayCandidate } from '@/lib/elections/preElectionDashboard/dashboard.types';
import ConstituencyCandidateCard from './ConstituencyCandidateCard';
import { AlertCircle } from 'lucide-react';

interface ConstituencyCandidateLineupProps {
  candidates: OverlayCandidate[];
  overlayStatus: 'live' | 'upcoming';
}

export default function ConstituencyCandidateLineup({ 
  candidates, 
  overlayStatus 
}: ConstituencyCandidateLineupProps) {
  const isLive = overlayStatus === 'live';

  if (!isLive) {
    return (
      <div className="bg-white border border-slate-100 rounded-[3rem] p-12 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} className="text-slate-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight italic">Candidate Lineup Coming Soon</h3>
          <p className="text-slate-400 font-medium text-sm max-w-md mx-auto leading-relaxed">
            Party nominations and candidates for this constituency have not been added yet. This section will be live once official lists are available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {candidates.map((candidate, idx) => (
        <ConstituencyCandidateCard 
          key={candidate.id || `${candidate.personId}-${candidate.name}-${idx}`} 
          candidate={candidate} 
        />
      ))}
    </div>
  );
}
