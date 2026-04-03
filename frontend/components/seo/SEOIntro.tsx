import React from "react";

interface SEOIntroProps {
  h1: string;
  intro: string;
  className?: string;
}

export default function SEOIntro({ h1, intro, className = "" }: SEOIntroProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      <h1 className="text-3xl md:text-5xl font-black text-brand-dark dark:text-slate-100 uppercase tracking-tighter leading-none">
        {h1}
      </h1>
      <p className="text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
        {intro}
      </p>
    </section>
  );
}
