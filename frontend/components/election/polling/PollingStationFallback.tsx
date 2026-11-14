'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, ArrowLeft, RefreshCcw, FileText, CheckCircle2 } from 'lucide-react';
import PollingRequestModal from './PollingRequestModal';

interface PollingStationFallbackProps {
  constituencyName: string;
  constituencySlug: string;
  year: number;
}

const PollingStationFallback: React.FC<PollingStationFallbackProps> = ({
  constituencyName,
  constituencySlug,
  year
}) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-8 max-w-2xl mx-auto">
      <div className="relative">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
          <Search className="w-10 h-10 text-slate-400" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 animate-bounce">
          <MapPin className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">
          Polling Station Results Not Available Yet
        </h1>
        <p className="text-slate-600 leading-relaxed">
          Polling station-wise election results for <strong>{constituencyName}</strong> constituency in <strong>{year}</strong> are not available in our database yet. Detailed booth-level vote share, turnout, and candidate performance will be published once official data becomes available.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full justify-center">
        <Link 
          href={`/tn/constituency/${constituencySlug}/election/${year}`}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          <ArrowLeft size={18} /> Back to Constituency Results
        </Link>
        <button 
          type="button"
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F4B63D] hover:bg-[#e0a430] text-[#071120] rounded-2xl font-bold transition-all shadow-md active:scale-95"
        >
          <FileText size={18} /> Raise Request
        </button>
        <button 
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <RefreshCcw size={18} /> Retry
        </button>
      </div>

      {hasRequested ? (
        <div className="w-full max-w-lg p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Request recorded for {constituencyName} ({year}) data. Thank you!</span>
        </div>
      ) : (
        <div className="w-full max-w-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-sm text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Need booth data for {constituencyName}?</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Raise a request with your name and email (optional) and we will prioritize it.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex-shrink-0 active:scale-95"
          >
            Raise Request
          </button>
        </div>
      )}

      <div className="pt-12 border-t border-slate-100 w-full text-slate-400 text-sm italic">
        We are constantly updating our dataset. Please check back later for detailed analytics.
      </div>

      <PollingRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => setHasRequested(true)}
        constituencyName={constituencyName}
        constituencySlug={constituencySlug}
        year={year}
      />
    </div>
  );
};

export default PollingStationFallback;
