import { NextRequest, NextResponse } from "next/server";
import { LATEST_ELECTION_YEAR } from "@/lib/constants/elections";
import { MLAService } from "@/lib/services/mla.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || LATEST_ELECTION_YEAR);
  
  const service = new MLAService();
  try {
    const mlas = await service.getCurrentMLAs(year);
    return NextResponse.json(mlas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
