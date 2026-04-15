"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FeedbackModal from "./FeedbackModal";
import { Menu, X, ChevronDown } from "lucide-react";

export interface ElectionItem {
  year: number;
  label: string;
}

interface NavbarProps {
  elections?: ElectionItem[];
}

export default function Navbar({ elections = [] }: NavbarProps) {
  const currentElections = elections.length > 0 ? elections : [
    { year: 2021, label: "2021 Assembly" },
    { year: 2016, label: "2016 Assembly" },
    { year: 2011, label: "2011 Assembly" },
  ];
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isElectionsDropdownOpen, setIsElectionsDropdownOpen] = useState(false);
  const [isMobileElectionsOpen, setIsMobileElectionsOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsElectionsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Parties", href: "/parties" },
    { name: "News", href: "/news" },
  ];

  const isActive = (href: string) => {
    if (href === "/tn") return pathname === "/tn" || pathname === "/";
    if (href.startsWith("/tn/elections")) return pathname.startsWith("/tn/elections");
    return pathname.startsWith(href);
  };

  const isElectionActive = pathname.startsWith("/tn/elections");

  const linkClasses = (active: boolean) => `
    text-slate-400 hover:text-white focus-visible:text-white transition-all 
    hover:scale-105 active:scale-95 self-center outline-none focus-visible:ring-2 
    focus-visible:ring-brand-gold px-2 py-1 rounded text-xs font-black uppercase tracking-widest
    ${active ? "text-brand-gold font-black" : ""}
  `;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-brand-dark border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/tn" className="flex items-center gap-2 group" aria-label="KnowYourMLA Home">
              <div className="relative h-12 w-12 md:h-16 md:w-16 overflow-hidden">
                <Image
                  src="/KnowYourMLA_logo.png"
                  alt=""
                  fill
                  className="object-contain transform group-hover:scale-110 transition-transform duration-300"
                  priority
                />
              </div>
              <span className="hidden md:inline font-black text-2xl tracking-tighter text-white">
                KnowYour<span className="text-brand-gold">MLA</span>
              </span>
            </Link>
            {/* <Link 
              href="/tn" 
              className={`text-slate-400 hover:text-white focus-visible:text-white text-[10px] md:text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-brand-gold px-2 py-1 rounded ${isActive("/tn") ? "text-brand-gold" : ""}`}
            >
              Home
            </Link> */}
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            {/* 2026 Dashboard Link */}
            <Link
              href="/tn/elections/2026/dashboard"
              className={`relative ${linkClasses(isActive("/tn/elections/2026/dashboard"))}`}
            >
              2026 Dashboard
              <span className="absolute -top-3 -right-4 bg-brand-gold text-brand-dark text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg animate-pulse">
                NEW
              </span>
            </Link>

            {/* MLAs Link */}
            <Link href="/tn/mla/list" className={linkClasses(isActive("/tn/mla/list"))}>
              MLAs
            </Link>

            {/* Parties Link */}
            <Link href="/parties" className={linkClasses(isActive("/parties"))}>
              Parties
            </Link>

            {/* Elections Dropdown */}
            <div className="relative h-full flex items-center" ref={dropdownRef}>
              <button
                onClick={() => setIsElectionsDropdownOpen(!isElectionsDropdownOpen)}
                onMouseEnter={() => setIsElectionsDropdownOpen(true)}
                className={`flex items-center gap-1 ${linkClasses(isElectionActive)}`}
                aria-haspopup="true"
                aria-expanded={isElectionsDropdownOpen}
              >
                Elections
                <ChevronDown size={14} className={`transition-transform duration-200 ${isElectionsDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isElectionsDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-48 bg-brand-dark border border-white/10 rounded-2xl shadow-2xl py-3 animate-in fade-in slide-in-from-top-2 duration-200"
                  onMouseLeave={() => setIsElectionsDropdownOpen(false)}
                  role="menu"
                >
                  {currentElections.map((election: ElectionItem) => (
                    <Link
                      key={election.year}
                      href={`/tn/elections/${election.year}`}
                      onClick={() => setIsElectionsDropdownOpen(false)}
                      className={`block px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-white/5 hover:text-white
                        ${pathname === `/tn/elections/${election.year}` ? "text-brand-gold bg-white/5" : "text-slate-400"}
                      `}
                      role="menuitem"
                    >
                      {election.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* News Link */}
            <Link href="/news" className={linkClasses(isActive("/news"))}>
              News
            </Link>

            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="bg-brand-green text-white px-5 py-2.5 rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 border border-white/10 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark cursor-pointer font-black text-xs uppercase tracking-widest ml-2"
            >
              Feedback
            </button>
          </div>

          {/* Mobile Menu Button & Quick Links */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/tn/elections/2026/dashboard"
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all
                ${isActive("/tn/elections/2026/dashboard")
                  ? "bg-brand-gold text-brand-dark"
                  : "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"}
              `}
            >
              2026
              <span className={`w-1 h-1 rounded-full animate-pulse ${isActive("/tn/elections/2026/dashboard") ? "bg-brand-dark" : "bg-brand-gold"}`}></span>
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white p-2 hover:bg-white/10 active:scale-90 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-white min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Content */}
        {isMenuOpen && (
          <div className="md:hidden bg-brand-dark border-t border-white/5 px-4 py-6 space-y-4 animate-in slide-in-from-top duration-300">
            {/* 2026 Dashboard */}
            <Link
              href="/tn/elections/2026/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className={`relative block w-full text-slate-400 hover:text-white px-5 py-4 rounded-xl transition-all text-xs font-black uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${isActive("/tn/elections/2026/dashboard") ? "bg-white/5 text-brand-gold" : ""}`}
            >
              2026 Dashboard
              <span className="ml-2 bg-brand-gold text-brand-dark text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg">
                NEW
              </span>
            </Link>

            {/* MLAs */}
            <Link
              href="/tn/mla/list"
              onClick={() => setIsMenuOpen(false)}
              className={`block w-full text-slate-400 hover:text-white px-5 py-4 rounded-xl transition-all text-xs font-black uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${isActive("/tn/mla/list") ? "bg-white/5 text-brand-gold" : ""}`}
            >
              MLAs
            </Link>

            {/* Parties */}
            <Link
              href="/parties"
              onClick={() => setIsMenuOpen(false)}
              className={`block w-full text-slate-400 hover:text-white px-5 py-4 rounded-xl transition-all text-xs font-black uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${isActive("/parties") ? "bg-white/5 text-brand-gold" : ""}`}
            >
              Parties
            </Link>

            {/* Elections Accordion */}
            <div className="space-y-2">
              <button
                onClick={() => setIsMobileElectionsOpen(!isMobileElectionsOpen)}
                className={`flex items-center justify-between w-full text-slate-400 hover:text-white px-5 py-4 rounded-xl transition-all text-xs font-black uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${isElectionActive ? "bg-white/5 text-brand-gold" : ""}`}
              >
                Elections
                <ChevronDown size={16} className={`transition-transform duration-200 ${isMobileElectionsOpen ? "rotate-180" : ""}`} />
              </button>

              {isMobileElectionsOpen && (
                <div className="pl-4 space-y-2 animate-in slide-in-from-top-1 duration-200">
                  {currentElections.map((election: ElectionItem) => (
                    <Link
                      key={election.year}
                      href={`/tn/elections/${election.year}`}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block w-full px-5 py-4 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest
                        ${pathname === `/tn/elections/${election.year}` ? "text-brand-gold" : "text-slate-500"}
                      `}
                    >
                      {election.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* News */}
            <Link
              href="/news"
              onClick={() => setIsMenuOpen(false)}
              className={`block w-full text-slate-400 hover:text-white px-5 py-4 rounded-xl transition-all text-xs font-black uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${isActive("/news") ? "bg-white/5 text-brand-gold" : ""}`}
            >
              News
            </Link>

            <button
              onClick={() => {
                setIsFeedbackOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full bg-brand-green text-white px-5 py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10 shadow-lg text-xs font-black uppercase tracking-widest min-h-[48px] outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
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
