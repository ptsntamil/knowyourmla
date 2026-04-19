import { PersonDetail, ElectionHistoryRecord } from "@/types/models";
import { User, GraduationCap, Briefcase, AlertCircle, Coins, Car, MapPin, Facebook, Twitter, Instagram } from "lucide-react";
import ProfileImage from "./ProfileImage";
import ShareButton from "./ShareButton";
import Badge from "./ui/Badge";
import PartyBadge from "./ui/PartyBadge";

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

const ensureAbsoluteUrl = (url: string, base: string) => {
   if (!url) return "";
   if (url.startsWith("http")) return url;
   const cleanUrl = url.startsWith("@") ? url.substring(1) : url;
   return `${base}${cleanUrl}`;
};

export default function MLAHeader({
   person, latestHistory, criminalCases, totalAssets, winRate,
   goldAssets, vehicleAssets, landAssets, personalTitle = "Candidate"
}: MLAHeaderProps) {
   // Assets Calculation Logic
   let totalGold = 0;
   if (goldAssets) {
      Object.values(goldAssets).forEach((item: any) => {
         if (typeof item?.weight_grms === 'number') {
            totalGold += item.weight_grms;
         } else {
            const weight = item?.gold || item?.weight || item?.weight_grms || "";
            const gramMatch = String(weight).match(/^([\d.]+)\s*(gram|Gram|Grams|grams|grm|grms|gm|G)?$/i);
            const sovereignMatch = String(weight).match(/^([\d.]+)\s*(sovereign|Sovereign|Sovereigns|Savaran|Savarans|Pavan|Pavans|Pawn|Pawns)?$/i);

            if (gramMatch) {
               totalGold += parseFloat(gramMatch[1]);
            } else if (sovereignMatch) {
               totalGold += parseFloat(sovereignMatch[1]) * 8;
            }
         }
      });
   }


   let vehicleCount = 0;
   if (vehicleAssets && typeof vehicleAssets === 'object') {
      Object.values(vehicleAssets).forEach((val: any) => {
         if (Array.isArray(val)) {
            const validVehicles = val.filter(v => {
               if (!v) return false;
               const text = typeof v === 'string' ? v : (v?.name || v?.raw_text || '');
               // If it's an object with a name or value, it's a valid vehicle
               if (typeof v === 'object' && (v.name || v.registration_no || v.value)) return true;
               return text && text.toLowerCase() !== 'nil' && text.toLowerCase() !== 'none';
            });
            vehicleCount += validVehicles.length;
         } else if (typeof val === 'string' && val.trim() && val.toLowerCase() !== 'nil' && val.toLowerCase() !== 'none') {
            vehicleCount += 1;
         } else if (val && typeof val === 'object' && (val.name || val.registration_no || val.value)) {
            // Handle cases where family member has a single vehicle object instead of array
            vehicleCount += 1;
         }
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
            <div className="bg-brand-green rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-10 relative overflow-hidden border border-white/10 flex-1">
               <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

               <div className="w-40 h-40 md:w-48 md:h-48 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border-8 border-white/10 shadow-2xl flex-shrink-0 z-10">
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
                        <PartyBadge
                           party={latestHistory?.party || "NA"}
                           logoUrl={latestHistory?.party_logo_url}
                           colorBg={latestHistory?.party_color_bg || '#D4AF37'}
                           colorText={latestHistory?.party_color_text || '#FFFFFF'}
                           colorBorder={latestHistory?.party_color_border || 'rgba(0,0,0,0.1)'}
                           className="px-6 py-3 text-xs shadow-lg"
                        />
                        <span className="px-5 py-2 bg-white/10 text-white text-[10px] font-black rounded-full uppercase tracking-widest border border-white/10">
                           {latestHistory?.constituency} Constituency
                        </span>
                        {person.age && (
                           <span className="px-5 py-2 bg-white/10 text-white text-[10px] font-black rounded-full uppercase tracking-widest border border-white/10">
                              {person.age} Years Old
                           </span>
                        )}
                        <ShareButton
                           title={`${person.name} ${personalTitle} Profile`}
                           text={`Check out ${person.name}'s ${personalTitle} profile on KnowYourMLA.`}
                           url={`/tn/mla/${person.person_id}`}
                        />

                        {/* Social Profile Links */}
                        <div className="flex gap-2">
                           {person.social_profiles?.facebook && (
                              <a
                                 href={ensureAbsoluteUrl(person.social_profiles.facebook, "https://facebook.com/")}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all hover:scale-110 active:scale-95 group"
                                 title="Facebook"
                              >
                                 <Facebook size={18} className="group-hover:text-brand-gold transition-colors" />
                              </a>
                           )}
                           {person.social_profiles?.twitter && (
                              <a
                                 href={ensureAbsoluteUrl(person.social_profiles.twitter, "https://x.com/")}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all hover:scale-110 active:scale-95 group"
                                 title="Twitter / X"
                              >
                                 <Twitter size={18} className="group-hover:text-brand-gold transition-colors" />
                              </a>
                           )}
                           {person.social_profiles?.instagram && (
                              <a
                                 href={ensureAbsoluteUrl(person.social_profiles.instagram, "https://instagram.com/")}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all hover:scale-110 active:scale-95 group"
                                 title="Instagram"
                              >
                                 <Instagram size={18} className="group-hover:text-brand-gold transition-colors" />
                              </a>
                           )}
                        </div>
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

            {/* Sidebar Widgets (Education, Profession, Assets) - Moved Outside */}
            <div className="w-full lg:w-72 flex flex-col gap-4">
               <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
                  <div className="p-3 bg-brand-yellow/10 text-brand-yellow rounded-2xl flex-shrink-0 group-hover:bg-brand-yellow/20 transition-colors">
                     <GraduationCap size={24} />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Education</span>
                     <span className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase" title={person.education || "Graduate"}>{person.education?.includes("Category:") ? person.education.split(":")[1].trim().split(" ")[0].replace(/,/g, "") : (person.education || "Graduate")}</span>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
                  <div className="p-3 bg-brand-green/10 text-brand-green rounded-2xl flex-shrink-0 group-hover:bg-brand-green/20 transition-colors">
                     <Briefcase size={24} />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Profession</span>
                     <span className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase" title={person.profession || "Social Service"}>{person.profession || "Social Service"}</span>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
                  <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-2xl flex-shrink-0 group-hover:bg-brand-gold/20 transition-colors">
                     <User size={24} />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Assets</span>
                     <span className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase" title={totalAssets || "₹ 0.00 Cr"}>{totalAssets || "₹ 0.00 Cr"}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Bottom Quick Facts Grid (Criminal, Gold, Vehicle, Land) */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
               <div className="p-2 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl flex-shrink-0 group-hover:bg-red-100 dark:group-hover:bg-red-900/20 transition-colors">
                  <AlertCircle size={24} />
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Criminal Cases</span>
                  <span className="text-sm font-black text-red-500 uppercase truncate">{criminalCases}</span>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
               <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                  <Coins size={24} />
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Gold</span>
                  <span className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase truncate">{totalGold.toFixed(2)}g</span>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
               <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <Car size={24} />
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Vehicles</span>
                  <span className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase truncate">{vehicleCount}</span>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group relative">
               <Badge variant="brand" size="xs" className="absolute top-2 right-4">Beta</Badge>
               <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                  <MapPin size={24} />
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Land</span>
                  <span className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase truncate">{landStr}</span>
               </div>
            </div>
         </div>
      </div>
   );
}
