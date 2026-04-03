"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "insights", label: "Insights" },
  { id: "trends", label: "Trends" },
  { id: "analytics", label: "Analytics" },
  { id: "candidates", label: "Candidates" },
];

export default function SectionNav() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = SECTIONS.map((s) => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 80,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border/50 shadow-sm overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 sm:gap-2 h-14 sm:h-16">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`px-4 sm:px-6 h-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2
                ${
                  activeSection === section.id
                    ? "text-brand-dark dark:text-brand-gold border-brand-dark dark:border-brand-gold"
                    : "text-slate-400 border-transparent hover:text-brand-dark/70 dark:hover:text-slate-200"
                }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
