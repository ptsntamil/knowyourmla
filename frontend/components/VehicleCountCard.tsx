"use client";

import { useState } from "react";
import { Car, X, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";

export default function VehicleCountCard({ vehicleCount, vehicleAssets }: { vehicleCount: number, vehicleAssets: any }) {
  const [isOpen, setIsOpen] = useState(false);

  // Extract all vehicles for the modal
  let allVehicles: any[] = [];
  if (vehicleAssets && typeof vehicleAssets === 'object') {
    Object.entries(vehicleAssets).forEach(([owner, val]) => {
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (v && typeof v === 'object' && (v.name || v.registration_no || v.value)) {
             allVehicles.push({ ...v, owner });
          } else if (typeof v === 'string' && v.trim() && v.toLowerCase() !== 'nil' && v.toLowerCase() !== 'none') {
             allVehicles.push({ name: v, owner });
          }
        });
      } else if (typeof val === 'string' && val.trim() && val.toLowerCase() !== 'nil' && val.toLowerCase() !== 'none') {
         allVehicles.push({ name: val, owner });
      } else if (val && typeof val === 'object' && (val.name || val.registration_no || val.value)) {
         allVehicles.push({ ...val, owner });
      }
    });
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="relative text-left w-full bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group cursor-pointer"
      >
<div className="absolute top-3 right-3 bg-blue-50 p-1.5 rounded-full text-blue-500 group-hover:bg-blue-100 group-hover:scale-110 shadow-sm border border-blue-100/50 transition-all duration-300 animate-pulse group-hover:animate-none">
            <Info size={18} strokeWidth={2.5} />
         </div>
         <div className="p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-500 rounded-2xl flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors">
            <Car size={24} />
         </div>
         <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Vehicles</span>
            <span className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase truncate">
              {vehicleCount} {vehicleCount === 1 ? 'Vehicle' : 'Vehicles'}
            </span>
         </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "85vh" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex-shrink-0 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Car size={20} />
                </div>
                <div>
                  <h3 className="font-black text-brand-dark text-lg">Declared Vehicles</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Election Affidavit Details</p>
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
              {allVehicles.length > 0 ? (
                <div className="space-y-4">
                  {allVehicles.map((v, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-brand-dark">{v.name || v.raw_text || "Unnamed Vehicle"}</h4>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-500">
                          {v.owner}
                        </span>
                      </div>
                      {v.registration_no && (
      <div className="text-sm text-slate-500 mt-1">
                          <span className="font-semibold text-slate-400 mr-2">REG:</span>
                          <span className="uppercase">{v.registration_no}</span>
                        </div>
                      )}
                      {v.value && (
      <div className="text-sm font-bold text-slate-700 mt-2">
                          <span className="text-slate-400 mr-1">Value:</span> 
                          {typeof v.value === 'number' ? `₹${v.value.toLocaleString('en-IN')}` : v.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
<div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car size={32} />
                  </div>
                  <h4 className="font-black text-slate-400 uppercase tracking-widest">No Vehicles Declared</h4>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 flex-shrink-0 bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">As declared in the latest election affidavit.</p>
              <Link 
                href="/tn/vehicles" 
                className="text-xs font-black uppercase tracking-widest text-brand-gold hover:text-brand-dark transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View State Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
