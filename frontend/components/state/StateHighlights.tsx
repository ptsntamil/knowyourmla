import React from 'react';
import Link from 'next/link';
import { Users, Star, Trophy, ArrowUpRight, Vote } from 'lucide-react';
import { DistrictMLA } from '@/types/models';
import ProfileImage from '@/components/ProfileImage';

interface StateHighlightsProps {
  youngestMla: DistrictMLA | null;
  oldestMla: DistrictMLA | null;
  richestMla: DistrictMLA | null;
  highestMarginMla: DistrictMLA | null;
  highestVotesMla: DistrictMLA | null;
}

export default function StateHighlights({
  youngestMla,
  oldestMla,
  richestMla,
  highestMarginMla,
  highestVotesMla
}: StateHighlightsProps) {
  const highlights = [
    {
      title: 'Youngest MLA',
      mla: youngestMla,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      value: youngestMla ? `${youngestMla.age} Years Old` : '—'
    },
    {
      title: 'Oldest MLA',
      mla: oldestMla,
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      value: oldestMla ? `${oldestMla.age} Years Old` : '—'
    },
    {
      title: 'Richest MLA',
      mla: richestMla,
      icon: Trophy,
      color: 'text-brand-gold',
      bg: 'bg-brand-gold/10',
      value: richestMla ? richestMla.formattedAssets : '—'
    },
    {
      title: 'Highest Margin',
      mla: highestMarginMla,
      icon: ArrowUpRight,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      value: highestMarginMla ? `${highestMarginMla.margin?.toLocaleString()} Votes` : '—'
    },
    {
      title: 'Most Votes',
      mla: highestVotesMla,
      icon: Vote,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      value: highestVotesMla ? `${highestVotesMla.votes?.toLocaleString()} Total` : '—'
    }
  ];

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">

        {highlights.map((item, index) => (
          <HighlightCard key={index} {...item} />
        ))}
      </div>
    </section>

  );
}


function HighlightCard({ title, mla, icon: Icon, color, bg, value }: any) {
  if (!mla) return null;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:border-brand-gold/30 transition-all group min-w-0">
      <div className="p-6 md:p-7 space-y-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">{title}</p>
            <h3 className="text-lg md:text-xl font-black text-brand-dark tracking-tighter uppercase line-clamp-2 min-h-[1.2em]">
              {mla.name}
            </h3>
          </div>
          <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shadow-inner flex-shrink-0`}>
            <Icon size={20} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border-2 border-white shadow-md flex-shrink-0">
            <ProfileImage
              src={mla.image_url}
              alt={mla.name}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
          <div className="space-y-2 min-w-0 flex-1">
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">Highlight</p>
              <p className="text-base font-black text-brand-gold tracking-tight truncate">{value}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">Constituency</p>
              <p className="text-[11px] font-bold text-brand-dark uppercase truncate">{mla.constituency}</p>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-50 flex items-center justify-between gap-2 mt-auto">
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider shadow-sm truncate max-w-[50%]"
            style={{ 
              backgroundColor: mla.partyColor || '#f8fafc',
              color: mla.partyColorText || (mla.partyColor ? '#ffffff' : '#1e293b'),
              borderColor: mla.partyColorBorder || '#e2e8f0'
            }}
          >
            {mla.partyLogoUrl && (
              <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0">
                <img src={mla.partyLogoUrl} alt={mla.partyShort} className="w-2.5 h-2.5 object-contain" />
              </div>
            )}
            <span className="truncate">{mla.partyShort}</span>
          </div>
          <Link 
            href={`/tn/mla/${mla.slug}`}
            className="text-[9px] font-black text-slate-400 hover:text-brand-gold uppercase tracking-widest transition-colors flex-shrink-0"
          >
            Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}

