import Image from "next/image";
import ShareButton from "./ShareButton";

interface PartyHeroProps {
  party: any;
  analytics: any;
}

export default function PartyHero({ party, analytics }: PartyHeroProps) {
  if (!party) return null;

  return (
    <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-20 overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-center gap-8 sm:gap-12 text-center md:text-left">
          {/* Logo Container */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 shrink-0 bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl shadow-black/5 flex items-center justify-center overflow-hidden border border-border/50 ring-8 ring-slate-50 dark:ring-slate-800/50">
            {party.logo_url ? (
              <Image
                src={party.logo_url}
                alt={party.name}
                fill
                className="object-contain p-6 md:p-8"
              />
            ) : (
              <span className="text-5xl sm:text-7xl font-black text-slate-200 dark:text-slate-800">
                {party.short_name?.[0] || party.name?.[0]}
              </span>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-6 w-full max-w-2xl">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-black rounded-lg uppercase tracking-widest border border-brand-gold/20 mb-2">
                Political Profile
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-brand-dark dark:text-brand-green tracking-tighter leading-[0.9]">
                {party.name}
              </h1>

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg font-medium leading-relaxed">
                  Historical performance and candidate intelligence for {party.name} across Tamil Nadu Assembly Elections.
                </p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center pt-2">
                <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-xl uppercase tracking-widest border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                  {party.short_name || "N/A"}
                </span>
                <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-xl uppercase tracking-widest border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                  Active in TN
                </span>
                <ShareButton
                  title={`${party.name} Election History & Analytics`}
                  text={`Check out ${party.name}'s election performance and candidate analytics on KnowYourMLA.`}
                  url={`/parties/${party.normalized_name || party.PK?.replace("PARTY#", "").toLowerCase()}`}
                  label="Share"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
