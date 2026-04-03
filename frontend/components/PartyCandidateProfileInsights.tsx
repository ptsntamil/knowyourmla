"use client";

import { User, Shield, GraduationCap, TrendingUp, UserPlus, Users, Award, TrendingDown, BookOpen, UserCheck } from "lucide-react";
import ProfileImage from "./ProfileImage";
import Link from "next/link";

interface PartyCandidateProfileInsightsProps {
  analytics: any;
}

export default function PartyCandidateProfileInsights({ analytics }: PartyCandidateProfileInsightsProps) {
  const { age, assets, criminal, education, stats, gender } = analytics;

  const FeatureCard = ({ title, name, id, pic, value, icon: Icon, color, bg }: any) => (
    <div className={`rounded-3xl p-4 sm:p-6 border border-border/50 bg-card/50 backdrop-blur-sm flex items-center gap-4 sm:gap-6 group hover:border-brand-gold/30 transition-all ${bg}`}>
       <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white/10 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800`}>
          <ProfileImage src={pic} alt={name || ""} />
       </div>
       <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
             <Icon size={12} className={color} />
             {title}
          </p>
          {name && id ? (
            <Link href={`/tn/mla/${id}`} className="text-base sm:text-lg font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight block truncate hover:text-brand-gold transition-colors">
                {name}
            </Link>
          ) : (
            <p className="text-base sm:text-lg font-black text-slate-300 dark:text-slate-700 uppercase tracking-tight">Data Pending</p>
          )}
          <p className={`text-[10px] sm:text-xs font-bold ${color} mt-0.5`}>{value}</p>
       </div>
    </div>
  );

  const QuickMetric = ({ label, value, icon: Icon, color, bg }: any) => (
    <div className={`p-4 sm:p-6 rounded-2xl border border-border/50 bg-card flex items-center gap-4 group hover:shadow-md transition-all`}>
        <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
            <p className="text-xl sm:text-2xl font-black text-brand-dark dark:text-slate-100 tracking-tight leading-none">{value}</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-10 sm:space-y-12">
      <div className="flex items-center gap-4">
        <div className="p-3 sm:p-4 bg-brand-dark dark:bg-slate-800 text-brand-gold rounded-2xl shrink-0">
          <Award size={24} className="sm:w-7 sm:h-7" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight leading-none mb-1">Quick Insights</h3>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Notable candidate metrics & demographics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <FeatureCard 
            title="Highest Assets" 
            name={assets.highestName} 
            id={assets.highestId} 
            pic={assets.highestPic} 
            value={`₹${(assets.highest / 10000000).toFixed(2)} Cr`}
            icon={TrendingUp}
            color="text-emerald-600"
            bg="hover:bg-emerald-500/5"
        />
        <FeatureCard 
            title="Youngest Candidate" 
            name={age.youngestName} 
            id={age.youngestId} 
            pic={age.youngestPic} 
            value={`${age.youngest} Years Old`}
            icon={UserPlus}
            color="text-indigo-600"
            bg="hover:bg-indigo-500/5"
        />
        <FeatureCard 
            title="Maximum Cases" 
            name={criminal.highestCandidate} 
            id={criminal.highestCandidateId} 
            pic={criminal.highestCandidatePic} 
            value={`${criminal.max} Declared Cases`}
            icon={Shield}
            color="text-rose-600"
            bg="hover:bg-rose-500/5"
        />
        <FeatureCard 
            title="Lowest Assets" 
            name={assets.lowestName} 
            id={assets.lowestId} 
            pic={assets.lowestPic} 
            value={`₹${(assets.lowest / 100000).toFixed(2)} Lacs`}
            icon={TrendingDown}
            color="text-amber-600"
            bg="hover:bg-amber-500/5"
        />
        <FeatureCard 
            title="Eldest Candidate" 
            name={age.eldestName} 
            id={age.eldestId} 
            pic={age.eldestPic} 
            value={`${age.eldest} Years Old`}
            icon={Users}
            color="text-slate-600"
            bg="hover:bg-slate-500/5"
        />
        {education.mostCommon && (
           <FeatureCard 
              title="Profile Peak" 
              name={education.mostCommon} 
              pic={null} 
              value="Most Common Education"
              icon={BookOpen}
              color="text-blue-600"
              bg="hover:bg-blue-500/5"
          />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
         <QuickMetric 
            label="New Faces" 
            value={stats.newCandidates} 
            icon={UserPlus}
            color="text-blue-600"
            bg="bg-blue-500/10"
         />
         <QuickMetric 
            label="Graduates+" 
            value={education.graduateCount} 
            icon={GraduationCap}
            color="text-indigo-600"
            bg="bg-indigo-500/10"
         />
         <QuickMetric 
            label="Crorepatis" 
            value={assets.crorepatiCount} 
            icon={TrendingUp}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
         />
         <QuickMetric 
            label="Women Representation" 
            value={gender.female} 
            icon={Users}
            color="text-pink-600"
            bg="bg-pink-500/10"
         />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
         <QuickMetric 
            label="Avg. Age" 
            value={`${age.average || 45}y`} 
            icon={User}
            color="text-slate-600"
            bg="bg-slate-500/10"
         />
         <QuickMetric 
            label="Below 40" 
            value={age.ageBelow40} 
            icon={Users}
            color="text-indigo-600"
            bg="bg-indigo-500/10"
         />
         <QuickMetric 
            label="Returning" 
            value={stats.repeatCandidates || 0} 
            icon={UserCheck}
            color="text-teal-600"
            bg="bg-teal-500/10"
         />
         <QuickMetric 
            label="Candidates in Selection" 
            value={stats.totalContested} 
            icon={Award}
            color="text-brand-gold"
            bg="bg-brand-gold/10"
         />
      </div>
    </div>
  );
}
