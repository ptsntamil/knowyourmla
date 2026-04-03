import { NextRequest, NextResponse } from "next/server";
import { PartyService } from "@/lib/services/party.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam && yearParam !== "all" ? parseInt(yearParam) : undefined;

  const service = new PartyService();
  
  try {
    const party = await service.getPartyBySlug(slug);
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const candidates = await service.getPartyCandidatesForYear(party.PK, year);
    return NextResponse.json(candidates);
  } catch (error: any) {
    console.error(`Error in GET /api/v2/parties/${slug}/candidates?year=${year}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
