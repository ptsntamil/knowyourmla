import { NextRequest, NextResponse } from "next/server";
import { PartyService } from "@/lib/services/party.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const yearStr = searchParams.get("year");
  const year = yearStr && yearStr !== "all" ? parseInt(yearStr) : undefined;
  
  const service = new PartyService();

  try {
    const party = await service.getPartyBySlug(slug);
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const [analytics, elections] = await Promise.all([
      service.getPartyAnalytics(party.PK, year),
      service.getPartyElections(party.PK)
    ]);

    return NextResponse.json({ 
      party, 
      analytics: analytics || { stats: {}, age: {}, assets: {}, elections: [], timeline: [] },
      availableElections: elections
    });
  } catch (error: any) {
    console.error(`Error in GET /api/v2/parties/${slug}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
