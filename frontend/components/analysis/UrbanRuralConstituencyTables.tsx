"use client";

import React, { useState, useMemo } from 'react';
import { ConstituencyAnalysisResult } from '@/lib/services/analysis.service';
import Link from 'next/link';

interface Props {
  urbanData: ConstituencyAnalysisResult[];
  semiUrbanData: ConstituencyAnalysisResult[];
  ruralData: ConstituencyAnalysisResult[];
}

type SortKey = 'constituencyName' | 'districtId' | 'votes2021' | 'votes2026' | 'votesAdded' | 'growthPercentage' | 'turnout2026';
type SortOrder = 'asc' | 'desc';

export default function UrbanRuralConstituencyTables({ urbanData, semiUrbanData, ruralData }: Props) {
  
  const [activeTab, setActiveTab] = useState<'urban' | 'semi-urban' | 'rural'>('urban');
  const [sortKey, setSortKey] = useState<SortKey>('votesAdded');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc'); // default to desc for numeric metrics usually
    }
  };

  const sortedData = useMemo(() => {
    let data;
    if (activeTab === 'urban') data = [...urbanData];
    else if (activeTab === 'semi-urban') data = [...semiUrbanData];
    else data = [...ruralData];
    
    return data.sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [activeTab, urbanData, semiUrbanData, ruralData, sortKey, sortOrder]);

  const thClass = "px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-brand-dark transition-colors group";

  return (
    <div className="space-y-4">
      
      {/* Tabs */}
      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTab('urban')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all rounded-t-lg
            ${activeTab === 'urban' ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Urban ({urbanData.length})
        </button>
        <button 
          onClick={() => setActiveTab('semi-urban')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all rounded-t-lg
            ${activeTab === 'semi-urban' ? 'bg-white text-violet-600 border-t-2 border-violet-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Semi-Urban ({semiUrbanData.length})
        </button>
        <button 
          onClick={() => setActiveTab('rural')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all rounded-t-lg
            ${activeTab === 'rural' ? 'bg-white text-emerald-600 border-t-2 border-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Rural ({ruralData.length})
        </button>
      </div>

      <div className="bg-white rounded-b-xl rounded-tr-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 pl-6 cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleSort('constituencyName')}>
                  Constituency {sortKey === 'constituencyName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleSort('districtId')}>
                  District {sortKey === 'districtId' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-right cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleSort('votes2021')}>
                  Votes 2021 {sortKey === 'votes2021' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-right cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleSort('votes2026')}>
                  Votes 2026 {sortKey === 'votes2026' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-right cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleSort('votesAdded')}>
                  Added {sortKey === 'votesAdded' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-right cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleSort('growthPercentage')}>
                  Growth % {sortKey === 'growthPercentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 pr-6 text-right cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleSort('turnout2026')}>
                  Turnout {sortKey === 'turnout2026' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedData.map((row) => (
                <tr key={row.constituencyId} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 pl-6 font-semibold text-gray-900">
                    <Link href={`/tn/constituency/${row.constituencyId.replace('CONSTITUENCY#', '')}`} className="hover:text-blue-600 transition-colors">
                      {row.constituencyName}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{row.districtId.replace('DISTRICT#', '').toUpperCase()}</td>
                  <td className="p-4 text-right text-sm font-medium text-gray-600">{row.votes2021.toLocaleString()}</td>
                  <td className="p-4 text-right text-sm font-medium text-gray-900">{row.votes2026.toLocaleString()}</td>
                  <td className={`p-4 text-right text-sm font-bold ${row.votesAdded > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {row.votesAdded > 0 ? '+' : ''}{row.votesAdded.toLocaleString()}
                  </td>
                  <td className={`p-4 text-right text-sm font-bold ${row.growthPercentage > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {row.growthPercentage > 0 ? '+' : ''}{row.growthPercentage.toFixed(2)}%
                  </td>
                  <td className="p-4 pr-6 text-right text-sm font-medium text-gray-500">{row.turnout2026.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
