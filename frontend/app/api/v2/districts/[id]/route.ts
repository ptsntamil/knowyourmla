import { NextRequest, NextResponse } from "next/server";
import { DistrictService } from "@/lib/services/district.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = new DistrictService();
  try {
    const details = await service.getDistrictDetails(decodeURIComponent(id));
    return NextResponse.json(details);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
