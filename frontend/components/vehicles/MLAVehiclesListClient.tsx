"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Car, Bike, Truck, Tractor, CircleHelp, Filter, MapPin, ArrowUpDown } from "lucide-react";
import { MLAVehicleItem } from "@/types/models";
import Badge from "@/components/ui/Badge";
import PartyBadge from "@/components/ui/PartyBadge";
import Link from "next/link";
import { extractVehicles } from "./VehicleUtils";

interface MLAVehiclesListClientProps {
  initialData: MLAVehicleItem[];
}

export default function MLAVehiclesListClient({ initialData }: MLAVehiclesListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState("All Parties");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [expandedMla, setExpandedMla] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Pre-process vehicles for each MLA
  const mlasWithVehicles = useMemo(() => {
    return initialData.map(mla => {
      const vehicles = extractVehicles(mla);
      return {
        ...mla,
        vehicles,
        totalVehicles: vehicles.length,
        has4Wheeler: vehicles.some(v => v.category === "4-Wheeler"),
        has2Wheeler: vehicles.some(v => v.category === "2-Wheeler"),
        hasHeavy: vehicles.some(v => v.category === "Heavy/Commercial"),
        hasTractor: vehicles.some(v => v.name?.toLowerCase().includes("tractor") || v.raw_text?.toLowerCase().includes("tractor") || v.name?.toLowerCase().includes("jcb") || v.raw_text?.toLowerCase().includes("jcb")),

      };
    });
  }, [initialData]);

  const allParties = useMemo(() => {
    const parties = new Set<string>();
    initialData.forEach(m => {
      if (m.party) parties.add(m.party);
    });
    return ["All Parties", ...Array.from(parties).sort()];
  }, [initialData]);

  const allDistricts = useMemo(() => {
    const districts = new Set<string>();
    initialData.forEach(m => {
      if (m.district) districts.add(m.district);
    });
    return ["All Districts", ...Array.from(districts).sort()];
  }, [initialData]);

  const filteredMlas = useMemo(() => {
    return mlasWithVehicles.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.constituency || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.vehicles.some(v => (v.name || "").toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesParty = selectedParty === "All Parties" || m.party === selectedParty;
      const matchesDistrict = selectedDistrict === "All Districts" || m.district === selectedDistrict;

      return matchesSearch && matchesParty && matchesDistrict;
    }).sort((a, b) => sortOrder === "desc" ? b.totalVehicles - a.totalVehicles : a.totalVehicles - b.totalVehicles);
  }, [mlasWithVehicles, searchQuery, selectedParty, selectedDistrict, sortOrder]);

  // Aggregate stats
  const stats = useMemo(() => {
    let twoWheelers = 0;
    let fourWheelers = 0;
    let heavy = 0;
    let others = 0;
    let totalVehicles = 0;
    let mlasWithNoVehicle = 0;

    filteredMlas.forEach(m => {
      if (m.vehicles.length === 0) mlasWithNoVehicle++;
      m.vehicles.forEach(v => {
        totalVehicles++;
        if (v.category === "2-Wheeler") twoWheelers++;
        else if (v.category === "4-Wheeler") fourWheelers++;
        else if (v.category === "Heavy/Commercial") heavy++;
        else others++;
      });
    });

    return { totalVehicles, twoWheelers, fourWheelers, heavy, others, mlasWithNoVehicle };
  }, [filteredMlas]);

  const toggleExpand = (personId: string) => {
    setExpandedMla(expandedMla === personId ? null : personId);
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Vehicles" value={stats.totalVehicles} icon={<Car className="w-5 h-5 opacity-50" />} />
        <StatCard title="4-Wheelers (Cars/SUVs)" value={stats.fourWheelers} icon={<Car className="w-5 h-5 text-blue-500" />} />
        <StatCard title="2-Wheelers (Bikes)" value={stats.twoWheelers} icon={<Bike className="w-5 h-5 text-green-500" />} />
        <StatCard title="Heavy/Commercial" value={stats.heavy} icon={<Truck className="w-5 h-5 text-orange-500" />} />
        <StatCard title="Others" value={stats.others} icon={<CircleHelp className="w-5 h-5 text-slate-500" />} />
        <StatCard title="No Vehicle Declared" value={stats.mlasWithNoVehicle} icon={<CircleHelp className="w-5 h-5 text-red-500" />} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search MLA, constituency, or vehicle model..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer"
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
            >
              {allParties.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="relative flex-1 md:w-48">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              {allDistricts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* MLA List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4">MLA Info</th>
                <th className="p-4 hidden md:table-cell">Constituency & District</th>
                <th className="p-4 hidden sm:table-cell">Current Position</th>
                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")} title="Click to sort">
                  <div className="flex items-center justify-center gap-2">
                    Vehicles Count
                    <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMlas.map((mla) => (
                <MlaVehicleRow 
                  key={mla.constituency_id} 
                  mla={mla} 
                  isExpanded={expandedMla === mla.constituency_id}
                  onToggle={() => toggleExpand(mla.constituency_id)}
                />
              ))}
              {filteredMlas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No MLAs found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
  );
}

function MlaVehicleRow({ mla, isExpanded, onToggle }: { mla: any, isExpanded: boolean, onToggle: () => void }) {
  return (
    <>
      <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}>
        <td className="p-4">
          <div className="flex items-center gap-3">
            <Link href={`/tn/mla/${mla.slug}`} className="relative flex-shrink-0 block">
              {mla.image_url ? (
                <img src={mla.image_url} alt={mla.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-200 uppercase">
                  {mla.name.charAt(0)}
                </div>
              )}
              
            </Link>
            <div>
              <Link href={`/tn/mla/${mla.slug}`} className="font-bold text-slate-800 hover:text-brand-gold transition-colors block">
                {mla.name}
              </Link>
              <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                <PartyBadge party={mla.party} logoUrl={mla.party_logo_url} colorBg={mla.party_color_bg} colorText={mla.party_color_text} colorBorder={mla.party_color_border} size="xs" />
              </div>
            </div>
          </div>
        </td>
        <td className="p-4 hidden md:table-cell">
          <div className="font-medium text-slate-700">{mla.constituency}</div>
          <div className="text-sm text-slate-500">{mla.district}</div>
        </td>
        <td className="p-4 hidden sm:table-cell">
          <div className="text-sm text-slate-700 font-medium">
            {mla.current_position === "MLA" ? (
              <span className="text-slate-500">MLA</span>
            ) : (
              <span className="text-brand-gold font-bold">{mla.current_position}</span>
            )}
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-black text-slate-800">{mla.totalVehicles}</span>
            <div className="flex gap-1">
              {mla.has4Wheeler && <Car className="w-3.5 h-3.5 text-blue-500" title="4-Wheeler" />}
              {mla.has2Wheeler && <Bike className="w-3.5 h-3.5 text-green-500" title="2-Wheeler" />}
              {mla.hasTractor ? <Tractor className="w-3.5 h-3.5 text-amber-600" title="Tractor/JCB" /> : (mla.hasHeavy && <Truck className="w-3.5 h-3.5 text-orange-500" title="Heavy/Commercial" />)}
            </div>
          </div>
        </td>
        <td className="p-4 text-right">
          <button 
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {isExpanded ? "Hide" : "More Info"}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="p-0 border-b-2 border-brand-gold/20">
            <div className="bg-slate-50/80 p-6 border-t border-slate-100 shadow-inner">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-brand-gold" />
                Declared Vehicles for {mla.name}
              </h4>
              
              {mla.vehicles.length === 0 ? (
                <div className="text-slate-500 italic p-4 bg-white rounded-lg border border-slate-200">
                  No vehicles declared in the election affidavit.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {mla.vehicles.map((v: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-800">{v.name || "Unknown Model"}</span>
                          <Badge variant="outline" size="sm" className="capitalize">
                            {v.ownerType}
                          </Badge>
                        </div>
                        <div className="space-y-1 mb-4">
                          {v.vehicle && (
                            <div className="text-sm text-slate-600">
                              <span className="text-slate-400">Reg Num:</span> <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded font-mono">{v.vehicle}</span>
                            </div>
                          )}
                          <div className="text-sm text-slate-600">
                            <span className="text-slate-400">Category:</span> {v.category}
                          </div>
                          {v.raw_text && !v.vehicle && !v.name && (
                            <div className="text-sm text-slate-600 mt-2 p-2 bg-slate-50 rounded">
                              <span className="text-slate-400 block mb-1">Raw Declaration:</span> 
                              {v.raw_text}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Declared Value</span>
                        <span className="font-black text-slate-800">
                          {v.value ? `₹${Number(v.value).toLocaleString('en-IN')}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
