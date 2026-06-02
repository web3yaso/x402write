import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Hackathon stub (no LLM, §5 Story 6): the companion is pre-baked + ingested.
 * /publish calls this after attestation; it just reports whether the pre-baked
 * public companion exists ("生成中 → 完成" UX). Real generation is post-MVP.
 */
export async function POST(req: Request) {
  let slug: string;
  try {
    ({ slug } = await req.json());
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!/^[a-z0-9-]{1,80}$/.test(slug ?? "")) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }
  const ready = existsSync(resolve(process.cwd(), `content/companions/${slug}.md`));
  if (!ready) {
    return NextResponse.json({ error: "no pre-baked companion" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, slug, status: "ready" });
}
