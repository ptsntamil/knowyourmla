import { NextResponse } from "next/server";
import { MLAService } from "@/lib/services/mla.service";

export async function GET() {
  const service = new MLAService();
  const res = await service.getMLAVehicles(2026);
  const vijay = res.mlas.filter(m => m.name.includes("VIJAY"));
  return NextResponse.json({ vijay });
}
