"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ExpenditureAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    if (pathname === "/tn/analysis/2026-election-expenditure") {
      // Simulate sending to analytics provider
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "expenditure_page_view", {
          page_path: pathname,
        });
      }
    } else if (pathname.startsWith("/tn/election-expenditure/2026/")) {
      const partySlug = pathname.split("/").pop();
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "expenditure_party_selected", {
          party: partySlug,
          page_path: pathname,
        });
      }
    }
  }, [pathname]);

  return null;
}
