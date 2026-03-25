import { NextRequest, NextResponse } from "next/server";
import { DistrictService } from "@/lib/services/district.service";

export async function GET() {
  const service = new DistrictService();
  try {
    const districts = await service.getAllDistricts();
    return NextResponse.json(districts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
