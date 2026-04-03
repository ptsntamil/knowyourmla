import Link from "next/link";
import Image from "next/image";

interface PartyCardProps {
  party: any;
}

export default function PartyCard({ party }: PartyCardProps) {
  const slug = party.normalized_name || party.PK.replace("PARTY#", "").toLowerCase();
  
  return (
    <Link href={`/parties/${slug}`} className="group block h-full">
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 h-full flex flex-col items-center text-center space-y-6">
        <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-4">
          {party.logo_url ? (
            <Image
              src={party.logo_url}
              alt={party.name || "Party Logo"}
              fill
              className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="text-4xl font-black text-slate-200 uppercase">
              {party.short_name?.[0] || party.name?.[0] || "?"}
            </div>
          )}
        </div>

        <div className="space-y-2 flex-grow">
          <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight group-hover:text-brand-gold transition-colors">
            {party.name}
          </h3>
          {party.short_name && (
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {party.short_name}
            </p>
          )}
        </div>

        <div className="pt-6 border-t border-slate-50 w-full">
          <span className="text-[10px] font-black text-brand-green uppercase tracking-widest flex items-center justify-center gap-2">
            View Party Profile
            <svg 
              className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
