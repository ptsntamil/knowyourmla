import { NextRequest, NextResponse } from "next/server";
import { ElectionAnalyticsService } from "@/lib/services/election-analytics.service";

const service = new ElectionAnalyticsService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || "2026");

    const result = await service.getPollingStationResults(id, year);

    if (!result) {
      return NextResponse.json({ error: "No polling results found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error fetching polling results:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
