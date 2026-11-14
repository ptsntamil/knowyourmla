import React from 'react';
import Link from 'next/link';
import { ExpenditureReport } from '@/types/models';
import { ReportingScopeBadge } from './ReportingScopeBadge';
import { ChevronRight } from 'lucide-react';

interface PartyExpenditureTableProps {
  reports: ExpenditureReport[];
}

export const PartyExpenditureTable: React.FC<PartyExpenditureTableProps> = ({ reports }) => {
  const formatCr = (val?: number) => val != null ? `₹${(val / 10000000).toFixed(2)} Cr` : "N/A";
  
  // Find max for the visual bar (across all to show magnitude, though scopes differ, just to give a sense of scale)
  const maxExp = Math.max(...reports.map(r => r.reported_total_rs || 0), 1);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Party</th>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Reported Total</th>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Gen. Propaganda</th>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate Exp.</th>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Scope</th>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Profile</th>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => {
              const width = report.reported_total_rs ? Math.max((report.reported_total_rs / maxExp) * 100, 2) : 0;
              return (
                <tr key={report.party_id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="font-black text-brand-dark">{report.party_short}</div>
                    <div className="text-xs text-slate-400 font-medium">{report.party_full}</div>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-700">{formatCr(report.reported_total_rs)}</td>
                  <td className="py-4 px-6 text-sm text-slate-500">{formatCr(report.general_propaganda_rs)}</td>
                  <td className="py-4 px-6 text-sm text-slate-500">{formatCr(report.candidate_expenditure_rs)}</td>
                  <td className="py-4 px-6">
                    <ReportingScopeBadge scope={report.report_scope} />
                  </td>
                  <td className="py-4 px-6 align-middle">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-brand-gold h-full rounded-full" style={{ width: `${width}%` }}></div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link 
                      href={`/tn/election-expenditure/2026/${report.party_id.replace("PARTY#", "")}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-brand-dark group-hover:text-brand-gold transition-colors"
                      aria-label={`View ${report.party_short} disclosure`}
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
