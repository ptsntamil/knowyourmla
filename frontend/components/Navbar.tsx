"use client";

import { useState } from "react";
import FeedbackModal from "./FeedbackModal";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-brand-dark border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/tn" className="flex items-center font-black text-2xl tracking-tighter text-white font-bold">
              <div
                className="h-16 w-16 md:h-20 md:w-20 bg-cover bg-no-repeat bg-center"
                style={{ backgroundImage: "url('/KnowYourMLA_logo.png')" }}
                role="img"
                aria-label="KnowYourMLA Logo"
              />
              <span className="hidden md:inline">KnowYour<span className="text-brand-gold">MLA</span></span>
            </a>
            <a href="/tn" className="text-slate-400 hover:text-white text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors">
              Home
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 text-xs font-black uppercase tracking-widest">
            <a href="/news" className="text-slate-400 hover:text-white transition-colors self-center">News</a>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="bg-brand-green text-white px-5 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 border border-white/10 shadow-lg"
            >
              Feedback
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <a
              href="/news"
              className="text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              News
            </a>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Content */}
        {isMenuOpen && (
          <div className="md:hidden bg-brand-dark border-t border-white/5 px-4 py-6 space-y-4 animate-in slide-in-from-top duration-300">
            <button
              onClick={() => {
                setIsFeedbackOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full bg-brand-green text-white px-5 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 border border-white/10 shadow-lg text-xs font-black uppercase tracking-widest"
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
