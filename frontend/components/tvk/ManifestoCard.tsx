import React from 'react';
import { ManifestoPromise } from '@/lib/data/manifesto';
import { Info } from 'lucide-react';

export const STATUS_CLASSES: Record<string, { bg: string, text: string }> = {
  "Implemented": { bg: "bg-brand-green/20", text: "text-brand-green" },
  "Partially Implemented": { bg: "bg-brand-gold/20", text: "text-brand-gold" },
  "Budget Allocated": { bg: "bg-brand-yellow/20", text: "text-brand-yellow" },
  "In Progress": { bg: "bg-brand-dark/10", text: "text-brand-dark" },
  "Pending": { bg: "bg-slate-200", text: "text-slate-600" },
  "Non-Measurable (Directive Standard)": { bg: "bg-brand-green-100", text: "text-brand-green-800" }
};

export default function ManifestoCard({ 
  promise, 
  onClick 
}: { 
  promise: ManifestoPromise, 
  onClick: (p: ManifestoPromise) => void 
}) {
  const isDirective = promise.Implementation_Status === "Non-Measurable (Directive Standard)";
  const classes = STATUS_CLASSES[promise.Implementation_Status] || STATUS_CLASSES["Pending"];

  return (
    <div 
      onClick={() => onClick(promise)}
      className="bg-white rounded-[2.5rem] shadow-sm border border-border p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
          {promise.Promise_ID} &middot; {promise.Category}
        </span>
        <div 
          className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${classes.bg} ${classes.text}`}
        >
          {isDirective && <Info size={12} />}
          {promise.Implementation_Status}
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-brand-dark mb-3 leading-tight uppercase tracking-wider">
        {promise.Promise_Title}
      </h3>
      
      <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-grow">
        {promise.Description}
      </p>
      
      <div className="pt-4 border-t border-border mt-auto">
        <p className="text-xs text-slate-500 mb-2">
          <span className="font-black text-brand-dark uppercase tracking-widest text-[9px] mr-2">Beneficiaries:</span> {promise.Target_Beneficiaries}
        </p>
        <p className="text-xs text-slate-500 truncate">
          <span className="font-black text-brand-dark uppercase tracking-widest text-[9px] mr-2">Instrument:</span> {promise.Policy_Instrument_or_Budget}
        </p>
      </div>
    </div>
  );
}
