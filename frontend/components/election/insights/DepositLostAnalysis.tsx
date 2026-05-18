"use client";

import React, { useState, useMemo } from 'react';
import { DepositLostPartyStats } from '@/lib/services/election-analytics.service';
import PartyBadge from '@/components/ui/PartyBadge';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface DepositLostAnalysisProps {
  stats: DepositLostPartyStats[];
}

export default function DepositLostAnalysis({ stats }: DepositLostAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (!stats || stats.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400 font-medium">No deposit loss data available for this election.</p>
      </div>
    );
  }

  // Calculate overall totals
  const totalContested = stats.reduce((sum, s) => sum + s.seatsContested, 0);
  const totalLost = stats.reduce((sum, s) => sum + s.depositLostCount, 0);
  const totalSaved = stats.reduce((sum, s) => sum + s.depositSavedCount, 0);
  const overallLossPercentage = totalContested > 0 ? (totalLost / totalContested) * 100 : 0;

  const filteredStats = useMemo(() => {
    return stats.filter(party => 
      party.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      party.partyShort.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stats, searchTerm]);

  const totalPages = Math.ceil(filteredStats.length / itemsPerPage);
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const currentData = filteredStats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/20">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Deposit Lost</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{totalLost.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Deposit Saved</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalSaved.toLocaleString()}</p>
        </div>
        <div className="bg-brand-gold/10 p-5 rounded-2xl border border-brand-gold/20">
          <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-1">Overall Loss %</p>
          <p className="text-2xl font-black text-brand-gold">{overallLossPercentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search party name or acronym..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-brand-dark dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Party</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Contested</th>
                <th className="px-6 py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right whitespace-nowrap">Lost</th>
                <th className="px-6 py-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest text-right whitespace-nowrap">Saved</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Loss %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {currentData.length > 0 ? (
                currentData.map((party, idx) => (
                  <tr key={party.partyId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-slate-300 dark:text-slate-600 text-xs font-bold w-6">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </div>
                        <PartyBadge
                          party={party.partyName}
                          shortName={party.partyShort || party.partyName}
                          logoUrl={party.partyLogoUrl}
                          colorBg={party.partyColorBg}
                          colorText={party.partyColorText}
                          colorBorder={party.partyColorBorder}
                          size="md"
                          showName={false}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight truncate max-w-[150px] sm:max-w-xs">
                            {party.partyShort}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px] sm:max-w-xs">
                            {party.partyName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{party.seatsContested}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-rose-500">{party.depositLostCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-500">{party.depositSavedCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-brand-dark dark:text-slate-200">
                        {party.depositLossPercentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                    No parties found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStats.length)} of {filteredStats.length} parties
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black text-brand-dark dark:text-slate-200 min-w-[3rem] text-center">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
