import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { decryptContent } from "./content-crypto";
import { readIndex, type AttestationRecord } from "./attestation-index";

const REPORTS_DIR = resolve(process.cwd(), "content/reports");
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export type ReportMeta = {
  slug: string;
  title: string;
  authorName: string;
  authorOrg?: string;
  tags: string[];
  summary: string;
  publishedAt: string;
  sourceUrl?: string;
};

function assertSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) throw new Error(`invalid slug: ${slug}`);
}

export function listReportSlugs(): string[] {
  return readdirSync(REPORTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""))
    .filter((s) => SLUG_RE.test(s));
}

export function getReportMeta(slug: string): ReportMeta {
  assertSlug(slug);
  const file = resolve(REPORTS_DIR, `${slug}.mdx`);
  if (!existsSync(file)) throw new Error(`report not found: ${slug}`);
  const { data } = matter(readFileSync(file, "utf8"));
  return { slug, ...(data as Omit<ReportMeta, "slug">) };
}

/** Decrypts the body server-side. Requires CONTENT_ENC_KEY. Never call from client code. */
export function getReportBody(slug: string): string {
  assertSlug(slug);
  const key = process.env.CONTENT_ENC_KEY;
  if (!key) throw new Error("CONTENT_ENC_KEY not set");
  const file = resolve(REPORTS_DIR, `${slug}.enc`);
  if (!existsSync(file)) throw new Error(`encrypted body not found: ${slug}`);
  return decryptContent(readFileSync(file, "utf8"), key);
}

export type PublishedReport = {
  meta: ReportMeta;
  record: AttestationRecord;
  priceUsd: string; // formatted "$0.30"
};

function formatUsdc(priceUSDC: string): string {
  return "$" + (Number(BigInt(priceUSDC)) / 1e6).toFixed(2);
}

/** Reports that have an on-chain attestation recorded in the index. */
export function listPublishedReports(): PublishedReport[] {
  return readIndex()
    .filter((r) => { try { getReportMeta(r.slug); return true; } catch { return false; } })
    .map((r) => ({ meta: getReportMeta(r.slug), record: r, priceUsd: formatUsdc(r.priceUSDC) }));
}

/** The home "收录文章" catalog: every published report, newest first. No hardcoded
 *  exclusions — a freshly published article (e.g. the /publish import example) appears
 *  here as soon as it lands in the index, matching the /reports page. */
export function listReaderCatalog(): PublishedReport[] {
  return listPublishedReports().sort((a, b) =>
    a.meta.publishedAt < b.meta.publishedAt ? 1 : a.meta.publishedAt > b.meta.publishedAt ? -1 : 0,
  );
}

/** A single published report, or null if the slug is not published (not in the index). */
export function getPublishedReport(slug: string): PublishedReport | null {
  const rec = readIndex().find((r) => r.slug === slug);
  if (!rec) return null;
  let meta: ReportMeta;
  try { meta = getReportMeta(slug); } catch { return null; }
  return { meta, record: rec, priceUsd: formatUsdc(rec.priceUSDC) };
}
