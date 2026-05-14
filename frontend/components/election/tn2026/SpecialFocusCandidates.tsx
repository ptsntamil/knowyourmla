import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, UserCheck, ChevronRight } from 'lucide-react';
import { ElectionInsightCandidate } from '@/lib/elections/preElectionDashboard/dashboard.types';
import PartyBadge from '@/components/ui/PartyBadge';

interface SpecialFocusCandidatesProps {
  starCandidates: ElectionInsightCandidate[];
  authorFocusCandidates: ElectionInsightCandidate[];
}

export default function SpecialFocusCandidates({
  starCandidates,
  authorFocusCandidates
}: SpecialFocusCandidatesProps) {

  if (starCandidates.length === 0 && authorFocusCandidates.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* 1. Star Candidates Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight italic leading-tight">
              Star Candidates
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High-Profile Contests</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
          {starCandidates.map((cand, idx) => (
            <CandidateFocusWidget key={`star-${idx}`} candidate={cand} />
          ))}
          {starCandidates.length === 0 && (
            <p className="text-sm font-medium text-slate-400 italic">No star candidates identified yet.</p>
          )}
        </div>
      </div>

      {/* 2. Our Focus Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-dark/10 flex items-center justify-center text-brand-dark">
            <UserCheck size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight italic leading-tight">
              Our Focus
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct Editorial Insights</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
          {authorFocusCandidates.map((cand, idx) => (
            <CandidateFocusWidget key={`author-${idx}`} candidate={cand} />
          ))}
          {authorFocusCandidates.length === 0 && (
            <p className="text-sm font-medium text-slate-400 italic">No focused candidates identified yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CandidateFocusWidget({ candidate }: { candidate: ElectionInsightCandidate }) {
  const profileHref = `/tn/mla/${candidate.personId}`;

  return (
    <div className="group bg-white border border-slate-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-brand-gold/5 hover:-translate-y-0.5 flex items-center gap-4 relative overflow-hidden">
      {/* Profile Pic */}
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
        {candidate.profilePic ? (
          <Image
            src={candidate.profilePic}
            alt={candidate.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <UserCheck size={24} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0 space-y-1">
        <Link href={profileHref}>
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-tight italic truncate hover:text-brand-gold transition-colors">
            {candidate.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2">
          <PartyBadge
            party={candidate.partyName || candidate.party || "Independent"}
            shortName={candidate.partyShortName || candidate.party}
            logoUrl={candidate.partyLogoUrl}
            showName={false}
            size="sm"
          />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
            {candidate.constituencyName}
          </span>
        </div>
      </div>

      {/* Action Arrow */}
      <Link href={profileHref} className="shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-dark group-hover:text-white transition-all">
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}
