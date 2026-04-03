"use client";

import { Maximize2 } from "lucide-react";

export default function ConstituencyMap() {
  return (
    <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-border-subtle h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-text-primary text-xl">Constituency Map</h3>
        <button className="text-text-muted hover:text-text-primary transition-colors">
          <Maximize2 size={18} />
        </button>
      </div>
      <div className="relative w-full aspect-square bg-bg-surface rounded-xl overflow-hidden flex items-center justify-center">
        {/* Mock Map Image */}
        <div className="absolute inset-0 bg-bg-page opacity-50" />
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Tamil_Nadu_districts_map.svg/800px-Tamil_Nadu_districts_map.svg.png" 
          alt="Constituency Map" 
          className="max-w-[80%] max-h-[80%] object-contain mix-blend-multiply opacity-70 grayscale contrast-125"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <div className="w-12 h-12 bg-bg-accent/20 rounded-lg border-2 border-border-accent animate-pulse" />
        </div>
        
        <div className="absolute bottom-2 right-2 text-[8px] text-text-muted uppercase font-mono bg-bg-card/80 px-1 py-0.5 rounded">
          Map data ©2026 | Terms of Use
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
            <button className="w-6 h-6 bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary font-bold rounded shadow-sm hover:bg-bg-card">+</button>
            <button className="w-6 h-6 bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary font-bold rounded shadow-sm hover:bg-bg-card">-</button>
        </div>
      </div>
    </div>
  );
}
