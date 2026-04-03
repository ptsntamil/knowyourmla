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
    <div className="w-full bg-white/80 dark:bg-slate-900/80 py-4 border-b border-border/50 sticky top-14 sm:top-16 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-xl shrink-0">
              <Filter size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Election Filter</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle specific datasets</p>
            </div>
          </div>

          <div className="relative w-full sm:w-80 group">
            <select
              value={currentElection}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl px-5 py-3 text-xs font-black text-brand-dark dark:text-slate-200 appearance-none cursor-pointer focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all hover:border-brand-gold/30 uppercase tracking-wider h-12"
            >
              <option value="all">📊 All Elections (Aggregated)</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.year}>
                  🗳️ {opt.name || opt.year}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-brand-gold transition-colors">
              <ChevronDown size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
