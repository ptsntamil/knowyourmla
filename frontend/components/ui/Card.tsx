import React from "react";
import Link from "next/link";

interface CardProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
  hoverEffect?: boolean;
}

export default function Card({
  children,
  href,
  className = "",
  hoverEffect = true,
}: CardProps) {
  const baseStyles = "bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all duration-500 overflow-hidden relative";
  const hoverStyles = hoverEffect ? "hover:shadow-2xl hover:border-brand-gold/20 hover:-translate-y-2" : "";

  const content = (
    <div className={`${baseStyles} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
