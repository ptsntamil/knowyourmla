import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import { fetchCabinetList } from "@/services/api";
import { fetchMLAVehicles } from "@/services/api";
import CoverImage from "@/components/CoverImage";
import SEOIntro from "@/components/seo/SEOIntro";
import FAQSection from "@/components/seo/FAQSection";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ItemListSchema from "@/components/seo/ItemListSchema";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import { LATEST_ELECTION_YEAR } from "@/lib/constants/elections";
import Link from "next/link";
import MLAVehiclesListClient from "@/components/vehicles/MLAVehiclesListClient";

export const revalidate = 86400;

export async function generateMetadata() {
  const currentYear = parseInt(LATEST_ELECTION_YEAR);
  const vehicleData = await fetchMLAVehicles(currentYear);
  const mlaNames = vehicleData.mlas.slice(0, 10).map((m: any) => m.name).join(", ");
  const dynamicKeywords = vehicleData.mlas.slice(0, 20).map((m: any) => `${m.name} Cars`);

  return buildMetadata({
    title: `Tamil Nadu MLAs Vehicle Details ${currentYear} | Cars & Two Wheelers`,
    description: `Complete list of vehicles owned by Tamil Nadu MLAs including ${mlaNames}. View cars, two-wheelers, and their values declared in election affidavits.`,
    path: "/tn/vehicles",
    keywords: [`MLA Vehicles TN`, `Tamil Nadu MLAs Cars`, `MLAs Two wheelers`, `MLA Assets TN`, ...dynamicKeywords]
  });
}

export default async function VehiclesListPage() {
  const currentYear = parseInt(LATEST_ELECTION_YEAR);
  const [cabinetMinisters, vehicleData] = await Promise.all([
    fetchCabinetList(currentYear.toString()),
    fetchMLAVehicles(currentYear)
  ]);

  const { mlas } = vehicleData;

  const ministerMap = new Map(cabinetMinisters.map((m: any) => [m.person_id, m]));

  const enrichedMLAs = mlas.map((mla: any) => {
    const minister = ministerMap.get(mla.person_id);
    return {
      ...mla,
      current_position: minister ? minister.designation : "MLA",
    };
  });

  const faqs = [
    {
      question: "Where do these vehicle details come from?",
      answer: "The vehicle details are extracted from the official election affidavits filed by the MLAs during their nomination."
    },
    {
      question: "Are all vehicles listed here?",
      answer: "Only the vehicles declared by the MLA (including those of spouse and dependents) in their election affidavit are listed."
    }
  ];

  const breadcrumbs = [
    commonBreadcrumbs.home,
    { name: "Vehicles", item: "https://www.knowyourmla.in/tn/vehicles" }
  ];

  const itemListData = enrichedMLAs.map((m: any) => ({
    name: m.name,
    url: `https://www.knowyourmla.in/tn/mla/${m.slug}`
  }));

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-gold/30">
      <BreadcrumbSchema items={breadcrumbs} />
      <ItemListSchema items={itemListData} />
      
      <CoverImage title="Tamil Nadu MLAs Vehicle Dashboard">
        <div className="flex flex-col items-center space-y-4">
          <Badge variant="brand" size="sm" dot>Elected Members</Badge>
          <nav className="flex justify-center items-center space-x-2 text-sm font-black uppercase tracking-widest text-slate-300">
            <Link href="/tn" className="hover:text-white transition-colors">Home</Link>
            <span className="opacity-50">/</span>
            <span className="text-brand-gold">Vehicles</span>
          </nav>
        </div>
      </CoverImage>
      
      <main className="max-w-7xl mx-auto px-4 py-16 space-y-12">
        <SEOIntro 
          h1="Tamil Nadu MLAs Vehicles Information"
          intro="Explore the details of vehicles (cars, two-wheelers, etc.) declared by Tamil Nadu MLAs in their election affidavits. View the count, types, and values of these vehicles."
        />

        <SectionHeader 
          title="Vehicle Declarations" 
          subtitle="Displaying all active MLAs and their declared vehicles"
          badge={
            <Badge variant="brand" size="md" dot>
              {enrichedMLAs.length} MLAs
            </Badge>
          }
          className="mb-12"
        />

        <MLAVehiclesListClient initialData={enrichedMLAs} />

        <div className="pt-16 border-t border-slate-100 dark:border-slate-800">
          <FAQSection faqs={faqs} />
        </div>
      </main>
    </div>
  );
}
