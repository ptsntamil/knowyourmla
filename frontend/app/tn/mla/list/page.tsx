import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import { generateItemListSchema } from "@/lib/seo/jsonld";
import Link from "next/link";
import { fetchMLAs, fetchDistricts, fetchParties } from "@/services/api";
import CoverImage from "@/components/CoverImage";
import MLAListClient from "@/components/MLAListClient";
import SEOIntro from "@/components/seo/SEOIntro";
import FAQSection from "@/components/seo/FAQSection";
import FAQSchema from "@/components/seo/FAQSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ItemListSchema from "@/components/seo/ItemListSchema";
import InternalLinks from "@/components/seo/InternalLinks";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "Tamil Nadu MLA List 2021-2026 | Elected Members by Constituency",
    description: "Complete list of 234 elected MLAs in Tamil Nadu. View MLA photos, party affiliations, and constituency details on KnowYourMLA.",
    path: "/tn/mla/list",
    keywords: ["MLA List", "Tamil Nadu MLAs", "Elected Members", "Constituency Wise MLAs", "MLA photos", "Tamil Nadu Politics"]
  });
}

export default async function MLAListPage() {
  const [{ mlas }, districts, parties] = await Promise.all([
    fetchMLAs(),
    fetchDistricts(),
    fetchParties()
  ]);

  const faqs = [
    {
      question: "How many Assembly constituencies are there in Tamil Nadu?",
      answer: "There are 234 Assembly constituencies in Tamil Nadu, each represented by one elected MLA."
    },
    {
      question: "Where can I see the Tamil Nadu MLA list with photos?",
      answer: "The complete Tamil Nadu MLA list with photos, party affiliations, and constituency details is available on this page. You can filter by district and party to find specific MLAs."
    },
    {
      question: "How can I find the current MLA of a constituency?",
      answer: "You can use the search bar on this page to find your constituency or browse the list of MLAs to see the current representative for any of the 234 assembly seats."
    }
  ];

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema 
        items={[
          commonBreadcrumbs.home,
          { name: "MLA List", item: "/tn/mla/list" }
        ]} 
      />
      <FAQSchema faqs={faqs} />
      <ItemListSchema 
        items={mlas.slice(0, 10).map((mla: any, index: number) => ({
          name: mla.name,
          url: `/tn/mla/${mla.slug}`,
          position: index + 1
        }))} 
      />
      
      <CoverImage 
        title="Current MLAs" 
        subtitle="List of elected members of the Tamil Nadu Legislative Assembly (2021-2026)."
      >
        <nav className="flex text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
          <Link href="/tn" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-3 text-white/20">/</span>
          <Link href="/tn" className="hover:text-white transition-colors">Tamil Nadu</Link>
          <span className="mx-3 text-white/20">/</span>
          <span className="text-brand-gold">MLA List</span>
        </nav>
      </CoverImage>
      
      <main className="max-w-7xl mx-auto px-4 py-16 space-y-12">
        <SEOIntro 
          h1="Tamil Nadu MLA List"
          intro="This page provides the complete Tamil Nadu MLA list with constituency, district, party, profile details, and candidate information. View the Tamil Nadu MLA list with photos, constituency details, and party information available on KnowYourMLA."
        />

        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
            <div>
                <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-2">Elected Members</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Displaying all 234 current MLAs by constituency</p>
            </div>
            <div className="hidden md:block">
                <span className="text-[10px] bg-brand-dark text-white font-black px-6 py-3 rounded-full uppercase tracking-[0.2em] border border-white/10 shadow-2xl flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
                    {mlas.length} Active MLAs
                </span>
            </div>
        </div>

        <MLAListClient initialMLAs={mlas} />

        <div className="grid lg:grid-cols-2 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-12">
            <InternalLinks 
              title="Browse MLAs by District"
              items={districts.map((d: any) => ({
                name: d.name,
                href: `/tn/districts/${d.name.toLowerCase().replace(/\s+/g, '-')}`
              }))}
            />
            
            <InternalLinks 
              title="Browse MLAs by Party"
              items={parties.map((p: any) => ({
                name: p.short_name || p.name,
                href: `/parties/${(p.slug || p.short_name || p.name).toLowerCase().replace(/\s+/g, '-')}`
              }))}
            />
          </div>

          <FAQSection faqs={faqs} />
        </div>
      </main>
    </div>
  );
}
