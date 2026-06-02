import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import {
  getX402Server,
  X402_NETWORK,
  slugFromPath,
  payToForSlug,
  priceUsdForSlug,
} from "@/lib/x402-server";
import { getReportBody, getReportMeta } from "@/lib/reports";
import { getCompanionPaidZone } from "@/lib/companions";
import { findRecord } from "@/lib/attestation-index";
import { appendPaymentLog } from "@/lib/payment-log";
import type { HTTPRequestContext } from "@x402/core/server";

const SLUG_RE = /^[a-z0-9-]{1,80}$/;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const handler = async (req: NextRequest): Promise<NextResponse> => {
  const slug = slugFromPath(new URL(req.url).pathname);
  const meta = getReportMeta(slug);
  const rec = findRecord(slug)!;
  const content = getReportBody(slug);
  const companion = getCompanionPaidZone(slug);
  // Handler only runs after the facilitator verified payment → log it (for the leaderboard, Phase 5).
  appendPaymentLog({
    slug,
    payer: req.headers.get("x-payer") ?? rec.author,
    amount: rec.priceUSDC,
    txHash: rec.attestationUID,
    ts: Date.now(),
  });
  return NextResponse.json(
    {
      slug,
      title: meta.title,
      content,
      companion,
      citation: {
        author: meta.authorName,
        attestationUID: rec.attestationUID,
        publishedAt: meta.publishedAt,
      },
    },
    { headers: CORS },
  );
};

const paid = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      network: X402_NETWORK,
      payTo: (ctx: HTTPRequestContext) => payToForSlug(slugFromPath(ctx.path)),
      price: (ctx: HTTPRequestContext) => priceUsdForSlug(slugFromPath(ctx.path)),
    },
    mimeType: "application/json",
    description: "x402write — paid article full text + companion",
  },
  getX402Server(),
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  // §8.4: slug whitelist BEFORE the paywall. Invalid/unpublished → 404, never a 402 paywall.
  if (!SLUG_RE.test(slug) || !findRecord(slug)) {
    return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS });
  }
  return paid(req);
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export const dynamic = "force-dynamic";
