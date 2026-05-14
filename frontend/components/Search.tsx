"use client";

import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X, Loader2, MapPin, Users, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface SearchResult {
  id: string;
  name: string;
  type: "constituency" | "district" | "person";
  slug: string;
  image?: string;
  subtitle?: string;
}

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 3) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/v2/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults(data);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const getResultHref = (result: SearchResult) => {
    if (result.type === "district") return `/tn/districts/${result.slug}`;
    if (result.type === "constituency") return `/tn/constituency/${result.slug}`;
    if (result.type === "person") return `/tn/mla/${result.slug}`;
    return "#";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "district": return <Building2 size={14} className="text-blue-400" />;
      case "constituency": return <MapPin size={14} className="text-brand-gold" />;
      case "person": return <Users size={14} className="text-emerald-400" />;
      default: return null;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-xl flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        aria-label="Toggle Search"
      >
        <SearchIcon size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-96 bg-brand-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
          <div className="p-3 border-b border-white/5 flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search districts or constituencies..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {isLoading && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" />
              )}
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setQuery("");
              }}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {query.length > 0 && query.length < 3 && (
              <div className="p-8 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Type at least 3 characters
                </p>
              </div>
            )}

            {query.length >= 3 && !isLoading && results.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  No results found for "{query}"
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={getResultHref(result)}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group"
                  >
                    {result.type === "person" && result.image ? (
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                        <Image src={result.image} alt={result.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-brand-gold/30 transition-colors">
                        {getTypeIcon(result.type)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white group-hover:text-brand-gold transition-colors uppercase tracking-tight truncate">
                          {result.name}
                        </span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 text-slate-500 uppercase tracking-widest">
                          {result.type}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {query.length === 0 && (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <SearchIcon size={20} className="text-slate-500" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                  Search for constituencies<br />or districts
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
