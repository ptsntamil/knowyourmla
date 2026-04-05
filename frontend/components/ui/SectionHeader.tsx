import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center" | "right";
  badge?: React.ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  className = "",
  align = "left",
  badge,
}: SectionHeaderProps) {
  const alignmentStyles = {
    left: "text-left",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <div className={`flex flex-col gap-6 ${alignmentStyles[align]} ${className}`}>
      <div className={`flex flex-col md:flex-row md:justify-between md:items-end gap-6 w-full ${alignmentStyles[align]}`}>
        <div>
          <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {subtitle}
            </p>
          )}
        </div>
        {badge && (
          <div className="hidden md:block">
            {badge}
          </div>
        )}
      </div>
    </div>
  );
}
