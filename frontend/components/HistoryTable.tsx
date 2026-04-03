import { ElectionHistoryRecord } from "@/types/models";

interface HistoryTableProps {
  history: ElectionHistoryRecord[];
}

export default function HistoryTable({ history }: HistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-bg-surface">
            <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Year</th>
            <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Constituency</th>
            <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Party</th>
            <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Result</th>
            <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Margin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {history.map((record, index) => (
            <tr key={index} className="hover:bg-bg-surface transition-colors border-b border-border-subtle/50">
              <td className="px-6 py-4 font-black text-text-primary text-lg">{record.year}</td>
              <td className="px-6 py-4 text-text-muted font-medium capitalize">{record.constituency.toLowerCase()}</td>
              <td className="px-6 py-4">
                  <span 
                    className="px-3 py-1.5 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-2.5 w-fit border border-border-subtle shadow-sm transition-colors"
                    style={{
                      backgroundColor: record.party_color_bg || 'var(--bg-surface)',
                      color: record.party_color_text || 'var(--text-primary)',
                      borderColor: record.party_color_border || 'var(--border-subtle)'
                    }}
                  >
                    {record.party_logo_url && (
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-border-subtle shadow-inner">
                        <img src={record.party_logo_url} alt={record.party} className="w-6 h-6 object-contain" />
                      </div>
                    )}
                    {record.party}
                  </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-4 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest ${record.winner
                  ? 'bg-text-accent text-text-inverse shadow-md'
                  : 'bg-bg-muted text-text-muted'
                  }`}>
                  {record.winner ? 'WON' : 'LOST'}
                </span>
              </td>
               <td className="px-6 py-4 font-bold text-text-muted">
                  {record.margin ? record.margin.toLocaleString() : (record.margin_percent ? `${record.margin_percent}%` : '-')}
               </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
