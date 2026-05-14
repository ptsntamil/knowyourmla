import { NextRequest, NextResponse } from "next/server";
import { SearchService } from "@/lib/services/search.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const limitStr = searchParams.get("limit") || "7";
  const limit = parseInt(limitStr);

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  const service = new SearchService();
  try {
    const results = await service.search(query, limit);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
