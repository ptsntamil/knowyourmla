import React from 'react';
import { ExpenditureReport, ExpenditureCategory } from '@/types/models';

interface ExpenditureCategoryChartProps {
  reports: ExpenditureReport[];
}

export const ExpenditureCategoryChart: React.FC<ExpenditureCategoryChartProps> = ({ reports }) => {
  // Define the major categories to display
  const majorCategories = [
    { label: "Media & Digital Advertising", keys: ["Media advertising", "Media & digital advertising", "State/Dist/Local media advertising"] },
    { label: "Other Party Propaganda", keys: ["Other general propaganda", "Other party-wide expenditure", "State/Dist/Local other propaganda", "Virtual / social media campaign"] },
    { label: "Candidate Funding", keys: ["Lump-sum candidate payments", "Candidate lump-sum payments", "Candidate funding"] },
    { label: "Campaign Travel", keys: ["Star campaigner travel", "Other leader travel", "State/Dist/Local star campaigner travel", "State/Dist/Local other leader travel"] },
    { label: "Campaign Materials", keys: ["Publicity materials", "Campaign materials", "State/Dist/Local publicity materials"] },
    { label: "Rallies & Public Meetings", keys: ["Public meetings/processions/rallies", "Rallies & public meetings", "State/Dist/Local public meetings/rallies"] },
    { label: "Criminal Antecedent Publication", keys: ["Criminal antecedent publication", "Criminal antecedent disclosure"] },
    { label: "Other Candidate Expenditure", keys: ["Candidate-specific media", "Candidate campaign materials", "Candidate-specific rallies", "Other candidate expenditure", "Other candidate expenses"] }
  ];

  // Aggregate values
  const aggregatedData = majorCategories.map(group => {
    let total = 0;
    let hasData = false;
    
    reports.forEach(report => {
      report.categories?.forEach(cat => {
        if (group.keys.includes(cat.category_name)) {
          if (cat.amount_rs != null) {
            total += cat.amount_rs;
            hasData = true;
          }
        }
      });
    });

    return {
      label: group.label,
      total,
      hasData
    };
  }).filter(d => d.hasData).sort((a, b) => b.total - a.total);

  const maxVal = aggregatedData.length > 0 ? aggregatedData[0].total : 1;

  const formatCr = (val: number) => `₹${(val / 10000000).toFixed(2)} Cr`;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-10">
      <div className="space-y-8">
        {aggregatedData.map((item, index) => {
          const width = Math.max((item.total / maxVal) * 100, 1);
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="font-bold text-slate-800">{item.label}</span>
                <span className="font-black text-brand-dark">{formatCr(item.total)}</span>
              </div>
              <div className="w-full bg-slate-50 rounded-full h-4 overflow-hidden flex">
                <div 
                  className="bg-brand-gold h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${width}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>* Aggregated across all available disclosures. Mixed reporting scopes apply.</span>
        <span>Denominator for % is not comparable due to mixed scopes.</span>
      </div>
    </div>
  );
};
