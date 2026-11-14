"use client";

import React, { useState } from 'react';
import { ExpenditureReport } from '@/types/models';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface CategoryExplorerProps {
  reports: ExpenditureReport[];
}

export const CategoryExplorer: React.FC<CategoryExplorerProps> = ({ reports }) => {
  const categoryGroups = [
    { id: "media", label: "Media & Digital Advertising", keys: ["Media advertising", "Media & digital advertising", "State/Dist/Local media advertising"] },
    { id: "materials", label: "Campaign Materials", keys: ["Publicity materials", "Campaign materials", "State/Dist/Local publicity materials"] },
    { id: "travel", label: "Campaign Travel", keys: ["Star campaigner travel", "Other leader travel", "State/Dist/Local star campaigner travel", "State/Dist/Local other leader travel"] },
    { id: "rallies", label: "Rallies & Public Meetings", keys: ["Public meetings/processions/rallies", "Rallies & public meetings", "State/Dist/Local public meetings/rallies"] },
    { id: "candidate_funding", label: "Candidate Funding", keys: ["Lump-sum candidate payments", "Candidate lump-sum payments", "Candidate funding"] },
    { id: "candidate_media", label: "Candidate Media", keys: ["Candidate-specific media"] },
    { id: "candidate_materials", label: "Candidate Materials", keys: ["Candidate campaign materials", "Candidate publicity materials"] },
    { id: "candidate_rallies", label: "Candidate Rallies", keys: ["Candidate-specific rallies"] },
    { id: "other_candidate", label: "Other Candidate Expenditure", keys: ["Other candidate expenditure", "Other candidate expenses"] },
    { id: "other_propaganda", label: "Other Party Propaganda", keys: ["Other general propaganda", "Other party-wide expenditure", "State/Dist/Local other propaganda", "Virtual / social media campaign"] },
    { id: "criminal", label: "Criminal Antecedent Publication", keys: ["Criminal antecedent publication", "Criminal antecedent disclosure"] }
  ];

  const [selectedGroupId, setSelectedGroupId] = useState(categoryGroups[0].id);

  const activeGroup = categoryGroups.find(g => g.id === selectedGroupId) || categoryGroups[0];

  // Map data for the active group
  const partyData = reports.map(report => {
    let total = 0;
    let found = false;

    report.categories?.forEach(cat => {
      if (activeGroup.keys.includes(cat.category_name)) {
        if (cat.amount_rs != null) {
          total += cat.amount_rs;
        }
        // Even if 0, if the category exists in their report, we found it
        if (cat.reported_or_calculated !== 'NOT_DISCLOSED') {
          found = true;
        }
      }
    });

    return {
      party: report.party_short,
      party_id: report.party_id,
      amount: total,
      disclosed: found
    };
  }).sort((a, b) => b.amount - a.amount);

  const maxAmount = Math.max(...partyData.filter(d => d.disclosed).map(d => d.amount), 1);
  const formatAmount = (val: number) => val === 0 ? "₹0" : `₹${(val / 10000000).toFixed(2)} Cr`;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-100 p-6 h-96 overflow-y-auto">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Category</h3>
        <div className="space-y-2">
          {categoryGroups.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                selectedGroupId === group.id 
                  ? 'bg-brand-gold text-brand-dark shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="w-full md:w-2/3 p-6 md:p-10 h-96 overflow-y-auto">
        <h3 className="text-xl font-black text-brand-dark mb-8 uppercase tracking-tight">{activeGroup.label}</h3>
        <div className="space-y-6">
          {partyData.map((data) => (
            <div key={data.party_id} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="font-bold text-slate-700">{data.party}</span>
                <span className="font-black text-brand-dark">
                  {data.disclosed ? formatAmount(data.amount) : <span className="text-slate-400 font-medium text-sm">Not disclosed</span>}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                {data.disclosed && (
                  <div 
                    className="bg-brand-dark h-full rounded-full" 
                    style={{ width: `${Math.max((data.amount / maxAmount) * 100, 1)}%` }}
                  ></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
