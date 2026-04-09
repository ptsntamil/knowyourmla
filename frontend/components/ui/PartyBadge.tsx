import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getPartySlug, getPartyLogo } from "@/lib/utils/party-utils";

interface PartyBadgeProps {
  party: string;
  shortName?: string | null;
  logoUrl?: string | null;
  colorBg?: string | null;
  colorText?: string | null;
  colorBorder?: string | null;
  className?: string;
}

export default function PartyBadge({
  party,
  shortName,
  logoUrl,
  colorBg,
  colorText,
  colorBorder,
  className = "",
}: PartyBadgeProps) {
  // Prioritize local logo if shortName is available
  const effectiveLogoUrl = getPartyLogo(shortName || party) || logoUrl;

  return (
    <Link
      href={`/parties/${getPartySlug(party)}`}
      className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-3 w-fit shadow-sm border whitespace-nowrap transition-all hover:scale-105 active:scale-95 ${className}`}
      style={{
        backgroundColor: colorBg || "#f8fafc",
        color: colorText || "#1e293b",
        borderColor: colorBorder || "#e2e8f0",
      }}
    >
      {effectiveLogoUrl && (
        <div className="relative w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20 shadow-inner">
          <Image
            src={effectiveLogoUrl}
            alt={party}
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
      )}
      {party}
    </Link>
  );
}
