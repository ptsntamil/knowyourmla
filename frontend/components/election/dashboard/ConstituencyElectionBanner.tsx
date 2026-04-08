import React from 'react';
import { Calendar, CheckCircle2, Info } from 'lucide-react';

interface ConstituencyElectionBannerProps {
  constituencyName: string;
  overlayStatus: 'live' | 'upcoming';
  tags: string[];
}

export default function ConstituencyElectionBanner({ 
  constituencyName, 
  overlayStatus, 
  tags 
}: ConstituencyElectionBannerProps) {
  const isLive = overlayStatus === 'live';

  return (
    <div className="relative overflow-hidden bg-brand-dark rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-brand-dark/20 group">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-brand-gold/20 transition-all duration-700"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-green/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
              isLive ? 'bg-brand-green/20 text-brand-green border border-brand-green/20' : 'bg-brand-gold/20 text-brand-gold border border-brand-gold/20'
            }`}>
              {isLive ? (
                <>
                  <CheckCircle2 size={12} />
                  Candidate Announcements Live
                </>
              ) : (
                <>
                  <Calendar size={12} />
                  Upcoming 2026 Election
                </>
              )}
            </div>
            
            {tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-white/60 border border-white/10 text-[10px] font-black uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
            Tamil Nadu 2026 — <span className="text-brand-gold">{constituencyName}</span>
          </h1>
          
          <p className="text-white/60 font-medium text-sm md:text-base max-w-2xl leading-relaxed">
            {isLive 
              ? `Live intelligence and candidate analysis for the ${constituencyName} Assembly contest. Explore announced nominees, incumbent status, and financial profiles.`
              : `Candidate announcements for ${constituencyName} are currently awaited. Track historical context and upcoming contest patterns below.`
            }
          </p>
        </div>

        {!isLive && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-3xl flex items-center gap-4 max-w-xs transition-all hover:bg-white/10">
            <Info className="text-brand-gold shrink-0" size={24} />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Status</p>
              <p className="text-xs font-bold text-white/80 leading-snug italic">Check back for updates as party nominations are released.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
