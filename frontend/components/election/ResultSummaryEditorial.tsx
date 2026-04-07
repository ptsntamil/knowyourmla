import { Info } from "lucide-react";
import { ConstituencyElectionResult } from "@/lib/services/election-analytics.service";

interface ResultSummaryEditorialProps {
  result: ConstituencyElectionResult;
}

export default function ResultSummaryEditorial({ result }: ResultSummaryEditorialProps) {
  const {
    constituencyName,
    year,
    winner,
    runnerUp,
    margin,
    turnoutPercent,
    totalCandidates,
    totalVotesPolled
  } = result;

  return (
    <section className="bg-slate-50 rounded-[3rem] p-8 md:p-12 border border-slate-100">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-shrink-0 w-16 h-16 rounded-3xl bg-white flex items-center justify-center text-brand-gold shadow-sm border border-slate-100">
          <Info size={32} />
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Election Summary & Analysis</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editorial Breakdown for {constituencyName} {year}</p>
          </div>

          <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed">
            <p>
              In the <strong>{year} Tamil Nadu Assembly Elections</strong>, the <strong>{constituencyName}</strong> constituency witnessed a significant contest involving <strong>{totalCandidates} candidates</strong>. 
              <strong> {winner.name}</strong>, representing the <strong>{winner.party} ({winner.partyShort})</strong>, emerged victorious with a total of <strong>{winner.votes.toLocaleString()} votes</strong>.
            </p>
            
            <p>
              The victory was secured with a winning margin of <strong>{margin.toLocaleString()} votes</strong> over the runner-up, 
              <strong> {runnerUp?.name || "the nearest contender"}</strong> from the <strong>{runnerUp?.party || "N/A"}</strong>, who secured {runnerUp?.votes.toLocaleString()} votes. 
              The winner's vote share stood at <strong>{winner.voteShare}%</strong>, reflecting strong support within the constituency.
            </p>

            <p>
              {turnoutPercent ? (
                <>
                  The voter turnout for {constituencyName} in {year} was recorded at <strong>{turnoutPercent}%</strong>. 
                  A total of <strong>{totalVotesPolled?.toLocaleString()} votes</strong> were polled, indicating {turnoutPercent > 70 ? "high" : "active"} civic participation in the democratic process.
                </>
              ) : (
                `Data for the total voter turnout in this election year for ${constituencyName} is being curated.`
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
             <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-green" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Winner: </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark">{winner.partyShort}</span>
             </div>
             <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-gold" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Margin: </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark">{margin.toLocaleString()}</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
