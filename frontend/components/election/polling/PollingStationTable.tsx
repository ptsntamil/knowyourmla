'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Target,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
  X,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import { PollingStationAnalysis, PollingStationCandidateResult } from '@/lib/services/election-analytics.service';
import PartyBadge from '@/components/ui/PartyBadge';

interface PollingStationTableProps {
  stations: PollingStationAnalysis[];
  constituencySlug: string;
  year: number;
  selectedCandidateIds: string[];
  selectedWinnerId?: string | null;
  onResetWinnerFilter?: () => void;
}

type SortKey = 'no' | 'turnout' | 'margin' | 'nota' | 'winner' | 'total' | string; // string for candidate IDs
type SortOrder = 'asc' | 'desc';

const PollingStationTable: React.FC<PollingStationTableProps> = ({
  stations,
  constituencySlug,
  year,
  selectedCandidateIds,
  selectedWinnerId,
  onResetWinnerFilter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('no');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const ITEMS_PER_PAGE = 50;

  const toggleRow = (psNo: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(psNo)) newExpanded.delete(psNo);
    else newExpanded.add(psNo);
    setExpandedRows(newExpanded);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedStations = useMemo(() => {
    let result = stations.filter(s =>
      (s.pollingStationNo.toString().includes(searchQuery) ||
        s.winnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.boothType.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!selectedWinnerId || s.winnerCandidateId === selectedWinnerId)
    );

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'no': {
          const aVal = a.pollingStationNo === 'POSTAL' ? 0 : parseInt(a.pollingStationNo) || Number.MAX_SAFE_INTEGER;
          const bVal = b.pollingStationNo === 'POSTAL' ? 0 : parseInt(b.pollingStationNo) || Number.MAX_SAFE_INTEGER;
          comparison = aVal - bVal;
          break;
        }
        case 'turnout': comparison = (a.turnoutPercentage || 0) - (b.turnoutPercentage || 0); break;
        case 'margin': comparison = a.marginVotes - b.marginVotes; break;
        case 'nota': comparison = a.notaPercentage - b.notaPercentage; break;
        case 'winner': comparison = a.winnerName.localeCompare(b.winnerName); break;
        case 'total': comparison = a.totalVotes - b.totalVotes; break;
        default: {
          // Candidate ID sorting
          const shareA = a.candidateResults.find(r => r.candidateId === sortKey)?.voteShare || 0;
          const shareB = b.candidateResults.find(r => r.candidateId === sortKey)?.voteShare || 0;
          comparison = shareA - shareB;
        }
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [stations, searchQuery, sortKey, sortOrder, selectedWinnerId]);

  const totalPages = Math.ceil(filteredAndSortedStations.length / ITEMS_PER_PAGE);
  const paginatedStations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedStations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedStations, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedRows(new Set()); // Collapse all rows on page change
    window.scrollTo({ top: document.getElementById('ps-table')?.offsetTop ? document.getElementById('ps-table')!.offsetTop - 100 : 0, behavior: 'smooth' });
  };

  const getBoothTypeBadge = (type: PollingStationAnalysis['boothType']) => {
    const styles = {
      STRONGHOLD: 'bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-sm shadow-emerald-500/5',
      SWING: 'bg-[#F4B63D]/10 text-[#B8831D] border-[#F4B63D]/20 shadow-sm shadow-[#F4B63D]/5',
      MULTI_CORNERED: 'bg-blue-50 text-blue-700 border-blue-200/50',
      NOTA_HEAVY: 'bg-rose-50 text-rose-700 border-[#F4B63D]/30 shadow-sm shadow-rose-500/5',
      LOW_TURNOUT: 'bg-slate-50 text-slate-700 border-slate-200/50',
      HIGH_TURNOUT: 'bg-indigo-50 text-indigo-700 border-indigo-200/50',
      NORMAL: 'bg-[#F8F6F1] text-[#5C6773] border-[#F4B63D]/10'
    };

    const labels = {
      STRONGHOLD: 'Fortress',
      SWING: 'Swing',
      MULTI_CORNERED: 'Contested',
      NOTA_HEAVY: 'NOTA Heavy',
      LOW_TURNOUT: 'Low Turnout',
      HIGH_TURNOUT: 'High Turnout',
      NORMAL: 'Normal'
    };

    return (
      <span className={`text-[10px] uppercase tracking-[0.15em] font-black px-3 py-1 rounded-xl border-2 ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  return (
    <div className="space-y-10">
      {/* SEO Content Block */}
      <div className="bg-[#F8F6F1] p-10 rounded-[2.5rem] border border-[#F4B63D]/10 shadow-xl space-y-5">
        <h2 className="text-2xl md:text-3xl font-black text-[#0D1B2A] tracking-tighter uppercase italic">
          Granular Booth Analytics
        </h2>
        <p className="text-[#5C6773] text-sm md:text-lg leading-relaxed max-w-5xl font-medium">
          The following comprehensive polling station dataset provides micro-level insights into <span className="text-[#0D1B2A] font-black">Election {year}</span> voter behavior. 
          Analyze booth-level vote share, turnout volatility, and candidate performance with advanced sorting and search capabilities.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:w-[450px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7D8790] w-5 h-5 group-focus-within:text-[#F4B63D] transition-colors" />
            <input
              type="text"
              placeholder="Search PS number, winner, booth type..."
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-[#F8F6F1] border-2 border-[#F4B63D]/5 focus:outline-none focus:ring-8 focus:ring-[#F4B63D]/5 focus:border-[#F4B63D] transition-all shadow-xl text-[#0D1B2A] font-bold placeholder-[#7D8790]/50"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
            />
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-[#071120] rounded-2xl border border-white/10 shadow-2xl">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F4B63D] animate-pulse" />
            <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em]">
              {filteredAndSortedStations.length} Stations Found
            </span>
          </div>
        </div>

        {selectedWinnerId && (
          <div className="flex items-center gap-3 flex-wrap animate-in fade-in slide-in-from-left-4">
            <div className="flex items-center gap-4 px-5 py-3 bg-[#071120] border-2 border-[#F4B63D] rounded-2xl text-[11px] font-black text-white shadow-2xl">
              <div className="p-1.5 bg-[#F4B63D] rounded-xl shadow-lg">
                <Filter className="w-4 h-4 text-[#071120]" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/40 uppercase tracking-[0.2em] text-[9px]">Analyzing Dominance</span>
                <span className="tracking-widest">Won by <span className="text-[#F4B63D] uppercase">{stations.find(s => s.winnerCandidateId === selectedWinnerId)?.winnerName}</span></span>
              </div>
              <button
                onClick={onResetWinnerFilter}
                className="ml-3 p-2 hover:bg-[#F4B63D] rounded-xl transition-all border border-white/10 hover:text-[#071120] hover:border-[#F4B63D]"
                title="Clear Filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Table Wrapper */}
      <div className="space-y-6">
        {/* Mobile Swipe Hint */}
        <div className="flex md:hidden items-center justify-center gap-3 py-3 bg-[#F4B63D] rounded-xl border border-[#F4B63D]/20 animate-pulse shadow-xl shadow-[#F4B63D]/10">
          <ArrowUpDown className="w-4 h-4 text-[#071120] rotate-90" />
          <span className="text-[10px] font-black text-[#071120] uppercase tracking-[0.2em]">Swipe to view candidate share</span>
        </div>

        <div id="ps-table" className="bg-white border-2 border-[#F4B63D]/10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[900px] relative">
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px] tabular-nums">
              <thead className="bg-[#071120] border-b border-[#F4B63D]/20 sticky top-0 z-40">
                <tr>
                  <th className="sticky left-0 z-50 bg-[#071120] p-6 font-black text-white text-[11px] uppercase tracking-[0.2em] w-32 border-r border-[#F4B63D]/20 shadow-2xl">
                    <button onClick={() => handleSort('no')} className="flex items-center gap-3 hover:text-[#F4B63D] transition-colors w-full">
                      Booth {sortKey === 'no' ? (sortOrder === 'asc' ? <ArrowUp size={16} className="text-[#F4B63D]" /> : <ArrowDown size={16} className="text-[#F4B63D]" />) : <ArrowUpDown size={16} className="opacity-20" />}
                    </button>
                  </th>
                  <th className="p-6 font-black text-white/60 text-[11px] uppercase tracking-[0.2em] text-right border-r border-[#F4B63D]/10">
                    <button onClick={() => handleSort('total')} className="flex items-center justify-end gap-3 hover:text-[#F4B63D] transition-colors w-full">
                      Total {sortKey === 'total' ? (sortOrder === 'asc' ? <ArrowUp size={16} className="text-[#F4B63D]" /> : <ArrowDown size={16} className="text-[#F4B63D]" />) : <ArrowUpDown size={16} className="opacity-20" />}
                    </button>
                  </th>
                  <th className="p-6 font-black text-white/60 text-[11px] uppercase tracking-[0.2em] text-right border-r border-[#F4B63D]/10">
                    <button onClick={() => handleSort('turnout')} className="flex items-center justify-end gap-3 hover:text-[#F4B63D] transition-colors w-full">
                      Turnout % {sortKey === 'turnout' ? (sortOrder === 'asc' ? <ArrowUp size={16} className="text-[#F4B63D]" /> : <ArrowDown size={16} className="text-[#F4B63D]" />) : <ArrowUpDown size={16} className="opacity-20" />}
                    </button>
                  </th>
                  <th className="p-6 font-black text-white/60 text-[11px] uppercase tracking-[0.2em] text-right border-r border-[#F4B63D]/10">
                    <button onClick={() => handleSort('nota')} className="flex items-center justify-end gap-3 hover:text-[#F4B63D] transition-colors w-full">
                      NOTA {sortKey === 'nota' ? (sortOrder === 'asc' ? <ArrowUp size={16} className="text-[#F4B63D]" /> : <ArrowDown size={16} className="text-[#F4B63D]" />) : <ArrowUpDown size={16} className="opacity-20" />}
                    </button>
                  </th>

                  {/* Dynamic Candidate Columns */}
                  {selectedCandidateIds.map(cid => {
                    const res = stations[0]?.candidateResults.find(r => r.candidateId === cid);
                    return (
                      <th key={cid} className="p-6 font-black text-white text-[11px] uppercase tracking-[0.2em] text-center border-r border-[#F4B63D]/10 bg-white/5 group/header relative transition-all hover:bg-white/10">
                        <button
                          onClick={() => handleSort(cid)}
                          className="flex flex-col items-center gap-2 w-full hover:text-[#F4B63D] transition-colors"
                          title={res?.name}
                        >
                          <span className="truncate w-full max-w-[100px]">{res?.partyShort}</span>
                          {sortKey === cid ? (sortOrder === 'asc' ? <ArrowUp size={14} className="text-[#F4B63D]" /> : <ArrowDown size={14} className="text-[#F4B63D]" />) : <ArrowUpDown size={14} className="opacity-10" />}
                        </button>

                        {/* Hover Name Overlay */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-5 py-2 bg-[#F4B63D] text-[#071120] text-[10px] font-black rounded-xl opacity-0 group-hover/header:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-90 group-hover/header:scale-100 border-2 border-white/20 uppercase tracking-widest">
                          {res?.name}
                        </div>
                      </th>
                    );
                  })}

                  <th className="p-6 font-black text-white/60 text-[11px] uppercase tracking-[0.2em] text-center">
                    Classification
                  </th>
                  <th className="p-6 font-black text-white text-[11px] uppercase tracking-widest w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4B63D]/10">
                {paginatedStations.map((station, index) => (
                  <React.Fragment key={station.pollingStationNo}>
                    <tr
                      className={`group transition-all cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-[#F8F6F1]/50'} ${expandedRows.has(station.pollingStationNo) ? 'bg-[#F4B63D]/5' : 'hover:bg-[#F4B63D]/10'}`}
                      onClick={() => toggleRow(station.pollingStationNo)}
                    >
                      <td className="sticky left-0 z-20 bg-white p-6 font-black text-[#0D1B2A] text-sm border-r border-[#F4B63D]/10 shadow-2xl group-hover:bg-[#F8F6F1] transition-colors">
                        {station.pollingStationNo === 'POSTAL' ? (
                          <span className="text-[10px] uppercase tracking-widest font-black text-[#F4B63D]">POSTAL</span>
                        ) : (
                          station.pollingStationNo
                        )}
                      </td>
                      <td className="p-6 text-right font-black text-[#0D1B2A] text-sm border-r border-[#F4B63D]/5">
                        {station.totalVotes.toLocaleString()}
                      </td>
                      <td className="p-6 text-right border-r border-[#F4B63D]/5">
                        {station.turnoutPercentage !== null ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-sm font-black text-[#0D1B2A]">{station.turnoutPercentage.toFixed(1)}%</span>
                            <div className="w-20 h-1.5 bg-[#071120]/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#F4B63D] rounded-full transition-all duration-700"
                                style={{ width: `${station.turnoutPercentage}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#7D8790]/30 text-[10px] font-black uppercase tracking-widest">N/A</span>
                        )}
                      </td>
                      <td className="p-6 text-right border-r border-[#F4B63D]/5">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-rose-600 italic">+{station.notaVotes}</span>
                          <span className="text-[10px] font-black text-[#7D8790] uppercase">{station.notaPercentage.toFixed(1)}%</span>
                        </div>
                      </td>

                      {/* Dynamic Candidate Cells */}
                      {selectedCandidateIds.map(cid => {
                        const res = station.candidateResults.find(r => r.candidateId === cid);
                        const isWinner = res?.candidateId === station.winnerCandidateId;
                        return (
                          <td key={cid} className={`p-6 text-center border-r border-[#F4B63D]/5 transition-all ${isWinner ? 'bg-[#F4B63D]/5' : ''}`}>
                            {res ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-sm font-black ${isWinner ? 'text-[#0D1B2A]' : 'text-[#5C6773]'}`}>
                                  {res.voteShare.toFixed(1)}%
                                </span>
                                <span className={`text-[10px] font-black ${isWinner ? 'text-[#F4B63D]' : 'text-[#7D8790]/50'}`}>
                                  {res.votes.toLocaleString()}
                                </span>
                                {isWinner && (
                                  <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-[#071120] mt-2 tracking-widest bg-[#F4B63D] px-2 py-1 rounded-lg shadow-lg">
                                    <Target className="w-2.5 h-2.5" /> Won
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-200">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="p-6 text-center border-r border-[#F4B63D]/5">
                        {getBoothTypeBadge(station.boothType)}
                      </td>
                      <td className="p-6 text-center">
                        <div className={`p-2 rounded-xl transition-all shadow-lg ${expandedRows.has(station.pollingStationNo) ? 'bg-[#071120] text-[#F4B63D] rotate-180' : 'bg-[#F8F6F1] text-[#7D8790] group-hover:bg-[#071120] group-hover:text-[#F4B63D]'}`}>
                          <ChevronDown size={20} />
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail View */}
                    {expandedRows.has(station.pollingStationNo) && (
                      <tr className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <td colSpan={7 + selectedCandidateIds.length} className="bg-[#F8F6F1]/80 p-10 border-y-2 border-[#F4B63D]/20 shadow-inner relative">
                          {/* Decorative gold line */}
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F4B63D]" />
                          
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Candidate Breakdown */}
                            <div className="lg:col-span-2 space-y-8">
                              <div className="flex items-center justify-between">
                                <h4 className="text-base font-black text-[#0D1B2A] flex items-center gap-4 uppercase tracking-[0.2em] italic">
                                  <Target className="w-5 h-5 text-[#F4B63D]" />
                                  {station.pollingStationNo === 'POSTAL' ? 'Postal Aggregate Results' : 'Comprehensive Performance'}
                                </h4>
                                <div className="px-4 py-1.5 bg-[#071120] text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-white/10">
                                  {station.candidateResults.length} Candidates
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {station.candidateResults.map((res, i) => {
                                  const isWinner = res.candidateId === station.winnerCandidateId;
                                  return (
                                    <div key={i} className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between shadow-xl ${isWinner ? 'bg-white border-[#F4B63D] ring-8 ring-[#F4B63D]/5' : 'bg-white border-[#F4B63D]/5 hover:border-[#F4B63D]/30'}`}>
                                      <div className="flex items-center gap-5">
                                        <div className="relative">
                                          <PartyBadge
                                            party={res.partyShort}
                                            logoUrl={res.partyLogoUrl}
                                            colorBg={res.partyColorBg}
                                            colorText={res.partyColorText}
                                            colorBorder={res.partyColorBorder}
                                            showName={false}
                                            size="md"
                                          />
                                          {isWinner && (
                                            <div className="absolute -top-3 -right-3 bg-[#F4B63D] p-1 rounded-full shadow-lg border-2 border-white">
                                              <Trophy className="w-3.5 h-3.5 text-[#071120] fill-[#071120]" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-sm font-black text-[#0D1B2A] truncate uppercase tracking-tighter">{res.name}</span>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-[#7D8790] uppercase tracking-widest italic">{(res.contributionPercent * 100).toFixed(1)}% Efficiency</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0 ml-4">
                                        <div className={`text-xl font-black tabular-nums ${isWinner ? 'text-[#0D1B2A]' : 'text-[#5C6773]'}`}>{res.voteShare.toFixed(1)}%</div>
                                        <div className="text-[10px] font-black text-[#7D8790] uppercase tracking-widest">{res.votes.toLocaleString()} votes</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Insights & Actions */}
                            <div className="space-y-10">
                              <div className="space-y-6">
                                <h4 className="text-base font-black text-[#0D1B2A] flex items-center gap-4 uppercase tracking-[0.2em] italic">
                                  <Zap className="w-5 h-5 text-[#F4B63D]" />
                                  Booth Intelligence
                                </h4>
                                <div className="space-y-4">
                                  {station.insights.map((insight, i) => (
                                    <div key={i} className="flex gap-4 text-xs font-black text-[#0D1B2A] bg-white p-5 rounded-2xl border-2 border-[#F4B63D]/10 shadow-xl transition-all hover:-translate-y-1">
                                      <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                                      {insight}
                                    </div>
                                  ))}
                                  {station.insights.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-[#F4B63D]/20 rounded-3xl bg-white/50">
                                      <p className="text-[10px] text-[#7D8790] font-black uppercase tracking-[0.3em]">No statistical anomalies</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                  <div className="bg-[#071120] p-4 rounded-2xl border border-white/10 text-center shadow-2xl">
                                    <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Valid Votes</div>
                                    <div className="text-sm font-black text-white">{station.validVotes.toLocaleString()}</div>
                                  </div>
                                  <div className="bg-[#F4B63D] p-4 rounded-2xl border-2 border-[#071120]/10 text-center shadow-xl">
                                    <div className="text-[9px] font-black text-[#071120] uppercase tracking-[0.2em] mb-1">NOTA / Other</div>
                                    <div className="text-sm font-black text-[#071120]">{station.notaVotes.toLocaleString()}</div>
                                  </div>
                                </div>
                                <Link
                                  href={`/tn/constituency/${constituencySlug}/election/${year}/polling-station/${station.pollingStationNo}`}
                                  className="flex items-center justify-center gap-4 w-full py-5 bg-[#071120] text-[#F4B63D] rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#F4B63D] hover:text-[#071120] hover:shadow-2xl hover:shadow-[#F4B63D]/20 transition-all duration-500 group/btn shadow-2xl border border-white/10"
                                >
                                  Deep Analysis 
                                  <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform duration-500" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {filteredAndSortedStations.length === 0 && (
                  <tr>
                    <td colSpan={7 + selectedCandidateIds.length} className="py-40 text-center bg-[#F8F6F1]/50">
                      <div className="flex flex-col items-center gap-8">
                        <div className="relative">
                          <div className="absolute inset-0 bg-[#F4B63D]/20 blur-[100px] rounded-full animate-pulse" />
                          <div className="relative p-10 bg-white rounded-[2.5rem] shadow-2xl border-2 border-[#F4B63D]/10">
                            <Search className="w-16 h-16 text-[#F4B63D]/30" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-3xl font-black text-[#0D1B2A] tracking-tighter uppercase italic">No Booths Found</p>
                          <p className="text-sm text-[#5C6773] font-bold uppercase tracking-widest max-w-xs mx-auto">Zero results matching your current intelligence criteria.</p>
                        </div>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            if (onResetWinnerFilter) onResetWinnerFilter();
                          }}
                          className="mt-6 px-10 py-4 bg-[#071120] text-[#F4B63D] rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#F4B63D] hover:text-[#071120] transition-all duration-500 shadow-2xl"
                        >
                          Reset Intelligence Feed
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 bg-[#F8F6F1] p-10 rounded-[2.5rem] border border-[#F4B63D]/10 shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#7D8790] uppercase tracking-[0.3em] mb-1">Navigation Feed</span>
            <div className="text-sm text-[#5C6773] font-bold uppercase tracking-widest">
              Segment <span className="text-[#0D1B2A] font-black tabular-nums">{currentPage}</span> <span className="text-[#7D8790]/30 mx-2">/</span> <span className="text-[#0D1B2A] font-black tabular-nums">{totalPages}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-4 rounded-2xl bg-white border border-[#F4B63D]/5 hover:bg-[#071120] hover:text-[#F4B63D] disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-[#F4B63D]/10"
              title="First Page"
            >
              <ChevronsLeft size={20} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-4 rounded-2xl bg-white border border-[#F4B63D]/5 hover:bg-[#071120] hover:text-[#F4B63D] disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-[#F4B63D]/10"
              title="Previous Page"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2 mx-4">
              {[...Array(Math.min(typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5, totalPages))].map((_, i) => {
                let pageNum;
                const maxVisible = typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5;
                if (totalPages <= maxVisible) {
                  pageNum = i + 1;
                } else if (currentPage <= Math.ceil(maxVisible / 2)) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - Math.floor(maxVisible / 2)) {
                  pageNum = totalPages - (maxVisible - 1) + i;
                } else {
                  pageNum = currentPage - Math.floor(maxVisible / 2) + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl text-[11px] font-black transition-all tabular-nums uppercase tracking-widest ${currentPage === pageNum
                      ? 'bg-[#071120] text-[#F4B63D] shadow-2xl scale-110 border-2 border-[#F4B63D]'
                      : 'bg-white text-[#7D8790] hover:bg-[#F8F6F1] hover:text-[#0D1B2A] border border-[#F4B63D]/10 shadow-lg'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-4 rounded-2xl bg-white border border-[#F4B63D]/5 hover:bg-[#071120] hover:text-[#F4B63D] disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-[#F4B63D]/10"
              title="Next Page"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-4 rounded-2xl bg-white border border-[#F4B63D]/5 hover:bg-[#071120] hover:text-[#F4B63D] disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-[#F4B63D]/10"
              title="Last Page"
            >
              <ChevronsRight size={20} />
            </button>
          </div>

          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[10px] font-black text-[#7D8790] uppercase tracking-[0.3em] mb-1">Total Dataset</span>
            <div className="text-sm text-[#0D1B2A] font-black tracking-widest uppercase">
              <span className="tabular-nums">{filteredAndSortedStations.length}</span> Records
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollingStationTable;
