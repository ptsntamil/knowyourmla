import { NextRequest, NextResponse } from "next/server";
import { MLAService } from "@/lib/services/mla.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || "2021");
  
  const service = new MLAService();
  try {
    const mlas = await service.getCurrentMLAs(year);
    return NextResponse.json(mlas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
