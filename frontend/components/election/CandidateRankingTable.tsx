import Link from "next/link";
import { Award, Medal, User } from "lucide-react";
import { CandidateResultRow } from "@/lib/services/election-analytics.service";
import ProfileImage from "@/components/ProfileImage";
import PartyBadge from "@/components/ui/PartyBadge";

interface CandidateRankingTableProps {
  candidates: CandidateResultRow[];
  constituencyName: string;
}

export default function CandidateRankingTable({
  candidates,
  constituencyName
}: CandidateRankingTableProps) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between px-4 md:px-0">
        <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Full Candidate Ranking</h2>
        <div className="hidden md:flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {candidates.length} Candidates</span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl lg:shadow-2xl">
        <div className="px-10 py-6 bg-brand-dark flex justify-between items-center text-white">
          <h3 className="font-black uppercase tracking-widest text-[10px] md:text-sm">Official Contest Results</h3>
          <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Ranked by Votes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Party</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Votes</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Share%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {candidates.map((candidate) => (
                <tr 
                  key={candidate.rank} 
                  className={`group transition-colors ${
                    candidate.rank === 1 ? 'bg-brand-gold/[0.03] hover:bg-brand-gold/[0.05]' : 
                    candidate.rank === 2 ? 'bg-slate-50/50 hover:bg-slate-50' : 
                    'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      {candidate.rank === 1 ? (
                        <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-white shadow-lg ring-4 ring-brand-gold/10">
                          <Award size={16} strokeWidth={3} />
                        </div>
                      ) : candidate.rank === 2 ? (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                          <Medal size={16} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <span className="w-8 text-center font-black text-slate-300 text-lg">{candidate.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      {candidate.rank <= 2 && (
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 flex-shrink-0 bg-slate-50">
                           <ProfileImage 
                             src={undefined} // No candidate-specific profile pic here yet, unless we expand model
                             alt={candidate.name}
                             className="w-full h-full object-cover"
                           />
                        </div>
                      )}
                      <div className="flex flex-col">
                        {candidate.personId ? (
                          <Link 
                            href={`/tn/mla/${candidate.personId}`}
                            className="font-black text-brand-dark hover:text-brand-gold uppercase tracking-tight text-lg leading-tight transition-colors"
                          >
                            {candidate.name}
                          </Link>
                        ) : (
                          <span className="font-black text-brand-dark uppercase tracking-tight text-lg leading-tight">
                            {candidate.name}
                          </span>
                        )}
                        {candidate.rank === 1 && (
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-gold">Elected MLA</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                     <PartyBadge
                        party={candidate.partyShort}
                        logoUrl={candidate.partyLogoUrl}
                        colorBg={candidate.partyColorBg || 'rgba(15, 23, 42, 0.03)'}
                        colorText={candidate.partyColorText || '#0F172A'}
                        colorBorder={candidate.partyColorBorder || 'rgba(15, 23, 42, 0.08)'}
                     />
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col">
                      <span className="font-black text-brand-dark tracking-tight text-lg" suppressHydrationWarning>
                        {candidate.votes.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Votes</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-black tracking-tight text-lg ${candidate.rank === 1 ? 'text-brand-green' : 'text-slate-600'}`}>
                        {typeof candidate.voteShare === 'number' ? candidate.voteShare.toFixed(2) : (candidate.voteShare || '0.00')}%
                      </span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${candidate.rank === 1 ? 'bg-brand-green' : 'bg-slate-300'}`}
                          style={{ width: `${candidate.voteShare || 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
