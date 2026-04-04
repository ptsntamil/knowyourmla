import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import NoteBanner from "@/components/layout/NoteBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://knowyourmla-info.vercel.app"),
  title: "KnowYourMLA - Tamil Nadu MLA Directory & Election History",
  description: "Comprehensive source for MLA information, election history, and performance analytics across Tamil Nadu constituencies. Empowering citizens with data-driven political insights.",
  keywords: ["KnowYourMLA", "MLA", "Tamil Nadu Politics", "Election Data", "Constituency Analysis"],
  robots: "index, follow",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || "https://knowyourmla-info.vercel.app",
  },
  openGraph: {
    title: "KnowYourMLA - Tamil Nadu MLA Directory & Election History",
    description: "Comprehensive source for MLA information, election history, and performance analytics across Tamil Nadu constituencies.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://knowyourmla-info.vercel.app",
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
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 flex flex-col`}>
        <Navbar />

        <NoteBanner 
          message="This site currently contains data for only the last 2 elections and may have some issues as we are still updating it. More election data will be added in the coming weeks." 
        />

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
