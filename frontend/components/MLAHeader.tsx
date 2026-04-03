import { PersonDetail, ElectionHistoryRecord } from "@/types/models";
import { User, GraduationCap, Briefcase, AlertCircle, Coins, Car, MapPin } from "lucide-react";
import ProfileImage from "./ProfileImage";
import ShareButton from "./ShareButton";

interface MLAHeaderProps {
   person: PersonDetail;
   latestHistory?: ElectionHistoryRecord;
   criminalCases: number;
   totalAssets?: string;
   winRate: number;
   goldAssets?: any;
   vehicleAssets?: any;
   landAssets?: any;
   personalTitle?: string;
}

export default function MLAHeader({
   person, latestHistory, criminalCases, totalAssets, winRate,
   goldAssets, vehicleAssets, landAssets, personalTitle = "Candidate"
}: MLAHeaderProps) {
   // Assets Calculation Logic
   let totalGold = 0;
   if (goldAssets) {
      Object.values(goldAssets).forEach((item: any) => {
         const gramMatch = (item?.gold || "").match(/^([\d.]+)\s*(gram|Gram|Grams|grams|grm|gm|G)?$/i);
         const sovereignMatch = (item?.gold || "").match(/^([\d.]+)\s*(Sovereign|Sovereigns|sovereign|sovereigns)$/i);

         if (gramMatch) {
            totalGold += parseFloat(gramMatch[1]);
         } else if (sovereignMatch) {
            totalGold += parseFloat(sovereignMatch[1]) * 8;
         }
      });
   }

   let vehicleCount = 0;
   if (vehicleAssets) {
      Object.values(vehicleAssets).forEach((list: any) => {
         if (Array.isArray(list)) vehicleCount += list.length;
      });
   }

   let totalAcres = 0;
   let totalCents = 0;
   if (landAssets) {
      Object.values(landAssets).forEach((item: any) => {
         const calc = item?.total?.calculated;
         if (calc) {
            totalAcres += parseFloat(calc.acres || 0);
            totalCents += parseFloat(calc.cents || 0);
         }
      });
   }
   if (totalCents >= 100) {
      totalAcres += Math.floor(totalCents / 100);
      totalCents = parseFloat((totalCents % 100).toFixed(2));
   }
   const landStr = `${totalAcres}A ${totalCents > 0 ? `${totalCents}C` : ""}`.trim();

   return (
      <div className="space-y-6">
         {/* Top Section: Profile and Sidebar */}
         <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Card */}
            <div className="bg-bg-surface rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-10 relative overflow-hidden border border-border-subtle flex-1">
               <div className="absolute top-0 right-0 w-80 h-80 bg-bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

               <div className="w-40 h-40 md:w-48 md:h-48 bg-bg-muted rounded-full flex items-center justify-center overflow-hidden border-8 border-border-subtle shadow-2xl flex-shrink-0 z-10">
                  <ProfileImage
                     src={person.image_url}
                     alt={person.name}
                     className="w-full h-full object-cover"
                  />
               </div>

               <div className="flex-1 text-center md:text-left z-10 space-y-6">
                  <div className="space-y-4">
                     <h1 className="text-4xl md:text-6xl font-black text-text-primary uppercase tracking-tighter leading-none">
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
                        <span className="px-5 py-2 bg-text-primary/10 text-text-primary text-[10px] font-black rounded-full uppercase tracking-widest border border-border-subtle">
                           {latestHistory?.constituency} Constituency
                        </span>
                        <ShareButton
                           title={`${person.name} ${personalTitle} Profile`}
                           text={`Check out ${person.name}'s ${personalTitle} profile on KnowYourMLA.`}
                           url={`/tn/mla/${person.person_id}`}
                        />
                     </div>
                  </div>

                  <div className="pt-2">
                     <div className="inline-flex flex-col bg-bg-accent rounded-2xl px-10 py-4 shadow-2xl border border-border-accent transform hover:scale-105 transition-transform">
                        <span className="text-text-inverse/70 text-[10px] uppercase font-black tracking-[0.3em] mb-1">Win Rate</span>
                        <span className="text-text-inverse text-3xl font-black tracking-tighter">WIN RATE: {winRate}%</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Sidebar Widgets (Education, Profession, Assets) - Moved Outside */}
            <div className="w-full lg:w-72 flex flex-col gap-4">
               <div className="bg-bg-surface p-5 rounded-3xl shadow-sm border border-border-subtle flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
                  <div className="p-3 bg-bg-accent-soft/10 text-bg-accent-soft rounded-2xl flex-shrink-0 group-hover:bg-bg-accent-soft/20 transition-colors">
                     <GraduationCap size={24} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                     <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Education</span>
                     <span className="text-sm font-black text-text-primary uppercase truncate">{person.education?.includes("Category:") ? person.education.split(":")[1].trim().split(" ")[0].replace(/,/g, "") : (person.education || "Graduate")}</span>
                  </div>
               </div>

               <div className="bg-bg-surface p-5 rounded-3xl shadow-sm border border-border-subtle flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
                  <div className="p-3 bg-bg-surface/20 text-text-primary rounded-2xl flex-shrink-0 group-hover:bg-bg-surface/30 transition-colors">
                     <Briefcase size={24} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                     <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Profession</span>
                     <span className="text-sm font-black text-text-primary uppercase truncate">{person.profession || "Social Service"}</span>
                  </div>
               </div>

               <div className="bg-bg-surface p-5 rounded-3xl shadow-sm border border-border-subtle flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
                  <div className="p-3 bg-bg-accent/10 text-bg-accent rounded-2xl flex-shrink-0 group-hover:bg-bg-accent/20 transition-colors">
                     <User size={24} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                     <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Assets</span>
                     <span className="text-sm font-black text-text-primary uppercase truncate">{totalAssets || "₹ 0.00 Cr"}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Bottom Quick Facts Grid (Criminal, Gold, Vehicle, Land) */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-bg-surface p-5 rounded-3xl shadow-sm border border-border-subtle flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
               <div className="p-2 bg-red-500/10 text-red-500 rounded-2xl flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                  <AlertCircle size={24} />
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Criminal Cases</span>
                  <span className="text-sm font-black text-red-500 uppercase truncate">{criminalCases}</span>
               </div>
            </div>

            <div className="bg-bg-surface p-5 rounded-3xl shadow-sm border border-border-subtle flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
               <div className="p-3 bg-bg-accent/10 text-bg-accent rounded-2xl flex-shrink-0 group-hover:bg-bg-accent/20 transition-colors">
                  <Coins size={24} />
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Gold</span>
                  <span className="text-sm font-black text-text-primary uppercase truncate">{totalGold.toFixed(2)}g</span>
               </div>
            </div>

            <div className="bg-bg-surface p-5 rounded-3xl shadow-sm border border-border-subtle flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
               <div className="p-3 bg-bg-accent-soft/10 text-bg-accent-soft rounded-2xl flex-shrink-0 group-hover:bg-bg-accent-soft/20 transition-colors">
                  <Car size={24} />
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Vehicles</span>
                  <span className="text-sm font-black text-text-primary uppercase truncate">{vehicleCount}</span>
               </div>
            </div>

            <div className="bg-bg-surface p-5 rounded-3xl shadow-sm border border-border-subtle flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
               <div className="p-3 bg-bg-surface/20 text-text-primary rounded-2xl flex-shrink-0 group-hover:bg-bg-surface/30 transition-colors">
                  <MapPin size={24} />
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Land</span>
                  <span className="text-sm font-black text-text-primary uppercase truncate">{landStr}</span>
               </div>
            </div>
         </div>
      </div>
   );
}
