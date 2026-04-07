import React from 'react';
import Link from 'next/link';
import { ElectionSummary } from '@/lib/services/election-analytics.service';

interface ElectionHeroProps {
  summary: ElectionSummary;
}

export default function ElectionHero({ summary }: ElectionHeroProps) {
  const { year, stateName } = summary;

  return (
    <nav className="flex text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-6">
      <Link href="/" className="hover:text-white transition-colors">Home</Link>
      <span className="mx-3 text-white/20">/</span>
      <Link href="/tn" className="hover:text-white transition-colors uppercase tracking-[0.3em]">{stateName}</Link>
      <span className="mx-3 text-white/20">/</span>
      <span className="text-brand-gold uppercase tracking-[0.3em]">{year} Election</span>
    </nav>
  );
}
