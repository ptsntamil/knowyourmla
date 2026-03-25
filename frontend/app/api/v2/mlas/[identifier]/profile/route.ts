import { NextRequest, NextResponse } from "next/server";
import { MLAService } from "@/lib/services/mla.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await params;
  const service = new MLAService();
  try {
    const profile = await service.getMLAProfile(decodeURIComponent(identifier));
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
