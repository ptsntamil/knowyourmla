"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardCandidate, DashboardFilterOptions } from '@/lib/elections/preElectionDashboard/dashboard.types';
import PartyBadge from '@/components/ui/PartyBadge';
import { Search, Filter, X, ChevronDown, User, IndianRupee, Gavel, GraduationCap } from 'lucide-react';
import { getPartyRank } from '@/lib/elections/preElectionDashboard/dashboard.utils';

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
  const [candidateTypeFilter, setCandidateTypeFilter] = useState(searchParams.get('candidateType') || searchParams.get('status') || "All");
  const [educationFilter, setEducationFilter] = useState(searchParams.get('education') || "All");
  const [contestTypeFilter, setContestTypeFilter] = useState(searchParams.get('contestType') || searchParams.get('contestRegion') || "All");
  const [multiSeatFilter, setMultiSeatFilter] = useState(searchParams.get('multiSeat') === 'true' ? 'Yes' : 'All');

  // Sorting State
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || "constituency");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || "asc");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (partyFilter !== "All") params.set('party', partyFilter);
    if (districtFilter !== "All") params.set('district', districtFilter);
    if (constituencyFilter !== "All") params.set('constituency', constituencyFilter);
    if (candidateTypeFilter !== "All") params.set('candidateType', candidateTypeFilter);
    if (educationFilter !== "All") params.set('education', educationFilter);
    if (contestTypeFilter !== "All") params.set('contestType', contestTypeFilter);
    if (multiSeatFilter === "Yes") params.set('multiSeat', 'true');
    
    if (sortBy !== "constituency") params.set('sortBy', sortBy);
    if (sortOrder !== "asc") params.set('sortOrder', sortOrder);

    const queryString = params.toString();
    const targetUrl = queryString ? `?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', targetUrl);
  }, [searchTerm, partyFilter, districtFilter, constituencyFilter, candidateTypeFilter, educationFilter, contestTypeFilter, multiSeatFilter, sortBy, sortOrder]);

  const resetFilters = () => {
    setSearchTerm("");
    setPartyFilter("All");
    setDistrictFilter("All");
    setConstituencyFilter("All");
    setCandidateTypeFilter("All");
    setEducationFilter("All");
    setContestTypeFilter("All");
    setMultiSeatFilter("All");
    setSortBy("constituency");
    setSortOrder("asc");
  };

  // 0. Pre-calculate lookup maps for advanced filters
  const { multiCornerCIDs, multiSeatPIDs } = useMemo(() => {
    const counts = new Map<string, number>();
    initialCandidates.forEach(c => {
      counts.set(c.constituencyId, (counts.get(c.constituencyId) || 0) + 1);
    });

    const personSeats = new Map<string, Set<string>>();
    initialCandidates.forEach(c => {
      if (!c.personId) return;
      if (!personSeats.has(c.personId)) personSeats.set(c.personId, new Set());
      personSeats.get(c.personId)!.add(c.constituencyId);
    });

    const mcCIDs = new Set<string>();
    counts.forEach((count, cid) => {
      if (count >= 3) mcCIDs.add(cid);
    });

    const msPIDs = new Set<string>();
    personSeats.forEach((seats, pid) => {
      if (seats.size > 1) msPIDs.add(pid);
    });

    return { multiCornerCIDs: mcCIDs, multiSeatPIDs: msPIDs };
  }, [initialCandidates]);

  const filteredCandidates = useMemo(() => {
    const filtered = initialCandidates.filter(c => {
      const matchSearch = searchTerm === "" ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.constituencyName.toLowerCase().includes(searchTerm.toLowerCase());

      // Helper for multi-select (comma separated values in filter string)
      const multiMatch = (filterVal: string, itemVal: string | undefined | null) => {
        if (filterVal === "All") return true;
        if (!itemVal) return false;
        const selected = filterVal.split(',');
        return selected.includes(itemVal);
      };

      const matchParty = multiMatch(partyFilter, c.partyId);
      const matchDistrict = multiMatch(districtFilter, c.districtId);
      const matchConstituency = multiMatch(constituencyFilter, c.constituencyId);

      let matchStatus = true;
      if (candidateTypeFilter !== "All") {
        const selectedTypes = candidateTypeFilter.split(',');
        matchStatus = selectedTypes.some(type => {
          if (type === "Incumbent") return !!c.isIncumbent;
          if (type === "Newcomer") return !!c.isNewcomer;
          return false;
        });
      }

      const matchEducation = multiMatch(educationFilter, c.education);
      
      let matchContestType = true;
      if (contestTypeFilter !== "All") {
        const selected = contestTypeFilter.split(',');
        matchContestType = selected.some(type => {
          if (type === "multi_corner") return multiCornerCIDs.has(c.constituencyId);
          if (type === "multi_seat") return multiSeatPIDs.has(c.personId || "");
          return c.constituencyContestType === type;
        });
      }

      let matchMultiSeat = true;
      if (multiSeatFilter === "Yes") {
        matchMultiSeat = multiSeatPIDs.has(c.personId || "");
      }

      return matchSearch && matchParty && matchDistrict && matchConstituency && matchStatus && matchEducation && matchContestType && matchMultiSeat;
    });

    // Handle Sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'assets':
          comparison = (a.totalAssets || 0) - (b.totalAssets || 0);
          break;
        case 'age':
          comparison = (a.age || 0) - (b.age || 0);
          break;
        case 'cases':
          comparison = (a.criminalCases || 0) - (b.criminalCases || 0);
          break;
        case 'constituency':
        default:
          comparison = a.constituencyName.localeCompare(b.constituencyName);
          if (comparison === 0) {
            comparison = getPartyRank(a.partyShortName) - getPartyRank(b.partyShortName);
          }
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [initialCandidates, searchTerm, partyFilter, districtFilter, constituencyFilter, candidateTypeFilter, educationFilter, contestTypeFilter, sortBy, sortOrder]);

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
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
      <div className="relative group">
        <select
          className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer transition-all hover:bg-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="All">All {label}</option>
          {options.map((opt, idx) => (
            <option key={`${opt.value}-${idx}`} value={opt.value}>
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
          {(searchTerm || partyFilter !== "All" || districtFilter !== "All" || constituencyFilter !== "All" || candidateTypeFilter !== "All" || educationFilter !== "All" || contestTypeFilter !== "All") && (
            <button
              onClick={resetFilters}
              className="group flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
            >
              <X size={14} className="group-hover:rotate-90 transition-transform" /> Clear All
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl border transition-all shadow-sm ${showAdvanced ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <Filter size={14} /> {showAdvanced ? 'Hide Filters' : 'More Filters'}
          </button>
        </div>
      </div>

      {/* Result Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-4 px-6 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-brand-dark uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
            {filteredCandidates.length} Candidates
          </span>
          { (partyFilter !== "All" || districtFilter !== "All" || candidateTypeFilter !== "All") && (
            <div className="h-4 w-px bg-slate-200 hidden md:block" />
          )}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {partyFilter !== "All" && <span>• {partyFilter}</span>}
            {districtFilter !== "All" && <span>• {districtFilter}</span>}
            {candidateTypeFilter !== "All" && <span>• {candidateTypeFilter}</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Sort By:</label>
             <select 
               className="bg-transparent text-xs font-black text-brand-dark focus:outline-none cursor-pointer border-b-2 border-brand-gold/30 pb-0.5"
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
             >
               <option value="constituency">Constituency</option>
               <option value="assets">Assets (High ➝ Low)</option>
               <option value="age">Age</option>
               <option value="cases">Criminal Cases</option>
             </select>
             <button 
               onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
               className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
               title={`Currently ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
             >
               <ChevronDown size={14} className={`text-brand-dark transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
             </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(partyFilter !== "All" || districtFilter !== "All" || constituencyFilter !== "All" || candidateTypeFilter !== "All" || educationFilter !== "All" || contestTypeFilter !== "All") && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
          {partyFilter !== "All" && partyFilter.split(',').map(p => (
            <button key={`chip-party-${p}`} onClick={() => setPartyFilter("All")} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 transition-all shadow-sm group">
              Party: {p} <X size={10} className="text-slate-400 group-hover:text-rose-500" />
            </button>
          ))}
          {districtFilter !== "All" && (
            <button onClick={() => setDistrictFilter("All")} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 transition-all shadow-sm group">
              District: {districtFilter} <X size={10} className="text-slate-400 group-hover:text-rose-500" />
            </button>
          )}
          {constituencyFilter !== "All" && (
            <button onClick={() => setConstituencyFilter("All")} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 transition-all shadow-sm group">
              Seat: {constituencyFilter} <X size={10} className="text-slate-400 group-hover:text-rose-500" />
            </button>
          )}
          {candidateTypeFilter !== "All" && (
            <button onClick={() => setCandidateTypeFilter("All")} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 transition-all shadow-sm group">
              Type: {candidateTypeFilter} <X size={10} className="text-slate-400 group-hover:text-rose-500" />
            </button>
          )}
          {contestTypeFilter !== "All" && (
            <button onClick={() => setContestTypeFilter("All")} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 transition-all shadow-sm group">
              Contest: {contestTypeFilter === 'multi_corner' ? 'Multi-Corner' : contestTypeFilter === 'multi_seat' ? 'Multi-Seat' : contestTypeFilter.replace('_', ' ')} <X size={10} className="text-slate-400 group-hover:text-rose-500" />
            </button>
          )}
          {multiSeatFilter === "Yes" && (
            <button onClick={() => setMultiSeatFilter("All")} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 transition-all shadow-sm group">
              Multi-Seat Only <X size={10} className="text-slate-400 group-hover:text-rose-500" />
            </button>
          )}
        </div>
      )}

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
          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-end animate-in fade-in slide-in-from-top-4 duration-300">
            <FilterSelect
              label="Candidate Type"
              value={candidateTypeFilter}
              options={[
                { label: 'Incumbents', value: 'Incumbent' },
                { label: 'Newcomers', value: 'Newcomer' }
              ]}
              onChange={setCandidateTypeFilter}
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
            <FilterSelect
              label="Multi-Seat Strategy"
              value={multiSeatFilter}
              options={[
                { label: 'Multi-Seat Candidates', value: 'Yes' }
              ]}
              onChange={setMultiSeatFilter}
            />
          </div>
        )}
      </div>

      {/* Mobile Filter Trigger */}
      <div className="lg:hidden flex items-center justify-between gap-4">
        <button 
          onClick={() => setIsFilterDrawerOpen(true)}
          className="flex-grow flex items-center justify-center gap-3 bg-brand-dark text-white px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-dark/20"
        >
          <Filter size={16} /> Filter Results
        </button>
        <button 
          onClick={resetFilters}
          className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-rose-500 shadow-lg"
        >
          <X size={20} />
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" onClick={() => setIsFilterDrawerOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[3rem] p-8 space-y-8 animate-in slide-in-from-bottom-full duration-500 shadow-2xl min-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-brand-dark uppercase italic">Apply Filters</h3>
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Candidate Search</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search name or constituency..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all hover:bg-white"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <FilterSelect label="Parties" value={partyFilter} options={filterOptions.parties} onChange={setPartyFilter} />
              <FilterSelect label="Districts" value={districtFilter} options={filterOptions.districts} onChange={setDistrictFilter} />
              <FilterSelect label="Constituencies" value={constituencyFilter} options={filterOptions.constituencies} onChange={setConstituencyFilter} />
              <FilterSelect label="Candidate Type" value={candidateTypeFilter} options={[{ label: 'Incumbents', value: 'Incumbent' }, { label: 'Newcomers', value: 'Newcomer' }]} onChange={setCandidateTypeFilter} />
              <FilterSelect label="Contest Type" value={contestTypeFilter} options={filterOptions.contestTypes} onChange={setContestTypeFilter} />
            </div>

            <button 
              onClick={() => setIsFilterDrawerOpen(false)}
              className="w-full py-5 bg-brand-gold text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-gold/20"
            >
              Show {filteredCandidates.length} Results
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-auto hidden lg:block max-h-[800px] custom-scrollbar">
        <table className="w-full text-left border-collapse relative">
          <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100">
            <tr>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-[35%]">Candidate Profile</th>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l border-slate-50">Location</th>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l border-slate-50">Party</th>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l border-slate-50">Affidavit</th>
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l border-slate-50">Intelligence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCandidates.length > 0 ? filteredCandidates.slice(0, 100).map((c, idx) => (
              <tr key={`${c.id}-${idx}`} className="group hover:bg-brand-gold/[0.02] transition-colors border-b border-slate-50 last:border-0">
                <td className="py-6 px-8">
                  <div className="flex items-center gap-5">
                    <Link href={`/tn/mla/${c.personId}`} className="relative block shrink-0">
                      <div className="relative">
                        {c.profilePic ? (
                          <img
                            src={c.profilePic}
                            alt={c.name}
                            className="w-14 h-14 rounded-2xl object-cover bg-slate-100 border border-slate-100 group-hover:scale-105 transition-transform shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                            <User size={24} />
                          </div>
                        )}
                        {c.isIncumbent && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-gold rounded-full border-2 border-white shadow-sm flex items-center justify-center" title="Incumbent">
                             <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="space-y-1">
                      <Link
                        href={`/tn/mla/${c.personId}`}
                        className="text-lg font-black text-brand-dark uppercase tracking-tight italic hover:text-brand-gold transition-colors block leading-tight"
                      >
                        {c.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 self-start px-2 py-0.5 rounded-lg border border-slate-100">
                        <span>{c.age ? `${c.age} Yrs` : 'Age N/A'}</span>
                        {c.gender && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{c.gender}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-8 border-l border-slate-50">
                  <div className="space-y-1">
                    <Link 
                      href={`/tn/constituency/${c.constituencyId}`}
                      className="font-bold text-slate-700 hover:text-brand-gold transition-colors block"
                    >
                      {c.constituencyName}
                    </Link>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.districtName}</p>
                  </div>
                </td>
                <td className="py-6 px-8 border-l border-slate-50">
                   <div className="scale-110 origin-left">
                    <PartyBadge
                      party={c.partyShortName || "IND"}
                      colorBg={c.partyColorBg}
                      colorText={c.partyColorText}
                      colorBorder={c.partyColorBorder}
                      logoUrl={c.partyLogoUrl}
                    />
                  </div>
                </td>
                <td className="py-6 px-8 border-l border-slate-50">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Net Assets</span>
                        <div className="flex items-center gap-1 text-emerald-600">
                          <IndianRupee size={12} className="shrink-0" />
                          <span className="text-xs font-black">{c.totalAssets ? `₹${(c.totalAssets / 10000000).toFixed(1)}Cr` : '--'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Cases</span>
                        <div className={`flex items-center gap-1 ${c.criminalCases && c.criminalCases > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                          <Gavel size={12} className="shrink-0" />
                          <span className="text-xs font-black">{c.criminalCases || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 self-start">
                      <GraduationCap size={12} className="shrink-0" />
                      <span className="text-[9px] font-bold truncate max-w-[120px]" title={c.education || 'N/A'}>{c.education || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-8 border-l border-slate-50">
                  <div className="flex flex-wrap gap-2 items-start max-w-[200px]">
                    {[
                      c.isIncumbent && (
                        <span key="incumbent" className="bg-brand-gold text-white border border-brand-gold px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                          INCUMBENT
                        </span>
                      ),
                      c.isNewcomer && (
                        <span key="newcomer" className="bg-brand-dark/5 text-brand-dark border border-brand-dark/10 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                          NEWCOMER
                        </span>
                      ),
                      c.constituencyContestType === 'cross_constituency' && (
                        <span key="cross" className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                          Cross-Constituency
                        </span>
                      ),
                      multiSeatPIDs.has(c.personId || "") && (
                        <span key="multi-seat" className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                          MULTI-SEAT
                        </span>
                      )
                    ].filter(Boolean).slice(0, 3)}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-32 text-center">
                  <div className="max-w-xs mx-auto space-y-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100 shadow-inner">
                      <Search size={40} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-brand-dark font-black uppercase tracking-[0.2em] text-lg">No matches found</p>
                      <p className="text-slate-400 text-sm font-medium">Try adjusting your filters or resetting the search to see more candidates.</p>
                    </div>
                    <button 
                      onClick={resetFilters} 
                      className="inline-flex items-center gap-2 bg-brand-gold text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-gold/90 transition-all shadow-lg shadow-brand-gold/20"
                    >
                      <X size={16} /> Reset All Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile view Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:hidden">
        {filteredCandidates.length > 0 ? filteredCandidates.slice(0, 30).map((c, idx) => (
          <div key={`${c.id}-${idx}`} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex gap-5">
                <Link href={`/tn/mla/${c.personId}`} className="relative shrink-0">
                  {c.profilePic ? (
                    <img src={c.profilePic} className="w-16 h-16 rounded-[1.25rem] object-cover ring-2 ring-white shadow-md" alt={c.name} />
                  ) : (
                    <div className="w-16 h-16 rounded-[1.25rem] bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-100 ring-2 ring-white shadow-md">
                      <User size={24} />
                    </div>
                  )}
                  {c.isIncumbent && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-gold rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </Link>
                <div className="space-y-1.5 pt-1">
                  <Link
                    href={`/tn/mla/${c.personId}`}
                    className="text-xl font-black text-brand-dark uppercase italic tracking-tight hover:text-brand-gold transition-colors block leading-none"
                  >
                    {c.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/tn/constituency/${c.constituencyId}`}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-gold"
                    >
                      {c.constituencyName}
                    </Link>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{c.age} Yrs</span>
                  </div>
                </div>
              </div>
              <div className="scale-90 origin-right">
                <PartyBadge
                  party={c.partyShortName || "IND"}
                  colorBg={c.partyColorBg}
                  colorText={c.partyColorText}
                  colorBorder={c.partyColorBorder}
                  logoUrl={c.partyLogoUrl}
                />
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Affididat Overview</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
                    <IndianRupee size={12} />
                    <span>{c.totalAssets ? `₹${(c.totalAssets / 10000000).toFixed(1)}Cr` : '--'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-black ${c.criminalCases ? 'text-rose-500' : 'text-slate-400'}`}>
                    <Gavel size={12} />
                    <span>{c.criminalCases || 0} Cases</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Education</p>
                <div className="flex items-start gap-1.5 pt-0.5">
                  <GraduationCap size={14} className="text-slate-400 shrink-0" />
                  <p className="text-[10px] font-bold text-slate-600 leading-tight line-clamp-2">{c.education || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap gap-2 pt-2">
              {c.isIncumbent && (
                <span className="bg-brand-gold text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md">
                  Incumbent
                </span>
              )}
              {c.isNewcomer && (
                <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider">
                  Newcomer
                </span>
              )}
              {c.constituencyContestType === 'cross_constituency' && (
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border border-indigo-100 shadow-sm">
                  Cross-Constituency
                </span>
              )}
              {multiSeatPIDs.has(c.personId || "") && (
                <span className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border border-purple-100 shadow-sm">
                  Multi-Seat
                </span>
              )}
            </div>
            
            <Link 
              href={`/tn/mla/${c.personId}`}
              className="relative z-10 block w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-brand-gold hover:text-white hover:border-brand-gold transition-all"
            >
              View Full Profile
            </Link>
          </div>
        )) : (
          <div className="py-20 text-center space-y-4">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
               <Search size={32} />
             </div>
             <p className="text-brand-dark font-black uppercase tracking-widest text-sm">No results match your filters</p>
             <button onClick={resetFilters} className="text-brand-gold font-black uppercase tracking-widest text-xs">Reset All</button>
          </div>
        )}
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
