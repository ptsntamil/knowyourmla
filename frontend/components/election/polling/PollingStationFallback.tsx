'use client';

import React from 'react';
import Link from 'next/link';
import { Search, MapPin, ArrowLeft, RefreshCcw } from 'lucide-react';

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

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Link 
          href={`/tn/constituency/${constituencySlug}/election/${year}`}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
        >
          <ArrowLeft size={18} /> Back to Constituency Results
        </Link>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCcw size={18} /> Retry
        </button>
      </div>

      <div className="pt-12 border-t border-slate-100 w-full text-slate-400 text-sm italic">
        We are constantly updating our dataset. Please check back later for detailed analytics.
      </div>
    </div>
  );
};

export default PollingStationFallback;
