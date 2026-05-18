"use client";

import { useState, useMemo, Suspense } from "react";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { MLAListItem } from "@/types/models";
import Badge from "@/components/ui/Badge";
import SearchFilterBar from "./mla/SearchFilterBar";
import MLATable from "./mla/MLATable";

const EDUCATIONS = [
  "All Education",
  "Doctorate",
  "Professional",
  "Postgraduate",
  "Graduate",
  "Diploma",
  "Higher Secondary",
  "School",
  "Unknown"
];

interface MLAListClientProps {
  initialMLAs: MLAListItem[];
}

function MLAListClientContent({ initialMLAs }: MLAListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const urlEdu = searchParams.get("education") || "All Education";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState("All Parties");
  const [selectedEducation, setSelectedEducation] = useState(urlEdu);

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
      const matchesEducation = selectedEducation === "All Education" || mla.education === selectedEducation;

      return matchesSearch && matchesParty && matchesEducation;
    });
  }, [initialMLAs, searchQuery, selectedParty, selectedEducation]);

  const handleEducationChange = (val: string) => {
    setSelectedEducation(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val === "All Education") {
      params.delete("education");
    } else {
      params.set("education", val);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedParty("All Parties");
    setSelectedEducation("All Education");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("education");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <SearchFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedParty={selectedParty}
        setSelectedParty={setSelectedParty}
        parties={parties}
        selectedEducation={selectedEducation}
        setSelectedEducation={handleEducationChange}
        educations={EDUCATIONS}
      />

      <div className="flex justify-between items-center mb-6">
        <Badge variant="outline" size="sm" dot className="border-none bg-transparent lowercase tracking-normal">
          Showing <span className="text-brand-dark mx-1 font-black">{filteredMLAs.length}</span> of {initialMLAs.length} MLAs
        </Badge>
        
        {(searchQuery || selectedParty !== "All Parties" || selectedEducation !== "All Education") && (
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

export default function MLAListClient({ initialMLAs }: MLAListClientProps) {
  return (
    <Suspense fallback={<div className="h-20 flex items-center justify-center text-xs font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading Filters...</div>}>
      <MLAListClientContent initialMLAs={initialMLAs} />
    </Suspense>
  );
}
