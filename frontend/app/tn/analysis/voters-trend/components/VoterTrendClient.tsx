"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { VoterTrendAnalysis, VoterTrendConstituency } from "@/lib/services/voter-trend.service";
import { TrendCharts } from "./TrendCharts";
import { Search, ChevronDown, ChevronUp, X, MapPin, Users, TrendingUp, Download, Vote } from "lucide-react";

interface VoterTrendClientProps {
  data: VoterTrendAnalysis;
}

type SortField = 'name' | 'district_name' | 'votes_polled_2021' | 'votes_polled_2026' | 'additional_votes' | 'vote_growth_percentage' | 'turnout_percentage_2021' | 'turnout_percentage_2026';
type SortOrder = 'asc' | 'desc';

export function VoterTrendClient({ data }: VoterTrendClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("additional_votes");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedConstituency, setSelectedConstituency] = useState<VoterTrendConstituency | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'increase' | 'decrease'>('all');
  
  const itemsPerPage = 25;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data.constituencies];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) || 
        c.district_name.toLowerCase().includes(lowerSearch)
      );
    }

    if (filterType === 'increase') {
      result = result.filter(c => c.additional_votes > 0);
    } else if (filterType === 'decrease') {
      result = result.filter(c => c.additional_votes < 0);
    }

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      }
    });

    return result;
  }, [data.constituencies, searchTerm, sortField, sortOrder, filterType]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const currentData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const exportCSV = () => {
    const headers = ["Constituency", "District", "Votes Polled 2021", "Votes Polled 2026", "Votes Added", "Vote Growth (%)", "Turnout 2021 (%)", "Turnout 2026 (%)", "Electorate Change"];
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedData.map(c => 
        [
          `"${c.name}"`, 
          `"${c.district_name}"`, 
          c.votes_polled_2021, 
          c.votes_polled_2026, 
          c.additional_votes,
          c.vote_growth_percentage,
          c.turnout_percentage_2021,
          c.turnout_percentage_2026,
          c.elector_change
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "tn_votes_polled_2021_2026.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 text-gray-300 ml-1 inline" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-gray-700 ml-1 inline" /> : <ChevronDown className="w-4 h-4 text-gray-700 ml-1 inline" />;
  };

  return (
    <div className="space-y-12">
      {/* Charts Section */}
      <section id="visualizations">
        <TrendCharts 
          topAddedVotes={data.insights.top_added_votes_constituencies}
          topVoteGrowth={data.insights.top_vote_growth_constituencies}
          votesGrowthBuckets={data.insights.votes_growth_distribution_buckets}
        />
      </section>

      {/* District Summary Table */}
      <section id="district-summary" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">District-wise Voting Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3 text-right">Total Votes Polled (2021)</th>
                <th className="px-4 py-3 text-right">Total Votes Polled (2026)</th>
                <th className="px-4 py-3 text-right">Total Votes Added</th>
                <th className="px-4 py-3 text-right">Avg Vote Growth %</th>
                <th className="px-4 py-3 text-right">Avg Turnout (2026)</th>
                <th className="px-4 py-3 text-right">Constituencies</th>
              </tr>
            </thead>
            <tbody>
              {data.district_summaries.slice(0, 10).map((d) => (
                <tr key={d.district_name} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link href={`/tn/districts/${d.district_name.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-blue-600">
                      {d.district_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{d.total_votes_polled_2021.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">{d.total_votes_polled_2026.toLocaleString('en-IN')}</td>
                  <td className={`px-4 py-3 text-right font-medium ${d.total_votes_added > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {d.total_votes_added > 0 ? '+' : ''}{d.total_votes_added.toLocaleString('en-IN')}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${d.average_vote_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {d.average_vote_growth > 0 ? '+' : ''}{d.average_vote_growth}%
                  </td>
                  <td className="px-4 py-3 text-right">{d.average_turnout_2026}%</td>
                  <td className="px-4 py-3 text-right">{d.number_of_constituencies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">Showing top 10 districts by total votes added.</p>
      </section>

      {/* Main Data Table */}
      <section id="constituency-data" className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold">Constituency-wise Votes Polled</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search constituency..." 
                className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <select 
              className="border rounded-lg text-sm px-3 py-2 bg-white"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as 'all' | 'increase' | 'decrease');
                setCurrentPage(1);
              }}
            >
              <option value="all">All Constituencies</option>
              <option value="increase">Votes Increased</option>
              <option value="decrease">Votes Decreased</option>
            </select>
            
            <button 
              onClick={exportCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  Constituency {renderSortIcon('name')}
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 hidden sm:table-cell" onClick={() => handleSort('district_name')}>
                  District {renderSortIcon('district_name')}
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-right hidden md:table-cell" onClick={() => handleSort('votes_polled_2021')}>
                  Votes (2021) {renderSortIcon('votes_polled_2021')}
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('votes_polled_2026')}>
                  Votes (2026) {renderSortIcon('votes_polled_2026')}
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('additional_votes')}>
                  Votes Added {renderSortIcon('additional_votes')}
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('vote_growth_percentage')}>
                  Growth % {renderSortIcon('vote_growth_percentage')}
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-right hidden lg:table-cell" onClick={() => handleSort('turnout_percentage_2026')}>
                  Turnout % {renderSortIcon('turnout_percentage_2026')}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? currentData.map((c, idx) => (
                <tr 
                  key={c.id} 
                  className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedConstituency(c)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <span className="text-gray-400 mr-2">{(currentPage - 1) * itemsPerPage + idx + 1}.</span>
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{c.district_name}</td>
                  <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell">{c.votes_polled_2021.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-medium">{c.votes_polled_2026.toLocaleString('en-IN')}</td>
                  <td className={`px-4 py-3 text-right font-medium ${c.additional_votes > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {c.additional_votes > 0 ? '+' : ''}{c.additional_votes.toLocaleString('en-IN')}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${c.vote_growth_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {c.vote_growth_percentage > 0 ? '+' : ''}{c.vote_growth_percentage}%
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">{c.turnout_percentage_2026}%</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No constituencies found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} Entries
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Prev
              </button>
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Constituency Detail Drawer / Modal */}
      {selectedConstituency && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedConstituency(null)}>
          <div 
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedConstituency.name}</h3>
                  <p className="text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" /> {selectedConstituency.district_name} District
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedConstituency(null)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-1">2021 Election</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedConstituency.votes_polled_2021.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500 mt-1">Votes Polled</p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 flex justify-between">Electorate: <span className="font-medium text-gray-900">{selectedConstituency.total_electors_2021.toLocaleString('en-IN')}</span></p>
                    <p className="text-xs text-gray-500 flex justify-between mt-1">Turnout: <span className="font-medium text-gray-900">{selectedConstituency.turnout_percentage_2021}%</span></p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium mb-1">2026 Election</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedConstituency.votes_polled_2026.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-blue-700/70 mt-1">Votes Polled</p>
                  <div className="mt-3 pt-3 border-t border-blue-200/50">
                    <p className="text-xs text-blue-800 flex justify-between">Electorate: <span className="font-medium">{selectedConstituency.total_electors_2026.toLocaleString('en-IN')}</span></p>
                    <p className="text-xs text-blue-800 flex justify-between mt-1">Turnout: <span className="font-medium">{selectedConstituency.turnout_percentage_2026}%</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-600 flex items-center gap-2"><Vote className="w-4 h-4"/> Votes Added</span>
                  <span className={`font-bold text-lg ${selectedConstituency.additional_votes > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedConstituency.additional_votes > 0 ? '+' : ''}{selectedConstituency.additional_votes.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-600 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Vote Growth</span>
                  <span className={`font-bold ${selectedConstituency.vote_growth_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedConstituency.vote_growth_percentage > 0 ? '+' : ''}{selectedConstituency.vote_growth_percentage}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-600 flex items-center gap-2"><Users className="w-4 h-4"/> Electorate Change</span>
                  <span className="font-bold text-gray-900">
                    {selectedConstituency.elector_change > 0 ? '+' : ''}{selectedConstituency.elector_change.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-600 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Turnout Change</span>
                  <span className="font-bold text-gray-900">
                    {selectedConstituency.turnout_change > 0 ? '+' : ''}{selectedConstituency.turnout_change}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link 
                  href={`/tn/mla/${selectedConstituency.slug}`}
                  className="px-4 py-3 text-center border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View MLA Profile
                </Link>
                <Link 
                  href={`/tn/constituency/${selectedConstituency.slug}`}
                  className="px-4 py-3 text-center bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Full Election Results
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

