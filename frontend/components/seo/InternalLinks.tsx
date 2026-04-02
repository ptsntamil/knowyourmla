import React from "react";
import Link from "next/link";

interface LinkItem {
  name: string;
  href: string;
}

interface InternalLinksProps {
  title: string;
  items: LinkItem[];
  className?: string;
}

export default function InternalLinks({ title, items, className = "" }: InternalLinksProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className={`space-y-6 ${className}`}>
      <h2 className="text-xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">
        {title}
      </h2>
      <div className="flex flex-wrap gap-3">
        {items.map((item, index) => (
          <Link 
            key={index} 
            href={item.href}
            className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-brand-gold hover:text-white dark:hover:bg-brand-gold text-slate-600 dark:text-slate-300 rounded-xl text-sm font-black uppercase tracking-wider transition-all border border-slate-100 dark:border-slate-800 active:scale-95"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
