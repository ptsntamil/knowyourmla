"use client";

import React, { useState } from "react";
import { Share2, Link, Check, X } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  label?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ title, text, url, label = "Share Profile" }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData = {
    title,
    text,
    url: typeof window !== "undefined" ? window.location.origin + url : url,
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
          setShowDropdown(true);
        }
      }
    } else {
      setShowDropdown(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + shareData.url)}`,
      color: "bg-[#25D366]",
    },
    {
      name: "X (Twitter)",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareData.url)}`,
      color: "bg-black",
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
      color: "bg-[#1877F2]",
    },
  ];

  return (
    <div className="relative inline-block">
      <button
        onClick={handleShare}
        className="flex items-center gap-3 px-6 py-3 bg-brand-gold text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl hover:shadow-brand-gold/40 hover:scale-105 hover:brightness-110 active:scale-95 transition-all border-2 border-white/20 group outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 min-h-[44px]"
      >
        <Share2 size={14} className="group-hover:rotate-12 transition-transform" />
        <span>{label}</span>
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden transform origin-top-right transition-all">
            <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
              <button 
                onClick={() => setShowDropdown(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="p-2 space-y-1">
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group outline-none focus-visible:ring-2 focus-visible:ring-brand-gold active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 group-hover:bg-brand-gold/10 group-hover:text-brand-gold transition-colors">
                    <Link size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Copy Link</span>
                </div>
                {copied && <Check size={14} className="text-green-500" />}
              </button>

              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group outline-none focus-visible:ring-2 focus-visible:ring-brand-gold active:scale-[0.98]"
                  onClick={() => setShowDropdown(false)}
                >
                  <div className={`p-2 ${link.color} rounded-lg text-white`}>
                    <Share2 size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
