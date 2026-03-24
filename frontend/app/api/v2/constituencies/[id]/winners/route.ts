import { NextRequest, NextResponse } from "next/server";
import { ConstituencyService } from "@/lib/services/constituency.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = new ConstituencyService();
  try {
    const history = await service.getWinnerHistory(decodeURIComponent(id));
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
