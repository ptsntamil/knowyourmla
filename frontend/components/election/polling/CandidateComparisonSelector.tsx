'use client';

import React from 'react';
import { User, CheckCircle2, X } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  partyShort: string;
  colorBg?: string;
  colorText?: string;
}

interface CandidateComparisonSelectorProps {
  candidates: Candidate[];
  selectedCandidateIds: string[];
  onChange: (selectedIds: string[]) => void;
}

const CandidateComparisonSelector: React.FC<CandidateComparisonSelectorProps> = ({
  candidates,
  selectedCandidateIds,
  onChange
}) => {
  const toggleCandidate = (id: string) => {
    if (selectedCandidateIds.includes(id)) {
      onChange(selectedCandidateIds.filter(cid => cid !== id));
    } else {
      onChange([...selectedCandidateIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-[#F5F2EA]/80 backdrop-blur-md z-10 pb-3 border-b border-[#F4B63D]/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#071120] rounded-xl text-[#F4B63D] shadow-lg shadow-[#071120]/10">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-black text-[#0D1B2A] uppercase tracking-[0.2em] leading-tight">
              Compare Candidates
            </h3>
            <p className="text-[9px] text-[#5C6773] font-black uppercase tracking-[0.1em] mt-0.5">Toggle to cross-analyze performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-[#071120] bg-[#F4B63D] px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
            {selectedCandidateIds.length} Active
          </span>
          {selectedCandidateIds.length > 0 && (
            <button 
              onClick={() => onChange([])}
              className="p-1.5 hover:bg-[#F4B63D]/10 rounded-lg transition-all text-[#7D8790] hover:text-[#071120] border border-transparent hover:border-[#F4B63D]/20"
              title="Clear all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative group">
        <div className="flex overflow-x-auto pb-3 gap-3 scrollbar-hide -mx-2 px-2 snap-x">
          {candidates.map(candidate => {
            const isSelected = selectedCandidateIds.includes(candidate.id);
            return (
              <button
                key={candidate.id}
                onClick={() => toggleCandidate(candidate.id)}
                className={`
                  flex-shrink-0 snap-start flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2
                  ${isSelected 
                    ? 'bg-[#071120] border-[#F4B63D] text-white shadow-xl scale-[1.01]' 
                    : 'bg-[#F8F6F1] border-[#F4B63D]/5 text-[#5C6773] hover:border-[#F4B63D]/30 hover:bg-white hover:-translate-y-0.5'
                  }
                `}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-transparent transition-all" 
                  style={{ 
                    backgroundColor: candidate.colorBg || '#ccc',
                    boxShadow: isSelected ? `0 0 8px ${candidate.colorBg}` : 'none',
                    borderColor: isSelected ? 'white' : 'transparent'
                  }}
                />
                <span className="uppercase tracking-[0.1em] leading-none">{candidate.partyShort}</span>
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 ml-1 text-[#F4B63D] fill-[#F4B63D]/10" />
                ) : (
                  <div className="w-4 h-4 ml-1 rounded-full border-2 border-[#071120]/5 group-hover:border-[#F4B63D]/30" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CandidateComparisonSelector;
