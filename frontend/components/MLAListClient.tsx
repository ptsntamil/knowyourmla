"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { MLAListItem } from "@/types/models";
import Badge from "@/components/ui/Badge";
import SearchFilterBar from "./mla/SearchFilterBar";
import MLATable from "./mla/MLATable";

interface MLAListClientProps {
  initialMLAs: MLAListItem[];
}

export default function MLAListClient({ initialMLAs }: MLAListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState("All Parties");

  const parties = useMemo(() => {
    const uniqueParties = Array.from(new Set(initialMLAs.map((mla) => mla.party)));
    return ["All Parties", ...uniqueParties.sort()];
  }, [initialMLAs]);

  const filteredMLAs = useMemo(() => {
    return initialMLAs.filter((mla) => {
      const matchesSearch =
        mla.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mla.constituency.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesParty = selectedParty === "All Parties" || mla.party === selectedParty;

      return matchesSearch && matchesParty;
    });
  }, [initialMLAs, searchQuery, selectedParty]);

  const handleReset = () => {
    setSearchQuery("");
    setSelectedParty("All Parties");
  };

  return (
    <>
      <SearchFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedParty={selectedParty}
        setSelectedParty={setSelectedParty}
        parties={parties}
      />

      <div className="flex justify-between items-center mb-6">
        <Badge variant="outline" size="sm" dot className="border-none bg-transparent lowercase tracking-normal">
          Showing <span className="text-brand-dark mx-1 font-black">{filteredMLAs.length}</span> of {initialMLAs.length} MLAs
        </Badge>
        
        {(searchQuery || selectedParty !== "All Parties") && (
          <button
            onClick={handleReset}
            className="text-[10px] font-black uppercase tracking-widest text-brand-gold hover:text-brand-dark transition-colors flex items-center gap-2 group"
          >
            <X size={14} className="group-hover:rotate-90 transition-transform" /> Reset Filters
          </button>
        )}
      </div>

      <MLATable 
        mlas={filteredMLAs} 
        searchQuery={searchQuery} 
        selectedParty={selectedParty} 
        onReset={handleReset} 
      />
    </>
  );
}
