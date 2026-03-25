import Image from "next/image";

interface CoverImageProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function CoverImage({ title, subtitle, children }: CoverImageProps) {
  return (
    <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden flex items-center justify-center text-white bg-brand-dark">
      <div className="absolute inset-0 z-0 h-full w-full">
        <Image 
          src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2000&auto=format&fit=crop" 
          alt="Background" 
          fill
          priority
          className="object-cover opacity-30 mix-blend-luminosity scale-105 group-hover:scale-110 transition-transform duration-700"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-dark via-brand-dark/80 to-transparent opacity-90" />
      </div>

      {/* Structural Decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-green/20 rounded-full -mr-64 -mt-64 blur-[120px] pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-gold/10 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none z-10" />
      
      {/* Content Container */}
      <div className="max-w-7xl mx-auto w-full px-4 relative z-20">
        {/* Breadcrumbs Overlay */}
        {children && (
          <div className="mb-10">
            {children}
          </div>
        )}

        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none drop-shadow-2xl">
            {title}
          </h1>
          {subtitle && (
            <div className="flex items-center gap-4">
               <div className="w-12 h-1 bg-brand-gold rounded-full" />
               <p className="text-xs md:text-sm text-slate-300 font-black uppercase tracking-[0.3em] max-w-2xl leading-relaxed">
                 {subtitle}
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
