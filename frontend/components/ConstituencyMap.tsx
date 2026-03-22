"use client";

import { Maximize2 } from "lucide-react";

export default function ConstituencyMap() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-brand-dark text-xl">Constituency Map</h3>
        <button className="text-slate-400 hover:text-brand-dark transition-colors">
          <Maximize2 size={18} />
        </button>
      </div>
      <div className="relative w-full aspect-square bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center">
        {/* Mock Map Image */}
        <div className="absolute inset-0 bg-[#F7F3E9] opacity-50" />
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Tamil_Nadu_districts_map.svg/800px-Tamil_Nadu_districts_map.svg.png" 
          alt="Constituency Map" 
          className="max-w-[80%] max-h-[80%] object-contain mix-blend-multiply opacity-70 grayscale contrast-125"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <div className="w-12 h-12 bg-brand-green/20 rounded-lg border-2 border-brand-green animate-pulse" />
        </div>
        
        <div className="absolute bottom-2 right-2 text-[8px] text-slate-400 uppercase font-mono bg-white/80 px-1 py-0.5 rounded">
          Map data ©2026 | Terms of Use
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
            <button className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold rounded shadow-sm hover:bg-slate-50">+</button>
            <button className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold rounded shadow-sm hover:bg-slate-50">-</button>
        </div>
      </div>
    </div>
  );
}
