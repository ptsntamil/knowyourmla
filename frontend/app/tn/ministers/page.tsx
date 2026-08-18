import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import { generateItemListSchema } from "@/lib/seo/jsonld";
import { fetchCabinetList, fetchMLAs, fetchDistricts } from "@/services/api";
import CoverImage from "@/components/CoverImage";
import MinistersListClient from "@/components/ministers/MinistersListClient";
import SEOIntro from "@/components/seo/SEOIntro";
import FAQSection from "@/components/seo/FAQSection";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ItemListSchema from "@/components/seo/ItemListSchema";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import { LATEST_ELECTION_YEAR } from "@/lib/constants/elections";
import { MinisterItem } from "@/types/models";
import Link from "next/link";

export const revalidate = 86400;

export async function generateMetadata() {
  const currentYear = parseInt(LATEST_ELECTION_YEAR);
  const nextYear = currentYear + 5;

  const [cabinetMinisters, districts] = await Promise.all([
    fetchCabinetList(currentYear.toString()),
    fetchDistricts()
  ]);

  const ministerNames = cabinetMinisters.map((m: any) => m.name);
  const portfolios = new Set<string>();
  cabinetMinisters.forEach((m: any) => m.portfolios.forEach((p: string) => portfolios.add(p)));
  
  const repDistricts = new Set<string>();
  districts.forEach((d: any) => {
    if (d.representatives && d.representatives.length > 0) {
      repDistricts.add(d.name);
    }
  });

  const dynamicKeywords = [
    ...ministerNames,
    ...Array.from(portfolios),
    ...Array.from(repDistricts).map(d => `${d} District Representative`)
  ].filter(Boolean);

  const topMinisters = ministerNames.slice(0, 3).join(", ");

  return buildMetadata({
    title: `Tamil Nadu Ministers List ${currentYear}-${nextYear} | Cabinet & District In-charge Ministers`,
    description: `Complete list of Cabinet Ministers in Tamil Nadu for the ${currentYear}-${nextYear} assembly including ${topMinisters}. View portfolios, contact details, and district in-charge ministers.`,
    path: "/tn/ministers",
    keywords: [`Ministers List ${currentYear}`, `Tamil Nadu Ministers`, `Cabinet Ministers TN`, `District In-charge Minister Tamil Nadu`, "Tamil Nadu Portfolios", "TN Politics", ...dynamicKeywords]
  });
}

export default async function MinistersListPage() {
  const currentYear = parseInt(LATEST_ELECTION_YEAR);
  const [cabinetMinisters, { mlas }, districts] = await Promise.all([
    fetchCabinetList(currentYear.toString()),
    fetchMLAs(currentYear),
    fetchDistricts()
  ]);

  // Merge MLA details (Constituency, Party, colors) into Minister list
  const mlaMap = new Map(mlas.map(mla => [mla.person_id, mla]));

  // Build map of person_id -> districts they represent
  const repMap = new Map<string, {name: string, slug: string}[]>();
  districts.forEach(d => {
    d.representatives?.forEach(rep => {
      if (!repMap.has(rep.person_id)) {
        repMap.set(rep.person_id, []);
      }
      repMap.get(rep.person_id)!.push({ name: d.name, slug: d.slug || d.id.replace("DISTRICT#", "").toLowerCase() });
    });
  });

  const enrichedMinisters: MinisterItem[] = cabinetMinisters.map((m: MinisterItem) => {
    const mlaMatch = mlaMap.get(m.person_id);
    return {
      ...m,
      constituency: mlaMatch?.constituency,
      constituency_id: mlaMatch?.constituency_id,
      party: mlaMatch?.party,
      party_logo_url: mlaMatch?.party_logo_url,
      party_color_bg: mlaMatch?.party_color_bg,
      party_color_text: mlaMatch?.party_color_text,
      party_color_border: mlaMatch?.party_color_border,
      representative_districts: repMap.get(m.person_id) || [],
    };
  });

  const faqs = [
    {
      question: "How many Ministers are there in the Tamil Nadu Cabinet?",
      answer: `There are currently ${enrichedMinisters.length} ministers in the Tamil Nadu Cabinet, headed by the Chief Minister.`
    },
    {
      question: "How are portfolios allocated to Ministers?",
      answer: "Portfolios are allocated by the Governor on the advice of the Chief Minister. A single minister may handle multiple departments and portfolios."
    },
    {
      question: "Can I find which minister represents my constituency?",
      answer: "Yes, you can use the search bar above to type your constituency name and see if your elected MLA is a serving Cabinet Minister."
    },
    {
      question: "What is a District In-charge Minister in Tamil Nadu?",
      answer: "A District In-charge Minister is a cabinet minister appointed by the Chief Minister to oversee the development projects and administrative reviews of a specific district."
    }
  ];

  const breadcrumbs = [
    commonBreadcrumbs.home,
    { name: "Ministers", item: "https://www.knowyourmla.in/tn/ministers" }
  ];

  const itemListData = enrichedMinisters.map((m: MinisterItem) => ({
    name: m.name,
    url: `https://www.knowyourmla.in/tn/mla/${m.person_id?.replace("PERSON#", "")}`
  }));

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-gold/30">
      <BreadcrumbSchema items={breadcrumbs} />
      <ItemListSchema items={itemListData} />
      
      <CoverImage title="Tamil Nadu Ministers">
        <div className="flex flex-col items-center space-y-4">
          <Badge variant="brand" size="sm" dot>Current Cabinet</Badge>
          <nav className="flex justify-center items-center space-x-2 text-sm font-black uppercase tracking-widest text-slate-300">
            <Link href="/tn" className="hover:text-white transition-colors">Home</Link>
            <span className="opacity-50">/</span>
            <span className="text-brand-gold">Ministers</span>
          </nav>
        </div>
      </CoverImage>
      
      <main className="max-w-7xl mx-auto px-4 py-16 space-y-12">
        <SEOIntro 
          h1="Tamil Nadu Cabinet & District In-charge Ministers"
          intro="This page provides the complete Tamil Nadu Ministers list with their respective portfolios, constituencies, district in-charge assignments, and party information. Browse the active cabinet members serving the state."
        />

        <SectionHeader 
          title="Cabinet Members" 
          subtitle="Displaying all active ministers and their portfolios"
          badge={
            <Badge variant="brand" size="md" dot>
              {enrichedMinisters.length} Ministers
            </Badge>
          }
          className="mb-12"
        />

        <MinistersListClient initialMinisters={enrichedMinisters} />

        <div className="pt-16 border-t border-slate-100 dark:border-slate-800">
          <FAQSection faqs={faqs} />
        </div>
      </main>
    </div>
  );
}
