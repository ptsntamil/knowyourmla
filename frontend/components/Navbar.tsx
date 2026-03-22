"use client";

import { useState } from "react";
import FeedbackModal from "./FeedbackModal";

export default function Navbar() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-brand-dark border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/tn" className="flex items-center ont-black text-2xl tracking-tighter text-white font-bold">
            <div
              className="h-20 w-20 bg-cover bg-no-repeat bg-center"
              style={{ backgroundImage: "url('/KnowYourMLA_logo.png')" }}
              role="img"
              aria-label="KnowYourMLA Logo"
            />
            KnowYour<span className="text-brand-gold">MLA</span>

          </a>
          <div className="flex gap-8 text-xs font-black uppercase tracking-widest">
            <a href="/news" className="text-slate-400 hover:text-white transition-colors self-center">News</a>
            <a href="/tn" className="text-slate-400 hover:text-white transition-colors self-center">Districts</a>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="bg-brand-green text-white px-5 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 border border-white/10 shadow-lg"
            >
              Feedback
            </button>
          </div>
        </div>
      </nav>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
