"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardCandidate, DashboardFilterOptions } from '@/lib/elections/preElectionDashboard/dashboard.types';
import PartyBadge from '@/components/ui/PartyBadge';
import { Search, Filter, X, ChevronDown, User, IndianRupee, Gavel, GraduationCap } from 'lucide-react';

interface CandidateDirectoryProps {
  initialCandidates: DashboardCandidate[];
  filterOptions: DashboardFilterOptions;
}

export default function CandidateDirectory({ initialCandidates, filterOptions }: CandidateDirectoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
  const [partyFilter, setPartyFilter] = useState(searchParams.get('party') || "All");
  const [districtFilter, setDistrictFilter] = useState(searchParams.get('district') || "All");
  const [constituencyFilter, setConstituencyFilter] = useState(searchParams.get('constituency') || "All");
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || "All");
  const [educationFilter, setEducationFilter] = useState(searchParams.get('education') || "All");
  const [contestTypeFilter, setContestTypeFilter] = useState(searchParams.get('contestType') || "All");

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (partyFilter !== "All") params.set('party', partyFilter);
    if (districtFilter !== "All") params.set('district', districtFilter);
    if (constituencyFilter !== "All") params.set('constituency', constituencyFilter);
    if (statusFilter !== "All") params.set('status', statusFilter);
    if (educationFilter !== "All") params.set('education', educationFilter);
    if (contestTypeFilter !== "All") params.set('contestType', contestTypeFilter);

    const queryString = params.toString();
    const targetUrl = queryString ? `?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', targetUrl);
  }, [searchTerm, partyFilter, districtFilter, constituencyFilter, statusFilter, educationFilter, contestTypeFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setPartyFilter("All");
    setDistrictFilter("All");
    setConstituencyFilter("All");
    setStatusFilter("All");
    setEducationFilter("All");
    setContestTypeFilter("All");
  };

  const filteredCandidates = useMemo(() => {
    return initialCandidates.filter(c => {
      const matchSearch = searchTerm === "" || 
                          c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.constituencyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchParty = partyFilter === "All" || c.partyId === partyFilter;
      const matchDistrict = districtFilter === "All" || c.districtId === districtFilter;
      const matchConstituency = constituencyFilter === "All" || c.constituencyId === constituencyFilter;
      
      let matchStatus = true;
      if (statusFilter === "Incumbent") matchStatus = !!c.isIncumbent;
      if (statusFilter === "Newcomer") matchStatus = !!c.isNewcomer;

      const matchEducation = educationFilter === "All" || c.education === educationFilter;
      const matchContestType = contestTypeFilter === "All" || c.constituencyContestType === contestTypeFilter;

      return matchSearch && matchParty && matchDistrict && matchConstituency && matchStatus && matchEducation && matchContestType;
    });
  }, [initialCandidates, searchTerm, partyFilter, districtFilter, constituencyFilter, statusFilter, educationFilter, contestTypeFilter]);

  const FilterSelect = ({ 
    label, 
    value, 
    options, 
    onChange 
  }: { 
    label: string, 
    value: string, 
    options: { label: string, value: string, count?: number }[], 
    onChange: (val: string) => void 
  }) => (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
      <div className="relative group">
        <select
          className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer transition-all hover:bg-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="All">All {label}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label} {opt.count !== undefined ? `(${opt.count})` : ''}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
            <h2 className="text-2xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter italic">
              Candidate Directory
            </h2>
          </div>
          <p className="text-slate-500 font-medium text-sm">Explore all announced candidates for the 2026 Assembly Election.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {(searchTerm || partyFilter !== "All" || districtFilter !== "All" || constituencyFilter !== "All" || statusFilter !== "All" || educationFilter !== "All" || contestTypeFilter !== "All") && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors"
            >
              <X size={14} /> Reset
            </button>
          )}
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${
              showAdvanced ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} /> {showAdvanced ? 'Hide Filters' : 'More Filters'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
        {/* Main Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="flex flex-col gap-1.5 lg:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Candidate Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search name or constituency..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all hover:bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <FilterSelect 
            label="Parties" 
            value={partyFilter} 
            options={filterOptions.parties} 
            onChange={setPartyFilter} 
          />

          <FilterSelect 
            label="Districts" 
            value={districtFilter} 
            options={filterOptions.districts} 
            onChange={setDistrictFilter} 
          />

          <FilterSelect 
            label="Constituencies" 
            value={constituencyFilter} 
            options={filterOptions.constituencies} 
            onChange={setConstituencyFilter} 
          />
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 items-end animate-in fade-in slide-in-from-top-4 duration-300">
             <FilterSelect 
              label="Contestant Type" 
              value={statusFilter} 
              options={[
                { label: 'Incumbents', value: 'Incumbent' },
                { label: 'Newcomers', value: 'Newcomer' }
              ]} 
              onChange={setStatusFilter} 
            />
            <FilterSelect 
              label="Education" 
              value={educationFilter} 
              options={filterOptions.education} 
              onChange={setEducationFilter} 
            />
            <FilterSelect 
              label="Contest Type" 
              value={contestTypeFilter} 
              options={filterOptions.contestTypes} 
              onChange={setContestTypeFilter} 
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden hidden lg:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidate Profile</th>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Constituency</th>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Party Affiliation</th>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Affidavit Summary</th>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Intelligence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCandidates.length > 0 ? filteredCandidates.slice(0, 50).map(c => (
              <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="py-6 px-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {c.profilePic ? (
                        <img 
                          src={c.profilePic} 
                          alt={c.name} 
                          className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-slate-100 group-hover:scale-110 transition-transform shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                          <User size={20} />
                        </div>
                      )}
                      {c.isIncumbent && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-gold rounded-full border-2 border-white" title="Incumbent"></div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-black text-brand-dark uppercase tracking-tight italic">{c.name}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>{c.age ? `${c.age} Yrs` : 'Age N/A'}</span>
                        {c.gender && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span>{c.gender}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-700">{c.constituencyName}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.districtName}</p>
                  </div>
                </td>
                <td className="py-6 px-8">
                  <PartyBadge 
                    party={c.partyShortName || "IND"} 
                    colorBg={c.partyColorBg}
                    colorText={c.partyColorText}
                    colorBorder={c.partyColorBorder}
                    logoUrl={c.partyLogoUrl}
                  />
                </td>
                <td className="py-6 px-8">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <IndianRupee size={12} className="text-emerald-500" />
                        <span className="text-xs font-black">{c.totalAssets ? `₹${(c.totalAssets/10000000).toFixed(1)}Cr` : '--'}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${c.criminalCases && c.criminalCases > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        <Gavel size={12} />
                        <span className="text-xs font-black">{c.criminalCases || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <GraduationCap size={12} />
                      <span className="text-[10px] font-bold truncate max-w-[120px]">{c.education || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="flex flex-wrap gap-1.5 items-start max-w-[200px]">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider">
                      {c.status}
                    </span>
                    {c.isIncumbent && (
                      <span className="bg-brand-gold/10 text-brand-gold border border-brand-gold/20 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider">
                        RECONTESTING
                      </span>
                    )}
                    {c.isNewcomer && (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider">
                        NEWCOMER
                      </span>
                    )}
                    {c.constituencyContestType === 'own_constituency' && (
                      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider">
                        Own Constituency
                      </span>
                    )}
                    {c.constituencyContestType === 'cross_constituency' && (
                      <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider">
                        Cross-Constituency
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Search size={32} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">No candidates match your criteria</p>
                  <button onClick={resetFilters} className="text-brand-gold font-black uppercase tracking-widest text-xs hover:underline">Clear all filters</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile view Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:hidden">
        {filteredCandidates.slice(0, 30).map(c => (
          <div key={c.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 space-y-6">
             <div className="flex justify-between items-start">
               <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    {c.profilePic ? (
                      <img src={c.profilePic} className="w-full h-full rounded-2xl object-cover" alt={c.name} />
                    ) : (
                      <User size={20} />
                    )}
                 </div>
                 <div className="space-y-0.5">
                   <h4 className="font-black text-brand-dark uppercase italic tracking-tight">{c.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.constituencyName}</p>
                 </div>
               </div>
               <PartyBadge 
                 party={c.partyShortName || "IND"} 
                 colorBg={c.partyColorBg}
                 colorText={c.partyColorText}
                 colorBorder={c.partyColorBorder}
                 logoUrl={c.partyLogoUrl}
               />
             </div>

             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Education</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{c.education || 'N/A'}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assets</p>
                  <p className="text-xs font-black text-emerald-600">{c.totalAssets ? `₹${(c.totalAssets/10000000).toFixed(1)}Cr` : '--'}</p>
               </div>
             </div>

             <div className="flex flex-wrap gap-2 pt-2">
                <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider">
                  {c.status}
                </span>
                {c.isIncumbent && (
                  <span className="bg-brand-gold/10 text-brand-gold px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider">
                    Incumbent
                  </span>
                )}
                {c.constituencyContestType === 'own_constituency' && (
                  <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider">
                    Own
                  </span>
                )}
                {c.constituencyContestType === 'cross_constituency' && (
                  <span className="bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider">
                    Cross
                  </span>
                )}
             </div>
          </div>
        ))}
      </div>

      {filteredCandidates.length > 50 && (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Showing top 50 matches </p>
          <div className="h-1 lg:w-32 bg-slate-100 rounded-full">
            <div className="h-full bg-brand-gold rounded-full" style={{ width: `${(50 / filteredCandidates.length) * 100}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
