import { NextRequest, NextResponse } from "next/server";
import { ConstituencyService } from "@/lib/services/constituency.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get("district_id") || undefined;
  
  const service = new ConstituencyService();
  try {
    const constituencies = await service.listConstituencies(districtId);
    return NextResponse.json(constituencies);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
