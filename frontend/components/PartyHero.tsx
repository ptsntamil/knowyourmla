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
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-bg-accent/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-center gap-8 sm:gap-12 text-center md:text-left">
          {/* Logo Container */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 shrink-0 bg-bg-card rounded-[2.5rem] p-6 shadow-2xl shadow-black/5 flex items-center justify-center overflow-hidden border border-border-subtle ring-8 ring-bg-page">
            {party.logo_url ? (
              <Image
                src={party.logo_url}
                alt={party.name}
                fill
                className="object-contain p-6 md:p-8"
              />
            ) : (
              <span className="text-5xl sm:text-7xl font-black text-text-muted">
                {party.short_name?.[0] || party.name?.[0]}
              </span>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-6 w-full max-w-2xl">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-bg-accent/10 text-text-accent text-[10px] font-black rounded-lg uppercase tracking-widest border border-border-accent/20 mb-2">
                Political Profile
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-text-primary tracking-tighter leading-[0.9]">
                {party.name}
              </h1>
              
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                <p className="text-text-muted text-sm sm:text-lg font-medium leading-relaxed">
                  Historical performance and candidate intelligence for {party.name} across Tamil Nadu Assembly Elections.
                </p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center pt-2">
                <span className="px-4 py-2 bg-bg-surface text-text-secondary text-[10px] font-black rounded-xl uppercase tracking-widest border border-border-subtle shadow-sm">
                  {party.short_name || "N/A"}
                </span>
                <span className="px-4 py-2 bg-bg-surface text-text-secondary text-[10px] font-black rounded-xl uppercase tracking-widest border border-border-subtle shadow-sm">
                  Active in TN
                </span>
                <ShareButton
                  title={`${party.name} Election History & Analytics`}
                  text={`Check out ${party.name}'s election performance and candidate analytics on KnowYourMLA.`}
                  url={`/parties/${party.normalized_name || party.PK?.replace("PARTY#", "").toLowerCase()}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
