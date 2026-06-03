import { NextRequest, NextResponse } from "next/server";
import { listAgentCatalog } from "@/lib/reports";

// Free, public discovery endpoint: an agent lists the catalog (metadata + price)
// here, then pays for a specific article at GET /api/v1/articles/{slug}.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") ?? undefined;
  const articles = listAgentCatalog(q);
  return NextResponse.json({ count: articles.length, articles }, { headers: CORS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Reads the attestation index per request (newly published articles show up live).
export const dynamic = "force-dynamic";
