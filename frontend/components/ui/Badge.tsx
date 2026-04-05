import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "brand" | "gold" | "slate" | "outline";
  size?: "xs" | "sm" | "md";
  className?: string;
  dot?: boolean;
}

export default function Badge({
  children,
  variant = "brand",
  size = "sm",
  className = "",
  dot = false,
}: BadgeProps) {
  const baseStyles = "inline-flex items-center gap-2 font-black uppercase tracking-widest rounded-full transition-all";
  
  const variants = {
    brand: "bg-brand-dark text-white border border-white/10 shadow-lg",
    gold: "bg-brand-gold text-white shadow-sm",
    slate: "bg-slate-100 text-slate-500 border border-slate-200",
    outline: "bg-transparent border border-slate-200 text-slate-600",
  };

  const sizes = {
    xs: "text-[9px] px-2 py-0.5 tracking-tighter",
    sm: "text-[10px] px-4 py-1.5 tracking-wider",
    md: "text-[10px] px-6 py-3 tracking-[0.2em]",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />}
      {children}
    </span>
  );
}
