import React from "react";
import Badge from "@/components/ui/Badge";

interface NoteBannerProps {
  message: string;
  className?: string;
}

export default function NoteBanner({
  message,
  className = "",
}: NoteBannerProps) {
  return (
    <div className={`bg-brand-gold/15 dark:bg-brand-gold/10 border-b border-brand-gold/30 dark:border-brand-gold/20 py-3 px-4 shadow-sm transition-colors ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm text-yellow-900 dark:text-brand-light-gold font-semibold">
        <Badge variant="gold" size="xs" className="rounded-md shadow-sm">Note</Badge>
        <p className="leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}
