import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KnowYourMLA - Tamil Nadu MLA Directory & Election History",
  description: "Comprehensive source for MLA information, election history, and performance analytics across Tamil Nadu constituencies. Empowering citizens with data-driven political insights.",
  keywords: ["KnowYourMLA", "MLA", "Tamil Nadu Politics", "Election Data", "Constituency Analysis"],
  robots: "index, follow",
  openGraph: {
    title: "KnowYourMLA - Tamil Nadu MLA Directory & Election History",
    description: "Comprehensive source for MLA information, election history, and performance analytics across Tamil Nadu constituencies.",
    url: "https://knowyourmla-info.web.app/",
    siteName: "KnowYourMLA",
    images: [
      {
        url: "/logo.png",
        width: 1536,
        height: 1024,
        alt: "KnowYourMLA Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KnowYourMLA",
    description: "Tamil Nadu MLA Directory & Election History",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 flex flex-col`}>
        <Navbar />

        <div className="bg-brand-gold/10 border-b border-brand-gold/20 py-2 px-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm text-brand-dark font-medium">
            <span className="flex-shrink-0 bg-brand-gold text-white p-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Note</span>
            <p>
              This site currently contains data for only the last 2 elections and may have some issues as we are still updating it.
              More election data will be added in the coming weeks.
            </p>
          </div>
        </div>

        <div className="flex-grow">
          {children}
        </div>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
