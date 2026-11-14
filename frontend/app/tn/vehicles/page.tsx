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
import ShareButton from "@/components/ShareButton";
import { MLAVehicleItem, MLAVehicleResponse, MinisterItem } from "@/types/models";

export const revalidate = 86400;

export async function generateMetadata() {
  const currentYear = parseInt(LATEST_ELECTION_YEAR);
  const vehicleData: MLAVehicleResponse = await fetchMLAVehicles(currentYear);
  const mlaNames = vehicleData.mlas.slice(0, 10).map((m: MLAVehicleItem) => m.name).join(", ");
  const dynamicKeywords = vehicleData.mlas.slice(0, 20).map((m: MLAVehicleItem) => `${m.name} Cars`);

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

  const ministerMap = new Map(cabinetMinisters.map((m: MinisterItem) => [m.person_id, m]));

  const enrichedMLAs = mlas.map((mla: MLAVehicleItem) => {
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
    { name: "Vehicles", item: "https://knowyourmla.info/tn/vehicles" }
  ];

  const itemListData = enrichedMLAs.map((m: MLAVehicleItem) => ({
    name: m.name,
    url: `https://knowyourmla.info/tn/mla/${m.slug}`
  }));

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-gold/30">
      <BreadcrumbSchema items={breadcrumbs} />
      <ItemListSchema items={itemListData} />

      <CoverImage
        title="Tamil Nadu MLAs Vehicle Dashboard"
        subtitle={`Declared personal and family vehicles of all ${enrichedMLAs.length} elected MLAs of Tamil Nadu.`}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col items-start gap-3">
            <nav className="flex items-center flex-wrap gap-y-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-3 text-white/20">/</span>
              <Link href="/tn" className="hover:text-white transition-colors">TN</Link>
              <span className="mx-3 text-white/20">/</span>
              <span className="text-brand-gold">Vehicles</span>
            </nav>
            <Badge variant="brand" size="sm" dot>Elected Members</Badge>
          </div>

          <div className="flex items-center justify-start md:justify-end gap-4">
            <ShareButton
              title={`Tamil Nadu MLAs Vehicle Details ${currentYear} | Cars & Two Wheelers`}
              text={`Explore the complete list of cars and vehicles owned by Tamil Nadu MLAs declared in election affidavits on KnowYourMLA.`}
              url="/tn/vehicles"
              label="Share"
            />
          </div>
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
