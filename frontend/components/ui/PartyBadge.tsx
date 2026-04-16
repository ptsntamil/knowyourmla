"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getPartySlug, getPartyLogo, derivePartyShortName } from "@/lib/utils/party-utils";

interface PartyBadgeProps {
  party: string;
  shortName?: string | null;
  logoUrl?: string | null;
  colorBg?: string | null;
  colorText?: string | null;
  colorBorder?: string | null;
  className?: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PartyBadge({
  party,
  shortName,
  logoUrl,
  colorBg,
  colorText,
  colorBorder,
  className = "",
  showName = true,
  size = 'md',
}: PartyBadgeProps) {
  const [imgError, setImgError] = React.useState(true);
  
  // Prioritize local logo if shortName is available
  const effectiveLogoUrl = getPartyLogo(shortName || party) || logoUrl;
  const displayShortName = shortName || derivePartyShortName(party);

  // Proactively check if the image exists to prevent broken icon flash
  React.useEffect(() => {
    if (effectiveLogoUrl) {
      const img = new window.Image();
      img.src = effectiveLogoUrl;
      img.onload = () => setImgError(false);
      img.onerror = () => setImgError(true);
    } else {
      setImgError(true);
    }
  }, [effectiveLogoUrl]);

  const sizeConfig = {
    sm: { container: "w-6 h-6", text: "text-[8px]", padding: "px-2 py-1 gap-1.5" },
    md: { container: "w-8 h-8", text: "text-[10px]", padding: "px-4 py-2 gap-3" },
    lg: { container: "w-10 h-10", text: "text-xs", padding: "px-6 py-3 gap-4" }
  };
  const config = sizeConfig[size] || sizeConfig.md;

  const slug = getPartySlug(party);
  const isIndependent = slug === "independent";

  const content = (
    <>
      {!isIndependent && (
        <div className={`relative ${config.container} bg-slate-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20 shadow-inner`}>
          {/* Base Layer: Acronym Text */}
          <span className={`${config.text} font-black text-slate-400 select-none`}>
            {displayShortName}
          </span>

          {/* Top Layer: Logo Image (Hidden if error) */}
          {effectiveLogoUrl && !imgError && (
            <img
              src={effectiveLogoUrl}
              alt={party}
              className="absolute inset-0 w-full h-full object-contain p-1.5 bg-white z-10"
              onError={() => setImgError(true)}
            />
          )}
        </div>
      )}
      {showName && party}
    </>
  );

  const containerClasses = `${config.text} font-black ${showName ? config.padding : 'p-0'} rounded-full uppercase tracking-wider flex items-center w-fit shadow-sm transition-all ${!isIndependent ? "hover:scale-105 active:scale-95" : ""} ${className}`;
  const containerStyle = {
    backgroundColor: showName ? (colorBg || "#f8fafc") : 'transparent',
    color: colorText || "#1e293b",
    borderColor: showName ? (colorBorder || "#e2e8f0") : 'transparent',
  };

  if (isIndependent) {
    return (
      <div className={containerClasses} style={containerStyle}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/parties/${slug}`}
      className={containerClasses}
      style={containerStyle}
    >
      {content}
    </Link>
  );
}
