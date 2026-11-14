"use client";

import { useState } from "react";
import { User, X, IndianRupee, Info } from "lucide-react";

export default function AssetBreakupCard({ totalAssets, assetBreakup }: { totalAssets?: string, assetBreakup?: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const getAmountStr = (val: any) => {
    if (typeof val === 'number') {
      return `₹${val.toLocaleString('en-IN')}`;
    }
    return val || "0";
  };

  const hasAnyData = (data: any) => {
    if (!data) return false;
    return Object.values(data).some(val => val && val !== 0 && val !== '0' && val !== '0.0');
  };

  const hasBreakup = assetBreakup && Object.values(assetBreakup).some(hasAnyData);

  return (
    <>
      <button 
        onClick={() => { if (hasBreakup) setIsOpen(true); }}
        className={`relative text-left w-full bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-all duration-200 group ${hasBreakup ? 'hover:shadow-md hover:scale-[1.02] cursor-pointer' : 'cursor-default'}`}
      >
         {hasBreakup && (
           <div className="absolute top-3 right-3 bg-brand-gold/10 p-1.5 rounded-full text-brand-gold group-hover:bg-brand-gold/20 group-hover:scale-110 shadow-sm transition-all duration-300 animate-pulse group-hover:animate-none">
              <Info size={18} strokeWidth={2.5} />
           </div>
         )}
         <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-2xl flex-shrink-0 group-hover:bg-brand-gold/20 transition-colors">
            <User size={24} />
         </div>
         <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Total Assets</span>
            <span className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase truncate" title={totalAssets || "₹ 0.00 Cr"}>
              {totalAssets || "₹ 0.00 Cr"}
            </span>
         </div>
      </button>

      {isOpen && hasBreakup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "85vh" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex-shrink-0 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-xl">
                  <IndianRupee size={20} />
                </div>
                <div>
                  <h3 className="font-black text-brand-dark text-lg">Asset Details</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">In Hand & Bank Deposits</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {['self', 'spouse', 'dependents'].map((owner) => {
                    const data = assetBreakup[owner];
                    // Skip rendering if no data, or if it's dependents and it's all zeros
                    if (!data) return null;
                    if (owner === 'dependents' && !hasAnyData(data)) return null;

                    return (
                      <div key={owner} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                          <h4 className="font-bold text-brand-dark uppercase text-sm tracking-wide">{owner}</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cash in Hand</span>
                            <span className="text-sm font-bold text-slate-700">{getAmountStr(data.cash_in_hand)}</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bank Deposits</span>
                            <span className="text-sm font-bold text-slate-700">{getAmountStr(data.bank_deposits)}</span>
                          </div>
                        </div>
                        
                        {(data.total_movable_assets || data.total_immovable_assets) && (
                           <div className="grid grid-cols-2 gap-4 mt-4">
                             <div className="bg-white p-3 rounded-xl border border-slate-100">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Movable</span>
                               <span className="text-sm font-bold text-slate-700">{getAmountStr(data.total_movable_assets)}</span>
                             </div>
                             <div className="bg-white p-3 rounded-xl border border-slate-100">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Immovable</span>
                               <span className="text-sm font-bold text-slate-700">{getAmountStr(data.total_immovable_assets)}</span>
                             </div>
                           </div>
                        )}
                      </div>
                    );
                  })}
                </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex-shrink-0 bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">As declared in the latest election affidavit.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
