import { NextRequest, NextResponse } from "next/server";
import { PartyService } from "@/lib/services/party.service";

export async function GET(request: NextRequest) {
  const service = new PartyService();
  try {
    const parties = await service.getAllParties();
    return NextResponse.json(parties);
  } catch (error: any) {
    console.error("Error in GET /api/v2/parties:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
