import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import SocialShare from './SocialShare';

interface ArticleHeaderProps {
  title: string;
  publishDate: string;
  readingTime: string;
  shareUrl?: string;
}

const ArticleHeader: React.FC<ArticleHeaderProps> = ({ title, publishDate, readingTime, shareUrl }) => {
  return (
    <header className="bg-[#16232e] text-white pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
          <Link href="/" className="hover:text-brand-gold transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/news" className="hover:text-brand-gold transition-colors">News</Link>
          <ChevronRight size={12} />
          <span className="text-brand-gold truncate max-w-[200px] md:max-w-none">{title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight mb-8">
          {title}
        </h1>

        {/* Metadata & Share */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400 bg-white/5 w-fit px-6 py-3 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-brand-gold" />
            <span>{publishDate}</span>
          </div>
          <div className="flex items-center gap-2 border-l border-white/10 pl-6">
            <Clock size={16} className="text-brand-gold" />
            <span>{readingTime} Read</span>
          </div>
        </div>
        
        {shareUrl && (
          <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
             <SocialShare url={shareUrl} title={title} />
          </div>
        )}
        </div>
      </div>
    </header>
  );
};

export default ArticleHeader;
