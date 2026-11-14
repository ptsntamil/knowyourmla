import React from 'react';

interface ExpenditureKpiCardsProps {
  partyCount: number;
  categoryCount: number;
}

export const ExpenditureKpiCards: React.FC<ExpenditureKpiCardsProps> = ({ partyCount, categoryCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 relative z-10">Reported Exp.</p>
        <p className="text-xl font-black text-brand-dark leading-tight relative z-10">Across available disclosures</p>
        <p className="text-xs text-slate-400 mt-2 relative z-10">Cannot aggregate mixed scopes</p>
      </div>
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 relative z-10">Parties Covered</p>
        <p className="text-4xl font-black text-brand-dark leading-none relative z-10">{partyCount}</p>
        <p className="text-xs text-slate-400 mt-3 relative z-10">Major recognized parties</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 relative z-10">Categories</p>
        <p className="text-4xl font-black text-brand-dark leading-none relative z-10">{categoryCount}</p>
        <p className="text-xs text-slate-400 mt-3 relative z-10">Unique spending categories</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 relative z-10">Period</p>
        <p className="text-xl font-black text-brand-dark leading-tight relative z-10">2026 Assembly Election</p>
        <p className="text-xs text-slate-400 mt-2 relative z-10">Reported to ECI</p>
      </div>
    </div>
  );
};
