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
  Target,
  Zap,
  ShieldCheck,
  ArrowRight,
  X,
  Trophy,
  MapPin,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { PollingStationAnalysis } from '@/lib/services/election-analytics.service';
import { PollingStationLookups } from '@/lib/repositories/polling-station.repository';
import PartyBadge from '@/components/ui/PartyBadge';

interface PollingStationTableProps {
  stations: PollingStationAnalysis[];
  constituencySlug: string;
  year: number;
  selectedCandidateIds: string[];
  selectedWinnerId?: string | null;
  onResetWinnerFilter?: () => void;
  lookups?: PollingStationLookups;
}

type SortKey = 'no' | 'turnout' | 'margin' | 'nota' | 'winner' | 'total' | string;
type SortOrder = 'asc' | 'desc';

const PollingStationTable: React.FC<PollingStationTableProps> = ({
  stations,
  constituencySlug,
  year,
  selectedCandidateIds,
  selectedWinnerId,
  onResetWinnerFilter,
  lookups
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRevenueVillage, setSelectedRevenueVillage] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [selectedPincode, setSelectedPincode] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');

  const [sortKey, setSortKey] = useState<SortKey>('no');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const ITEMS_PER_PAGE = 50;

  // 1. Revenue Village options
  const revenueVillageOptions = useMemo(() => {
    if (lookups?.local_bodies && lookups.local_bodies.length > 0) {
      const rvs = lookups.local_bodies.filter(lb => lb.is_revenue_village !== false);
      const list = rvs.length > 0 ? rvs : lookups.local_bodies;
      return list
        .map(lb => ({
          id: lb.id,
          name: lb.names[0] || lb.id,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Fallback: extract from stationDetail
    const map = new Map<string, string>();
    stations.forEach(s => {
      s.stationDetail?.areas?.forEach(a => {
        if (a.local_body_id && !map.has(a.local_body_id)) {
          map.set(a.local_body_id, a.local_body_name || a.local_body_canonical || a.local_body_id);
        }
      });
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lookups, stations]);

  // 2. Ward options (loaded after selecting revenue village)
  const wardOptions = useMemo(() => {
    if (!selectedRevenueVillage) return [];

    const wardSet = new Set<string>();

    if (lookups?.wards && lookups.wards[selectedRevenueVillage]) {
      Object.keys(lookups.wards[selectedRevenueVillage]).forEach(w => wardSet.add(w));
    }

    const lb = lookups?.local_bodies?.find(l => l.id === selectedRevenueVillage);
    if (lb?.wards) {
      lb.wards.forEach(w => wardSet.add(w));
    }

    stations.forEach(s => {
      const servesRV =
        s.stationDetail?.filters?.rv_ids?.includes(selectedRevenueVillage) ||
        s.stationDetail?.filters?.local_body_ids?.includes(selectedRevenueVillage) ||
        s.stationDetail?.areas?.some(a => a.local_body_id === selectedRevenueVillage);

      if (servesRV) {
        s.stationDetail?.areas?.forEach(a => {
          if (a.local_body_id === selectedRevenueVillage && a.ward_nos) {
            a.ward_nos.forEach(w => wardSet.add(w));
          }
        });
      }
    });

    return Array.from(wardSet).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });
  }, [selectedRevenueVillage, lookups, stations]);

  // 3. Pincode options (independent of Revenue Village)
  const pincodeOptions = useMemo(() => {
    const pinSet = new Set<string>();

    if (lookups?.pincodes) {
      Object.keys(lookups.pincodes).forEach(p => {
        if (p && p !== 'UNKNOWN' && /^\d{6}$/.test(p)) pinSet.add(p);
      });
    }

    if (lookups?.local_bodies) {
      lookups.local_bodies.forEach(lb => {
        lb.pincodes?.forEach(p => {
          if (p && p !== 'UNKNOWN' && /^\d{6}$/.test(p)) pinSet.add(p);
        });
      });
    }

    stations.forEach(s => {
      const bPin = s.stationDetail?.building?.pincode;
      if (bPin && bPin !== 'UNKNOWN' && /^\d{6}$/.test(bPin)) pinSet.add(bPin);

      const mPin = s.stationDetail?.pincode;
      if (mPin && mPin !== 'UNKNOWN' && /^\d{6}$/.test(mPin)) pinSet.add(mPin);

      s.stationDetail?.filters?.pincodes?.forEach(p => {
        if (p && p !== 'UNKNOWN' && /^\d{6}$/.test(p)) pinSet.add(p);
      });
    });

    return Array.from(pinSet).sort();
  }, [lookups, stations]);

  // Helper to clean locality string
  const cleanLocalityName = (str?: string) => {
    if (!str) return '';
    const cleaned = str
      .replace(/^(?:and|&)?\s*\((?:S\.?P|P)\)\s*/i, '')
      .replace(/^Ward\s*\d+\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || str.trim();
  };

  // 4. Area / Locality options (loaded after selecting revenue village)
  const areaOptions = useMemo(() => {
    if (!selectedRevenueVillage) return [];

    const areaMap = new Map<string, string>();

    stations.forEach(s => {
      const servesRV =
        s.stationDetail?.filters?.rv_ids?.includes(selectedRevenueVillage) ||
        s.stationDetail?.filters?.local_body_ids?.includes(selectedRevenueVillage) ||
        s.stationDetail?.areas?.some(a => a.local_body_id === selectedRevenueVillage);

      if (servesRV) {
        s.stationDetail?.areas?.forEach(a => {
          if (a.local_body_id === selectedRevenueVillage || !a.local_body_id) {
            const rawName = a.locality || a.local_body_name || a.raw_text;
            const cleaned = cleanLocalityName(rawName);
            const id = a.locality_id || cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleaned && id && !areaMap.has(id)) {
              areaMap.set(id, cleaned);
            }
          }
        });
      }
    });

    return Array.from(areaMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedRevenueVillage, stations]);

  const selectedRevenueVillageName = useMemo(() => {
    return revenueVillageOptions.find(rv => rv.id === selectedRevenueVillage)?.name || selectedRevenueVillage;
  }, [selectedRevenueVillage, revenueVillageOptions]);

  const selectedAreaName = useMemo(() => {
    return areaOptions.find(a => a.id === selectedArea)?.name || selectedArea;
  }, [selectedArea, areaOptions]);

  const handleRevenueVillageChange = (val: string) => {
    setSelectedRevenueVillage(val);
    setSelectedWard(''); // Ward is dependent on RV
    setSelectedArea(''); // Area is dependent on RV
    // Pincode is completely independent of RV, keep it intact
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedRevenueVillage('');
    setSelectedWard('');
    setSelectedPincode('');
    setSelectedArea('');
    if (onResetWinnerFilter) onResetWinnerFilter();
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedWinnerId ||
    selectedRevenueVillage ||
    selectedWard ||
    selectedPincode ||
    selectedArea
  );

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
    const result = stations.filter(s => {
      // 1. Text Search Query
      const q = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (q) {
        const psNoStr = s.pollingStationNo.toString().toLowerCase();
        const winner = s.winnerName.toLowerCase();
        const type = s.boothType.toLowerCase();
        const bldName = s.stationDetail?.building?.name?.toLowerCase() || '';
        const bldLoc = s.stationDetail?.building?.location?.toLowerCase() || '';
        const bldPin = s.stationDetail?.building?.pincode || '';
        const psName = s.pollingStationName?.toLowerCase() || '';
        const areasMatch = s.stationDetail?.areas?.some(a =>
          (a.locality && a.locality.toLowerCase().includes(q)) ||
          (a.local_body_name && a.local_body_name.toLowerCase().includes(q)) ||
          (a.raw_text && a.raw_text.toLowerCase().includes(q))
        );
        const searchKeywords = s.stationDetail?.search_text?.toLowerCase() || '';

        matchesSearch =
          psNoStr.includes(q) ||
          winner.includes(q) ||
          type.includes(q) ||
          bldName.includes(q) ||
          bldLoc.includes(q) ||
          bldPin.includes(q) ||
          psName.includes(q) ||
          Boolean(areasMatch) ||
          searchKeywords.includes(q);
      }

      // 2. Winner Filter
      const matchesWinner = !selectedWinnerId || s.winnerCandidateId === selectedWinnerId;

      // 3. Revenue Village Filter
      let matchesRV = true;
      if (selectedRevenueVillage) {
        const rvIds = s.stationDetail?.filters?.rv_ids || [];
        const lbIds = s.stationDetail?.filters?.local_body_ids || [];
        const inAreas = s.stationDetail?.areas?.some(a => a.local_body_id === selectedRevenueVillage);
        matchesRV = rvIds.includes(selectedRevenueVillage) || lbIds.includes(selectedRevenueVillage) || Boolean(inAreas);
      }

      // 4. Ward Filter
      let matchesWard = true;
      if (selectedWard) {
        const wardNos = s.stationDetail?.filters?.ward_nos || [];
        const wardKeys = s.stationDetail?.filters?.ward_keys || [];
        const inAreas = s.stationDetail?.areas?.some(a => a.ward_nos && a.ward_nos.includes(selectedWard));
        matchesWard =
          wardNos.includes(selectedWard) ||
          wardKeys.includes(`${selectedRevenueVillage}#${selectedWard}`) ||
          Boolean(inAreas);
      }

      // 5. Pincode Filter (independent of RV)
      let matchesPincode = true;
      if (selectedPincode) {
        const bPin = s.stationDetail?.building?.pincode;
        const mPin = s.stationDetail?.pincode;
        const pins = s.stationDetail?.filters?.pincodes || [];
        const inAreas = s.stationDetail?.areas?.some(a =>
          a.raw_text?.includes(selectedPincode)
        );
        matchesPincode =
          bPin === selectedPincode ||
          mPin === selectedPincode ||
          pins.includes(selectedPincode) ||
          Boolean(inAreas);
      }

      // 6. Area / Locality Filter (independent of RV)
      let matchesArea = true;
      if (selectedArea) {
        const locIds = s.stationDetail?.filters?.locality_ids || [];
        const inAreas = s.stationDetail?.areas?.some(a => {
          const rawName = a.locality || a.local_body_name || a.raw_text || '';
          const cleaned = cleanLocalityName(rawName);
          const id = a.locality_id || cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
          return (
            id === selectedArea ||
            a.locality_id === selectedArea ||
            cleaned.toLowerCase() === selectedArea.toLowerCase() ||
            rawName.toLowerCase().includes(selectedArea.toLowerCase())
          );
        });
        matchesArea = locIds.includes(selectedArea) || Boolean(inAreas);
      }

      return (
        matchesSearch &&
        matchesWinner &&
        matchesRV &&
        matchesWard &&
        matchesPincode &&
        matchesArea
      );
    });

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
          const shareA = a.candidateResults.find(r => r.candidateId === sortKey)?.voteShare || 0;
          const shareB = b.candidateResults.find(r => r.candidateId === sortKey)?.voteShare || 0;
          comparison = shareA - shareB;
        }
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [stations, searchQuery, sortKey, sortOrder, selectedWinnerId, selectedRevenueVillage, selectedWard, selectedPincode, selectedArea]);

  const totalPages = Math.ceil(filteredAndSortedStations.length / ITEMS_PER_PAGE);
  const paginatedStations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedStations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedStations, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedRows(new Set());
    window.scrollTo({
      top: document.getElementById('ps-table')?.offsetTop ? document.getElementById('ps-table')!.offsetTop - 100 : 0,
      behavior: 'smooth'
    });
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
          Granular Booth Analytics & Demarcation
        </h2>
        <p className="text-[#5C6773] text-sm md:text-lg leading-relaxed max-w-5xl font-medium">
          Comprehensive polling station directory and micro-level insights into <span className="text-[#0D1B2A] font-black">Election {year}</span> voter behavior. 
          Explore building details, revenue villages, ward boundaries, and voter demographics with multi-tier filters and search.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4">
        <div className="bg-[#F8F6F1] p-5 md:p-6 rounded-[2rem] border-2 border-[#F4B63D]/15 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* 1. Search Box */}
            <div className="relative sm:col-span-2 lg:col-span-3 xl:col-span-3 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7D8790] w-4 h-4 group-focus-within:text-[#F4B63D] transition-colors" />
              <input
                type="text"
                placeholder="Search booth, school, street..."
                className="w-full pl-11 pr-8 py-3.5 rounded-2xl bg-white border border-[#F4B63D]/20 focus:outline-none focus:ring-4 focus:ring-[#F4B63D]/10 focus:border-[#F4B63D] transition-all text-[#0D1B2A] font-bold text-xs md:text-sm placeholder-[#7D8790]/60 shadow-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* 2. Revenue Village Filter */}
            <div className="relative sm:col-span-1 lg:col-span-3 xl:col-span-3">
              <select
                value={selectedRevenueVillage}
                onChange={(e) => handleRevenueVillageChange(e.target.value)}
                className="w-full pl-4 pr-9 py-3.5 rounded-2xl bg-white border border-[#F4B63D]/20 focus:outline-none focus:ring-4 focus:ring-[#F4B63D]/10 focus:border-[#F4B63D] transition-all text-[#0D1B2A] font-bold text-xs md:text-sm appearance-none cursor-pointer truncate shadow-sm"
              >
                <option value="">All Revenue Villages ({revenueVillageOptions.length})</option>
                {revenueVillageOptions.map(rv => (
                  <option key={rv.id} value={rv.id}>{rv.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8790] pointer-events-none" />
            </div>

            {/* 3. Ward Filter (Loaded after selecting RV) */}
            <div className="relative sm:col-span-1 lg:col-span-2 xl:col-span-2">
              <select
                value={selectedWard}
                disabled={!selectedRevenueVillage}
                onChange={(e) => {
                  setSelectedWard(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-4 pr-8 py-3.5 rounded-2xl border transition-all font-bold text-xs md:text-sm appearance-none truncate shadow-sm ${
                  !selectedRevenueVillage
                    ? 'bg-slate-100/70 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-[#F4B63D]/20 text-[#0D1B2A] focus:outline-none focus:ring-4 focus:ring-[#F4B63D]/10 focus:border-[#F4B63D] cursor-pointer'
                }`}
                title={!selectedRevenueVillage ? 'Select a Revenue Village first to view wards' : undefined}
              >
                <option value="">
                  {selectedRevenueVillage
                    ? (wardOptions.length > 0 ? `All Wards (${wardOptions.length})` : 'No Wards')
                    : 'Ward (Select RV)'}
                </option>
                {wardOptions.map(w => (
                  <option key={w} value={w}>Ward {w}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8790] pointer-events-none" />
            </div>

            {/* 4. Area / Locality Filter (Loaded after selecting RV) */}
            <div className="relative sm:col-span-1 lg:col-span-2 xl:col-span-2">
              <select
                value={selectedArea}
                disabled={!selectedRevenueVillage}
                onChange={(e) => {
                  setSelectedArea(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-4 pr-8 py-3.5 rounded-2xl border transition-all font-bold text-xs md:text-sm appearance-none truncate shadow-sm ${
                  !selectedRevenueVillage
                    ? 'bg-slate-100/70 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-[#F4B63D]/20 text-[#0D1B2A] focus:outline-none focus:ring-4 focus:ring-[#F4B63D]/10 focus:border-[#F4B63D] cursor-pointer'
                }`}
                title={!selectedRevenueVillage ? 'Select a Revenue Village first to view areas' : undefined}
              >
                <option value="">
                  {selectedRevenueVillage
                    ? (areaOptions.length > 0 ? `All Areas (${areaOptions.length})` : 'No Areas')
                    : 'Area (Select RV)'}
                </option>
                {areaOptions.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8790] pointer-events-none" />
            </div>

            {/* 5. Pincode Filter (Independent of RV) */}
            <div className="relative sm:col-span-1 lg:col-span-2 xl:col-span-2">
              <select
                value={selectedPincode}
                onChange={(e) => {
                  setSelectedPincode(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-4 pr-8 py-3.5 rounded-2xl bg-white border border-[#F4B63D]/20 focus:outline-none focus:ring-4 focus:ring-[#F4B63D]/10 focus:border-[#F4B63D] transition-all text-[#0D1B2A] font-bold text-xs md:text-sm appearance-none cursor-pointer truncate shadow-sm"
              >
                <option value="">All PINs ({pincodeOptions.length})</option>
                {pincodeOptions.map(pin => (
                  <option key={pin} value={pin}>{pin}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8790] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filters Badges & Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-[#071120] rounded-xl border border-white/10 shadow-md">
              <div className="w-2 h-2 rounded-full bg-[#F4B63D] animate-pulse" />
              <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.15em]">
                {filteredAndSortedStations.length} of {stations.length} Stations Found
              </span>
            </div>

            {selectedRevenueVillage && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F4B63D]/15 text-[#071120] border border-[#F4B63D]/40 rounded-xl text-xs font-black shadow-sm">
                <span>Village: {selectedRevenueVillageName}</span>
                <button
                  onClick={() => handleRevenueVillageChange('')}
                  className="hover:text-red-700"
                  title="Remove village filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedWard && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F4B63D]/15 text-[#071120] border border-[#F4B63D]/40 rounded-xl text-xs font-black shadow-sm">
                <span>Ward: {selectedWard}</span>
                <button
                  onClick={() => setSelectedWard('')}
                  className="hover:text-red-700"
                  title="Remove ward filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedPincode && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F4B63D]/15 text-[#071120] border border-[#F4B63D]/40 rounded-xl text-xs font-black shadow-sm">
                <span>PIN: {selectedPincode}</span>
                <button
                  onClick={() => setSelectedPincode('')}
                  className="hover:text-red-700"
                  title="Remove pincode filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedArea && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F4B63D]/15 text-[#071120] border border-[#F4B63D]/40 rounded-xl text-xs font-black shadow-sm">
                <span>Area: {selectedAreaName}</span>
                <button
                  onClick={() => setSelectedArea('')}
                  className="hover:text-red-700"
                  title="Remove area filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedWinnerId && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-black shadow-sm">
                <span>Won by {stations.find(s => s.winnerCandidateId === selectedWinnerId)?.winnerName}</span>
                <button
                  onClick={onResetWinnerFilter}
                  className="hover:text-red-700"
                  title="Remove winner filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-black text-rose-600 hover:text-rose-800 uppercase tracking-wider transition-colors ml-auto py-1"
            >
              <RotateCcw size={13} />
              Reset All Filters
            </button>
          )}
        </div>
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
                  <th className="sticky left-0 z-50 bg-[#071120] p-6 font-black text-white text-[11px] uppercase tracking-[0.2em] w-48 border-r border-[#F4B63D]/20 shadow-2xl">
                    <button onClick={() => handleSort('no')} className="flex items-center gap-3 hover:text-[#F4B63D] transition-colors w-full">
                      Booth & Facility {sortKey === 'no' ? (sortOrder === 'asc' ? <ArrowUp size={16} className="text-[#F4B63D]" /> : <ArrowDown size={16} className="text-[#F4B63D]" />) : <ArrowUpDown size={16} className="opacity-20" />}
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
                        <div className="flex flex-col gap-1 min-w-[170px] max-w-[240px]">
                          <span className="text-sm font-black">
                            {station.pollingStationNo === 'POSTAL' ? (
                              <span className="text-[10px] uppercase tracking-widest font-black text-[#F4B63D]">POSTAL</span>
                            ) : (
                              `Booth ${station.pollingStationNo}`
                            )}
                          </span>
                          {station.stationDetail?.building?.name && (
                            <span className="text-[11px] font-bold text-slate-700 line-clamp-1" title={station.stationDetail.building.name}>
                              {station.stationDetail.building.name}
                            </span>
                          )}
                          {(station.stationDetail?.building?.location || station.stationDetail?.areas?.[0]?.local_body_name) && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <MapPin size={10} className="text-[#F4B63D] shrink-0" />
                              <span className="truncate">
                                {station.stationDetail.areas?.[0]?.local_body_name || station.stationDetail.building.location}
                                {station.stationDetail.building?.pincode ? ` - ${station.stationDetail.building.pincode}` : ''}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-6 text-right font-black text-[#0D1B2A] text-sm border-r border-[#F4B63D]/5">
                        {station.totalVotes > 0 ? station.totalVotes.toLocaleString() : '-'}
                      </td>
                      <td className="p-6 text-right border-r border-[#F4B63D]/5">
                        {station.turnoutPercentage !== null && station.turnoutPercentage > 0 ? (
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
                          <span className="text-[#7D8790]/40 text-[10px] font-black uppercase tracking-widest">N/A</span>
                        )}
                      </td>
                      <td className="p-6 text-right border-r border-[#F4B63D]/5">
                        {station.validVotes > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-rose-600 italic">+{station.notaVotes}</span>
                            <span className="text-[10px] font-black text-[#7D8790] uppercase">{station.notaPercentage.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Dynamic Candidate Cells */}
                      {selectedCandidateIds.map(cid => {
                        const res = station.candidateResults.find(r => r.candidateId === cid);
                        const isWinner = res?.candidateId === station.winnerCandidateId && station.winnerCandidateId !== 'TBD';
                        return (
                          <td key={cid} className={`p-6 text-center border-r border-[#F4B63D]/5 transition-all ${isWinner ? 'bg-[#F4B63D]/5' : ''}`}>
                            {res && station.validVotes > 0 ? (
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
                              <span className="text-slate-300">-</span>
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
                        <td colSpan={7 + selectedCandidateIds.length} className="bg-[#F8F6F1]/80 p-10 border-y-2 border-[#F4B63D]/20 shadow-inner relative space-y-8">
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F4B63D]" />

                          {/* ECI Polling Station Demarcation & Campus Card */}
                          {station.stationDetail && (
                            <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-[#F4B63D]/15 shadow-xl space-y-6">
                              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
                                <h4 className="text-base font-black text-[#0D1B2A] flex items-center gap-3 uppercase tracking-wider italic">
                                  <MapPin className="w-5 h-5 text-[#F4B63D]" />
                                  ECI Polling Station Demarcation & Facility Details
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    {station.stationDetail.station_type || 'All Voters'}
                                  </span>
                                  {station.stationDetail.has_overseas_electors && (
                                    <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                                      Overseas Electors
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
                                {/* Building Info */}
                                <div className="space-y-3">
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7D8790] block">
                                    Polling Station Building
                                  </span>
                                  <div className="bg-[#F8F6F1] p-5 rounded-2xl border border-[#F4B63D]/10 space-y-2.5">
                                    <p className="font-black text-sm text-[#0D1B2A]">
                                      {station.stationDetail.building?.name || station.pollingStationName}
                                    </p>
                                    {station.stationDetail.building?.wing_portion && (
                                      <p className="text-[#5C6773] font-bold text-xs">
                                        {station.stationDetail.building.wing_portion}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
                                      {station.stationDetail.building?.facing && (
                                        <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 uppercase">
                                          Facing: {station.stationDetail.building.facing}
                                        </span>
                                      )}
                                      {station.stationDetail.building?.location && (
                                        <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700">
                                          Location: {station.stationDetail.building.location}
                                        </span>
                                      )}
                                      {station.stationDetail.building?.pincode && (
                                        <span className="px-2.5 py-1 bg-[#F4B63D] text-[#071120] rounded-lg font-black">
                                          PIN: {station.stationDetail.building.pincode}
                                        </span>
                                      )}
                                    </div>
                                    {station.stationDetail.building?.raw_text && (
                                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-200/50">
                                        Source: {station.stationDetail.building.raw_text}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Areas Served */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7D8790]">
                                      Demarcated Areas Served ({station.stationDetail.areas?.length || 0})
                                    </span>
                                  </div>
                                  <div className="bg-[#F8F6F1] p-4 rounded-2xl border border-[#F4B63D]/10 max-h-56 overflow-y-auto custom-scrollbar space-y-2">
                                    {station.stationDetail.areas && station.stationDetail.areas.length > 0 ? (
                                      station.stationDetail.areas.map((area, aIdx) => (
                                        <div key={aIdx} className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-start justify-between gap-3 text-xs">
                                          <div className="min-w-0">
                                            <span className="font-black text-[#0D1B2A] block truncate">
                                              {area.locality || area.local_body_name}
                                            </span>
                                            {area.local_body_name && (
                                              <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                                                Revenue Village: {area.local_body_name} {area.is_revenue_village ? '(R.V)' : ''}
                                              </span>
                                            )}
                                          </div>
                                          {area.ward_nos && area.ward_nos.length > 0 && (
                                            <span className="px-2 py-0.5 bg-[#F4B63D]/20 text-[#071120] rounded text-[10px] font-black shrink-0">
                                              Ward {area.ward_nos.join(', ')}
                                            </span>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-slate-400 text-xs italic">Demarcated area list extracted from ECI Gazette.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Candidate Breakdown */}
                            <div className="lg:col-span-2 space-y-8">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <h4 className="text-base font-black text-[#0D1B2A] flex items-center gap-4 uppercase tracking-[0.2em] italic">
                                    <Target className="w-5 h-5 text-[#F4B63D]" />
                                    {station.pollingStationNo === 'POSTAL' ? 'Postal Aggregate Results' : 'Comprehensive Performance'}
                                  </h4>
                                  {station.pollingStationNo !== 'POSTAL' && station.pollingStationName && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-[#5C6773] mt-1 pl-9 uppercase tracking-wider">
                                      <MapPin size={12} className="text-[#F4B63D]" />
                                      <span>{station.pollingStationName}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="px-4 py-1.5 bg-[#071120] text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-white/10">
                                  {station.candidateResults.length} Candidates
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {station.candidateResults.map((res, i) => {
                                  const isWinner = res.candidateId === station.winnerCandidateId && station.winnerCandidateId !== 'TBD';
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
                                <div className={`grid ${station.electors ? 'grid-cols-3' : 'grid-cols-2'} gap-5`}>
                                  <div className="bg-[#071120] p-4 rounded-2xl border border-white/10 text-center shadow-2xl">
                                    <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Valid Votes</div>
                                    <div className="text-sm font-black text-white">{station.validVotes.toLocaleString()}</div>
                                  </div>
                                  {station.electors && (
                                    <div className="bg-[#071120] p-4 rounded-2xl border border-white/10 text-center shadow-2xl">
                                      <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Total Electors</div>
                                      <div className="text-sm font-black text-white">{station.electors.toLocaleString()}</div>
                                    </div>
                                  )}
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
                          onClick={handleClearAllFilters}
                          className="mt-6 px-10 py-4 bg-[#071120] text-[#F4B63D] rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#F4B63D] hover:text-[#071120] transition-all duration-500 shadow-2xl"
                        >
                          Reset Filters & Search
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
