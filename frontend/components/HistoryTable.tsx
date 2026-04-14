import { ElectionHistoryRecord } from "@/types/models";
import PartyBadge from "@/components/ui/PartyBadge";

interface HistoryTableProps {
  history: ElectionHistoryRecord[];
}

export default function HistoryTable({ history }: HistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50">
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Constituency</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Party</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Result</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Margin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {history.map((record, index) => {
            const isUpcomingElection = record.year >= 2026 && record.results_declared === false;
            const resultLabel = isUpcomingElection ? "CONTESTANT" : (record.winner ? "WON" : "LOST");
            const resultClass = isUpcomingElection
              ? "bg-blue-100 text-blue-700"
              : record.winner
                ? "bg-brand-gold text-white shadow-md"
                : "bg-slate-200 text-slate-500";
            const marginLabel = isUpcomingElection
              ? "UPCOMING"
              : (record.margin ? record.margin.toLocaleString() : (record.margin_percent ? `${record.margin_percent}%` : "-"));

            return (
              <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-4 font-black text-brand-dark text-lg">{record.year}</td>
                <td className="px-6 py-4 text-slate-600 font-medium capitalize">{record.constituency.toLowerCase()}</td>
                <td className="px-6 py-4">
                  <PartyBadge
                    party={record.party}
                    logoUrl={record.party_logo_url}
                    colorBg={record.party_color_bg}
                    colorText={record.party_color_text}
                    colorBorder={record.party_color_border}
                  />
                </td>
                <td className="px-6 py-4">
                  <span className={`px-4 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest whitespace-nowrap ${resultClass}`}>
                    {resultLabel}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-600">
                  {marginLabel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
