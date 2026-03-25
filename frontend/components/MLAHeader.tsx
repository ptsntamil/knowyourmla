import { PersonDetail, ElectionHistoryRecord } from "@/types/models";
import { User, GraduationCap, Briefcase, AlertCircle } from "lucide-react";
import ProfileImage from "./ProfileImage";

interface MLAHeaderProps {
   person: PersonDetail;
   latestHistory?: ElectionHistoryRecord;
   criminalCases: number;
   totalAssets?: string;
   winRate: number;
}

export default function MLAHeader({ person, latestHistory, criminalCases, totalAssets, winRate }: MLAHeaderProps) {
   return (
      <div className="space-y-6">
         {/* Profile Card */}
         <div className="bg-brand-green rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-10 relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

            <div className="w-40 h-40 md:w-48 md:h-48 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border-5 border-white/10 shadow-2xl flex-shrink-0 z-10">
               <ProfileImage
                  src={person.image_url}
                  alt={person.name}
                  className="w-full h-full object-cover"
               />
            </div>

            <div className="flex-1 text-center md:text-left z-10 space-y-6">
               <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                     {person.name}
                  </h1>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                     <span
                        className="px-6 py-3 text-xs font-black rounded-full uppercase tracking-widest shadow-lg flex items-center gap-3 border transition-colors"
                        style={{
                           backgroundColor: latestHistory?.party_color_bg || '#D4AF37',
                           color: latestHistory?.party_color_text || '#FFFFFF',
                           borderColor: latestHistory?.party_color_border || 'rgba(0,0,0,0.1)'
                        }}
                     >
                        {latestHistory?.party_logo_url && (
                           <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                              <img src={latestHistory.party_logo_url} alt={latestHistory.party} className="w-6 h-6 object-contain" />
                           </div>
                        )}
                        {latestHistory?.party || "NA"}
                     </span>
                     <span className="px-5 py-2 bg-white/10 text-white text-[10px] font-black rounded-full uppercase tracking-widest border border-white/10">
                        {latestHistory?.constituency} Constituency
                     </span>
                  </div>
               </div>

               <div className="pt-2">
                  <div className="inline-flex flex-col bg-brand-gold rounded-2xl px-10 py-4 shadow-2xl border border-white/20 transform hover:scale-105 transition-transform">
                     <span className="text-white/70 text-[10px] uppercase font-black tracking-[0.3em] mb-1">Win Rate</span>
                     <span className="text-white text-3xl font-black tracking-tighter">WIN RATE: {winRate}%</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Quick Facts Grid */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
               <div className="p-3 bg-brand-yellow/10 text-brand-yellow rounded-2xl">
                  <GraduationCap size={28} />
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Education</p>
                  <p className="text-sm font-black text-brand-dark capitalize">Graduate</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
               <div className="p-3 bg-brand-green/10 text-brand-green rounded-2xl">
                  <Briefcase size={28} />
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Profession</p>
                  <p className="text-sm font-black text-brand-dark capitalize">Social Service</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
               <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-2xl">
                  <User size={28} />
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Assets</p>
                  <p className="text-sm font-black text-brand-dark uppercase tracking-tight">{totalAssets || "₹ 0.00 Cr"}</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
               <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                  <AlertCircle size={28} />
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Criminal Cases</p>
                  <p className="text-xl font-black text-red-500">{criminalCases}</p>
               </div>
            </div>
         </div>
      </div>
   );
}
