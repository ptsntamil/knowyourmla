"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown, ChevronRight, User, Award, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ConstituencyResult } from '@/lib/services/election-analytics.service';
import Badge from '@/components/ui/Badge';
import { getPartySlug } from '@/lib/utils/party-utils';

interface ConstituencyResultsExplorerProps {
  results: ConstituencyResult[];
  year: number;
}

type SortField = 'constituencyName' | 'winnerName' | 'winnerParty' | 'margin' | 'turnoutPercent';
type SortOrder = 'asc' | 'desc';

export default function ConstituencyResultsExplorer({ results, year }: ConstituencyResultsExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('constituencyName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [displayCount, setDisplayCount] = useState(30);

  // Reset display count when search or sort changes
  useEffect(() => {
    setDisplayCount(30);
  }, [searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedResults = useMemo(() => {
    return results
      .filter(r => 
        r.constituencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.winnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.winnerParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.winnerPartyShort.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.runnerUpName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.runnerUpParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.runnerUpPartyShort.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.districtName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return sortOrder === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      });
  }, [results, searchTerm, sortField, sortOrder]);

  const displayedResults = useMemo(() => {
    return filteredAndSortedResults.slice(0, displayCount);
  }, [filteredAndSortedResults, displayCount]);

  const hasMore = displayCount < filteredAndSortedResults.length;

  return (
    <div className="space-y-12">
      {/* Search and Filters Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-8 border-b border-slate-100 mb-8">
        <div className="space-y-3">
          <h3 className="text-3xl font-black text-brand-dark uppercase tracking-tight">Constituency Results</h3>
          <div className="flex items-center gap-3">
            <Badge variant="outline" size="sm" dot>
              {filteredAndSortedResults.length} Seats
            </Badge>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Showing all {year} outcomes</p>
          </div>
        </div>
        
        <div className="relative max-w-xl w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search constituency, candidate or party..."
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2.5rem] text-sm font-medium focus:ring-8 focus:ring-brand-gold/10 focus:border-brand-gold/30 transition-all outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop View Table */}
      <div className="hidden md:block bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th 
                  className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-brand-dark transition-colors group"
                  onClick={() => handleSort('constituencyName')}
                >
                  <div className="flex items-center gap-2">
                    Constituency {sortField === 'constituencyName' && <ArrowUpDown size={12} className="text-brand-gold" />}
                  </div>
                </th>
                <th 
                  className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-brand-dark transition-colors"
                  onClick={() => handleSort('winnerName')}
                >
                  <div className="flex items-center gap-2">
                    Winner {sortField === 'winnerName' && <ArrowUpDown size={12} className="text-brand-gold" />}
                  </div>
                </th>
                <th 
                  className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-brand-dark transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Runner-up
                  </div>
                </th>
                <th 
                  className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-brand-dark transition-colors"
                  onClick={() => handleSort('margin')}
                >
                  <div className="flex items-center gap-2">
                    Victory {sortField === 'margin' && <ArrowUpDown size={12} className="text-brand-gold" />}
                  </div>
                </th>
                <th 
                  className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-brand-dark transition-colors"
                  onClick={() => handleSort('turnoutPercent')}
                >
                  <div className="flex items-center gap-2">
                    Turnout {sortField === 'turnoutPercent' && <ArrowUpDown size={12} className="text-brand-gold" />}
                  </div>
                </th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedResults.map((result, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-7">
                    <div className="space-y-1.5">
                      <Link 
                        href={`/tn/constituency/${result.constituencyId?.toLowerCase()}`}
                        className="font-black text-brand-dark uppercase tracking-tight text-base hover:text-brand-gold transition-colors block"
                      >
                        {result.constituencyName}
                      </Link>
                      {result.districtName && (
                        <Link 
                          href={`/tn/districts/${result.districtName.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-brand-gold transition-colors block"
                        >
                          {result.districtName}
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-brand-gold flex-shrink-0" />
                        {result.winnerPersonId ? (
                          <Link 
                            href={`/tn/mla/${result.winnerPersonId}`}
                            className="font-black text-brand-dark text-sm leading-tight hover:text-brand-gold transition-colors"
                          >
                            {result.winnerName}
                          </Link>
                        ) : (
                          <p className="font-black text-brand-dark text-sm leading-tight">{result.winnerName}</p>
                        )}
                      </div>
                      <Link 
                        href={`/parties/${getPartySlug(result.winnerParty)}`}
                        className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-2.5 w-fit shadow-sm border whitespace-nowrap transition-all hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: result.winnerPartyColorBg || '#f8fafc',
                          color: result.winnerPartyColorText || '#1e293b',
                          borderColor: result.winnerPartyColorBorder || '#e2e8f0'
                        }}
                      >
                        {result.winnerPartyLogoUrl && (
                          <div className="relative w-6 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20 shadow-inner">
                            <Image
                              src={result.winnerPartyLogoUrl}
                              alt={result.winnerPartyShort}
                              width={18}
                              height={18}
                              className="object-contain"
                            />
                          </div>
                        )}
                        {result.winnerPartyShort}
                      </Link>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="space-y-4 opacity-60 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400 flex-shrink-0" />
                        {result.runnerUpPersonId ? (
                          <Link 
                            href={`/tn/mla/${result.runnerUpPersonId}`}
                            className="font-bold text-slate-600 text-sm leading-tight hover:text-brand-gold transition-colors"
                          >
                            {result.runnerUpName}
                          </Link>
                        ) : (
                          <p className="font-bold text-slate-600 text-sm leading-tight">{result.runnerUpName}</p>
                        )}
                      </div>
                      <Link 
                        href={`/parties/${getPartySlug(result.runnerUpParty)}`}
                        className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-2.5 w-fit shadow-sm border whitespace-nowrap transition-all hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: result.runnerUpPartyColorBg || '#f8fafc',
                          color: result.runnerUpPartyColorText || '#1e293b',
                          borderColor: result.runnerUpPartyColorBorder || '#e2e8f0'
                        }}
                      >
                        {result.runnerUpPartyLogoUrl && (
                          <div className="relative w-6 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20 shadow-inner">
                            <Image
                              src={result.runnerUpPartyLogoUrl}
                              alt={result.runnerUpPartyShort}
                              width={18}
                              height={18}
                              className="object-contain"
                            />
                          </div>
                        )}
                        {result.runnerUpPartyShort}
                      </Link>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="space-y-1">
                      <p className="font-black text-brand-dark text-lg tabular-nums">+{result.margin.toLocaleString()}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Votes Margin</p>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    {result.turnoutPercent ? (
                      <div className="space-y-2">
                        <p className="font-black text-slate-700 text-sm">{result.turnoutPercent}%</p>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-gold rounded-full" 
                            style={{ width: `${result.turnoutPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">N/A</span>
                    )}
                  </td>
                  <td className="px-10 py-7 text-right">
                    <Link
                      href={`/tn/constituency/${result.constituencyId?.toLowerCase()}/election/${year}`}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-gold transition-all shadow-xl shadow-brand-dark/10 active:scale-95 group/btn"
                    >
                      Full Result <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredAndSortedResults.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center">
                    <div className="max-w-md mx-auto space-y-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto ring-4 ring-slate-50">
                        <ShieldAlert className="text-slate-200" size={40} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-black text-brand-dark uppercase tracking-tight">No Results Found</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">We couldn't find any outcome matching "{searchTerm}". Try general terms like party names or districts.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout (Visible on Small Screens only) */}
      <div className="grid grid-cols-1 gap-8 md:hidden">
        {displayedResults.map((result, index) => (
          <div key={index} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-2">
                <Link 
                  href={`/tn/constituency/${result.constituencyId?.toLowerCase()}`}
                  className="text-2xl font-black text-brand-dark uppercase tracking-tighter leading-tight hover:text-brand-gold transition-colors block"
                >
                  {result.constituencyName}
                </Link>
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/tn/districts/${result.districtName?.toLowerCase().replace(/\s+/g, '-')}`}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Badge variant="outline" size="xs" className="border-slate-100 text-slate-400 hover:text-brand-gold">{result.districtName}</Badge>
                  </Link>
                </div>
              </div>
              {result.turnoutPercent && (
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Turnout</p>
                  <p className="font-black text-brand-dark text-lg">{result.turnoutPercent}%</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-brand-gold" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Winner</p>
                  </div>
                  <Badge variant="gold" size="xs">Won</Badge>
                </div>
                <div className="space-y-3">
                  {result.winnerPersonId ? (
                    <Link 
                      href={`/tn/mla/${result.winnerPersonId}`}
                      className="font-black text-brand-dark text-base hover:text-brand-gold transition-colors"
                    >
                      {result.winnerName}
                    </Link>
                  ) : (
                    <p className="font-black text-brand-dark text-base">{result.winnerName}</p>
                  )}
                  <Link 
                    href={`/parties/${getPartySlug(result.winnerParty)}`}
                    className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-2.5 w-fit shadow-sm border whitespace-nowrap"
                    style={{
                      backgroundColor: result.winnerPartyColorBg || '#f8fafc',
                      color: result.winnerPartyColorText || '#1e293b',
                      borderColor: result.winnerPartyColorBorder || '#e2e8f0'
                    }}
                  >
                    {result.winnerPartyLogoUrl && (
                      <div className="relative w-6 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20 shadow-inner">
                        <Image
                          src={result.winnerPartyLogoUrl}
                          alt={result.winnerPartyShort}
                          width={18}
                          height={18}
                          className="object-contain"
                        />
                      </div>
                    )}
                    {result.winnerPartyShort}
                  </Link>
                </div>
              </div>

              <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-300" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Runner-up</p>
                </div>
                <div className="space-y-3">
                  {result.runnerUpPersonId ? (
                    <Link 
                      href={`/tn/mla/${result.runnerUpPersonId}`}
                      className="font-bold text-slate-600 text-base hover:text-brand-gold transition-colors"
                    >
                      {result.runnerUpName}
                    </Link>
                  ) : (
                    <p className="font-bold text-slate-600 text-base">{result.runnerUpName}</p>
                  )}
                  <Link 
                    href={`/parties/${getPartySlug(result.runnerUpParty)}`}
                    className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-2.5 w-fit shadow-sm border whitespace-nowrap"
                    style={{
                      backgroundColor: result.runnerUpPartyColorBg || '#f8fafc',
                      color: result.runnerUpPartyColorText || '#1e293b',
                      borderColor: result.runnerUpPartyColorBorder || '#e2e8f0'
                    }}
                  >
                    {result.runnerUpPartyLogoUrl && (
                      <div className="relative w-6 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20 shadow-inner">
                        <Image
                          src={result.runnerUpPartyLogoUrl}
                          alt={result.runnerUpPartyShort}
                          width={18}
                          height={18}
                          className="object-contain"
                        />
                      </div>
                    )}
                    {result.runnerUpPartyShort}
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Victory Margin</p>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="w-2 h-2 rounded-full bg-brand-gold" />
                  <p className="text-2xl font-black text-brand-dark tabular-nums">{result.margin.toLocaleString()}</p>
                </div>
              </div>
              <Link
                href={`/tn/constituency/${result.constituencyId?.toLowerCase()}/election/${year}`}
                className="w-full sm:w-auto text-center px-10 py-5 bg-brand-dark text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-brand-dark/20 active:scale-95 transition-all"
              >
                View Full Result
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="pt-12 text-center pb-20">
          <button
            onClick={() => setDisplayCount(prev => prev + 30)}
            className="px-16 py-5 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-brand-gold hover:scale-105 transition-all shadow-2xl shadow-brand-dark/20 active:scale-95 group/load"
          >
            Load More Results 
            <span className="ml-2 text-white/50 group-hover:text-white/80 transition-colors">
              ({filteredAndSortedResults.length - displayCount} remaining)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
