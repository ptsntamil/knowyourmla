"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronDown } from "lucide-react";

interface ElectionOption {
  year: number;
  name: string;
  id: string;
}

interface ElectionFilterProps {
  options: ElectionOption[];
}

export default function ElectionFilter({ options }: ElectionFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentElection = searchParams.get("election") || "all";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("election");
    } else {
      params.set("election", value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full bg-bg-page/80 py-4 border-b border-border-subtle sticky top-14 sm:top-16 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-bg-accent/10 text-text-accent rounded-xl shrink-0">
              <Filter size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">Election Filter</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Toggle specific datasets</p>
            </div>
          </div>

          <div className="relative w-full sm:w-80 group">
            <select
              value={currentElection}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-2xl px-5 py-3 text-xs font-black text-text-primary appearance-none cursor-pointer focus:ring-2 focus:ring-border-accent/20 focus:border-border-accent transition-all hover:border-border-accent/30 uppercase tracking-wider h-12"
            >
              <option value="all">📊 All Elections (Aggregated)</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.year}>
                  🗳️ {opt.name || opt.year}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-accent transition-colors">
              <ChevronDown size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
