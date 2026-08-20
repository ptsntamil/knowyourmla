import { MinistryHistoryRecord } from "@/types/models";
import { Briefcase, Building2, Calendar, UserCheck } from "lucide-react";

interface MinistryTimelineProps {
  history: MinistryHistoryRecord[];
}

export default function MinistryTimeline({ history }: MinistryTimelineProps) {
  if (!history || history.length === 0) {
    return null;
  }

  // Sort history chronologically descending
  const sortedHistory = [...history].sort((a, b) => {
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  return (
    <section className="space-y-8 mt-12">
      <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Ministry & Portfolio History</h2>
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden p-8">
        <div className="relative border-l-4 border-slate-100 ml-4 space-y-12">
          {sortedHistory.map((record, index) => {
            const endDateStr = record.end_date || "Present";
            const startYear = record.start_date.split("-")[0];
            const endYear = record.end_date ? record.end_date.split("-")[0] : "Present";
            const isCurrent = !record.end_date;

            return (
              <div key={record.id || index} className="relative pl-8">
                {/* Timeline dot */}
                <div className={`absolute -left-[14px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${isCurrent ? 'bg-brand-gold' : 'bg-slate-300'}`}>
                  {isCurrent && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:items-start md:justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">{record.designation}</h3>
                      {isCurrent && (
                        <span className="text-[10px] bg-brand-green/10 text-brand-green font-black px-2 py-1 rounded uppercase tracking-wider">
                          Current
                        </span>
                      )}
                      {record.is_additional_charge && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-black px-2 py-1 rounded uppercase tracking-wider">
                          Additional Charge
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                      <Calendar size={12} className="text-brand-gold" />
                      <span>{record.start_date} &mdash; {endDateStr}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-xl text-right md:min-w-[140px]">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Government</div>
                    <div className="text-xs font-black text-brand-dark">{record.government}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{record.chief_minister} Cabinet</div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mt-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Briefcase size={12} />
                    Portfolios Held
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {record.portfolio_names.map((portfolio, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
                        <a href={`/tn/portfolios/${portfolio.toLowerCase().replace(/[^a-z0-9]/g, '')}`} className="text-sm font-bold text-brand-dark hover:text-brand-gold transition-colors">
                          {portfolio}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {record.reason_for_end && !isCurrent && (
                  <div className="mt-3 text-xs font-bold text-slate-400 flex items-center gap-2">
                    <span className="w-4 h-px bg-slate-200" />
                    Term ended: {record.reason_for_end}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
