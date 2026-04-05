import Link from "next/link";
import { DistrictResponse } from "@/types/models";
import Card from "@/components/ui/Card";
import { ArrowRight } from "lucide-react";

interface DistrictCardProps {
  district: DistrictResponse;
  constituencyCount: number;
}

export default function DistrictCard({ district, constituencyCount }: DistrictCardProps) {
  const slug = district.id.replace("DISTRICT#", "").toLowerCase();

  return (
    <Card href={`/tn/districts/${slug}`} className="flex flex-col relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-brand-green/10 transition-colors" />
      
      <h3 className="text-2xl font-black text-brand-dark group-hover:text-brand-green transition-colors capitalize tracking-tighter leading-none mb-2">
        {district.name.toLowerCase()}
      </h3>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
        {constituencyCount} Constituencies
      </p>
      
      <div className="mt-auto flex items-center text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">
        Explore District
        <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
      </div>
    </Card>
  );
}
