"use client";

import { useState } from "react";
import Image from "next/image";
import FeedbackModal from "./FeedbackModal";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-bg-page border-b border-border-subtle shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/tn" className="flex items-center gap-2 group">
              <div className="relative h-12 w-12 md:h-16 md:w-16 overflow-hidden">
                <Image
                  src="/KnowYourMLA_logo.png"
                  alt="KnowYourMLA Logo"
                  fill
                  className="object-contain transform group-hover:scale-110 transition-transform duration-300"
                  priority
                />
              </div>
              <span className="hidden md:inline font-black text-2xl tracking-tighter text-text-secondary">
                KnowYour<span className="text-text-accent">MLA</span>
              </span>
            </a>
            <a href="/tn" className="text-text-muted hover:text-text-primary focus-visible:text-text-primary text-[10px] md:text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page px-2 py-1 rounded">
              Home
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 text-xs font-black uppercase tracking-widest">
            <a href="/parties" className="text-text-muted hover:text-text-primary focus-visible:text-text-primary transition-all hover:scale-105 active:scale-95 self-center outline-none focus-visible:ring-2 focus-visible:ring-interactive-active px-2 py-1 rounded">Parties</a>
            <a href="/news" className="text-text-muted hover:text-text-primary focus-visible:text-text-primary transition-all hover:scale-105 active:scale-95 self-center outline-none focus-visible:ring-2 focus-visible:ring-interactive-active px-2 py-1 rounded">News</a>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="bg-bg-surface text-text-primary px-5 py-2.5 rounded-lg hover:bg-bg-accent hover:text-text-inverse active:scale-95 transition-all flex items-center gap-2 border border-border-default shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-bg-surface focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page cursor-pointer"
            >
              Feedback
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <a
              href="/parties"
              className="text-text-muted hover:text-text-primary focus-visible:text-text-primary text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 px-3 py-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
            >
              Parties
            </a>
            <a
              href="/news"
              className="text-text-muted hover:text-text-primary focus-visible:text-text-primary text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 px-3 py-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
            >
              News
            </a>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-text-primary p-3 hover:bg-bg-surface active:scale-90 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Content */}
        {isMenuOpen && (
          <div className="md:hidden bg-brand-dark border-t border-white/5 px-4 py-6 space-y-4 animate-in slide-in-from-top duration-300">
            <a
              href="/parties"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-text-muted hover:text-text-primary px-5 py-4 rounded-xl transition-all text-xs font-black uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
            >
              Parties
            </a>
            <a
              href="/news"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-text-muted hover:text-text-primary px-5 py-4 rounded-xl transition-all text-xs font-black uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
            >
              News
            </a>
            <button
              onClick={() => {
                setIsFeedbackOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full bg-bg-surface text-text-primary px-5 py-4 rounded-xl hover:bg-bg-accent hover:text-text-inverse active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-border-default shadow-lg text-xs font-black uppercase tracking-widest min-h-[48px] outline-none focus-visible:ring-2 focus-visible:ring-bg-surface"
            >
              Feedback
            </button>
          </div>
        )}
      </nav>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
