import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ManifestoPromise } from '@/lib/data/manifesto';
import { STATUS_CLASSES } from './ManifestoCard';
import { X, Info, Calendar, FileText, FileSearch } from 'lucide-react';

interface ManifestoDrawerProps {
  promise: ManifestoPromise | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ManifestoDrawer({ promise, isOpen, onClose }: ManifestoDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !promise || !mounted) return null;

  const isDirective = promise.Implementation_Status === "Non-Measurable (Directive Standard)";
  const classes = STATUS_CLASSES[promise.Implementation_Status] || STATUS_CLASSES["Pending"];

  const drawerContent = (
    <div className="fixed inset-0 z-50 pointer-events-none flex" style={{ top: '64px' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-dark/40 transition-opacity backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute top-0 right-0 bottom-0 w-full max-w-xl bg-page-bg shadow-2xl transform transition-transform duration-300 overflow-y-auto border-l border-border flex flex-col rounded-tl-[2.5rem] pointer-events-auto">
        <div className="p-8 border-b border-border flex justify-between items-start sticky top-0 bg-page-bg/95 backdrop-blur-md z-10">
          <div>
            <div className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-2">
              {promise.Promise_ID} &middot; {promise.Category}
            </div>
            <h2 className="text-2xl font-bold text-brand-dark uppercase tracking-wider">{promise.Promise_Title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white hover:bg-slate-100 rounded-full transition-colors shadow-sm"
          >
            <X size={20} className="text-brand-dark" />
          </button>
        </div>

        <div className="p-8 flex-grow overflow-y-auto space-y-8">
          
          {/* Status Pill */}
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Current Status</h4>
            <div 
              className={`inline-flex px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase items-center gap-2 ${classes.bg} ${classes.text}`}
            >
              {isDirective && <Info size={16} />}
              {promise.Implementation_Status}
            </div>
            {isDirective && (
              <p className="mt-3 text-xs text-brand-green-800 bg-brand-green/10 p-3 rounded-xl">
                This is a Qualitative Policy Stance / Action Plan Directive. It does not have a measurable numeric target but represents a core administrative principle.
              </p>
            )}
          </div>

          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <FileText size={16} /> Details
            </h4>
            <p className="text-slate-700 text-sm leading-relaxed bg-white p-5 rounded-2xl shadow-sm">
              {promise.Description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-border p-5 rounded-2xl shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Beneficiaries</h4>
              <p className="text-sm font-bold text-brand-dark">{promise.Target_Beneficiaries}</p>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                <Calendar size={14} /> Timeline
              </h4>
              <p className="text-sm font-bold text-brand-dark">{promise.Effective_Date_or_Timeline}</p>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <FileSearch size={16} /> Policy Instrument & Budget Lines
            </h4>
            <div className="bg-brand-gold/10 border border-brand-gold/20 p-5 rounded-2xl shadow-sm">
              <p className="text-sm text-brand-dark font-bold">
                {promise.Policy_Instrument_or_Budget}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Historical & Policy Notes</h4>
            <div className="prose prose-sm max-w-none text-slate-600 bg-white border border-border p-5 rounded-2xl shadow-sm">
              {promise.Notes || "No additional historical notes available."}
            </div>
          </div>
          
        </div>
        
        <div className="p-6 border-t border-border bg-page-bg flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-brand-dark text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
