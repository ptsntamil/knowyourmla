import Link from "next/link";
import { DistrictResponse } from "@/types/models";

interface DistrictCardProps {
  district: DistrictResponse;
  constituencyCount: number;
}

export default function DistrictCard({ district, constituencyCount }: DistrictCardProps) {
  const slug = district.id.replace("DISTRICT#", "").toLowerCase();

  return (
    <Link href={`/district/${slug}`} className="group">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:border-brand-gold transition-all hover:-translate-y-2 h-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-brand-green/10 transition-colors" />
        
        <h3 className="text-2xl font-black text-brand-dark group-hover:text-brand-green transition-colors capitalize tracking-tighter leading-none mb-2">
          {district.name.toLowerCase()}
        </h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
          {constituencyCount} Constituencies
        </p>
        
        <div className="mt-auto flex items-center text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">
          Explore District
          <svg className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="14 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
