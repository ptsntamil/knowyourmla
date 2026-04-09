import Link from "next/link";
import { Award, ChevronRight, MapPin } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  item: string;
}

interface ConstituencyElectionHeroProps {
  constituencyName: string;
  districtName: string;
  year: number;
  summarySentence: string;
  breadcrumbItems: BreadcrumbItem[];
  children?: React.ReactNode;
}

export default function ConstituencyElectionHero({
  constituencyName,
  districtName,
  year,
  summarySentence,
  breadcrumbItems,
  children
}: ConstituencyElectionHeroProps) {
  return (
    <div className="relative overflow-hidden bg-brand-dark pb-24 pt-12 md:pb-32 md:pt-16">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0">
        <div className="absolute left-1/4 top-0 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gold/10 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[800px] translate-x-1/2 translate-y-1/2 rounded-full bg-brand-green/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <nav className="flex items-center flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            {breadcrumbItems.map((item, index) => (
              <div key={item.item} className="flex items-center">
                {index > 0 && <ChevronRight className="mx-2 h-3 w-3 opacity-20" />}
                {index === breadcrumbItems.length - 1 ? (
                  <span className="text-brand-gold">{item.name}</span>
                ) : (
                  <Link href={item.item} className="hover:text-white transition-colors">
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
          
          {children && (
            <div className="flex items-center justify-end gap-4">
              {children}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/20 text-brand-gold ring-1 ring-brand-gold/30">
                < Award className="h-6 w-6" />
              </div>
              <div className="h-px w-12 bg-white/10" />
              <span className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Election Result {year}</span>
            </div>

            <h1 className="text-4xl font-black text-white md:text-7xl lg:text-8xl uppercase tracking-tighter leading-[0.9]">
              {constituencyName} <br />
              <span className="text-brand-gold">Result {year}</span>
            </h1>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-gold" />
                <span className="text-sm font-black uppercase tracking-widest text-white/60">{districtName}, Tamil Nadu</span>
              </div>
            </div>

            <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-300">
              {summarySentence}
            </p>
          </div>

          <div className="flex flex-col items-end gap-4">
             <div className="hidden md:block">
                <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">State: </span>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold">Tamil Nadu</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
