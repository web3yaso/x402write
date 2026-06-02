import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { isAddress } from "viem";

const SLUG_RE = /^[a-z0-9-]{1,80}$/;
const HEX32 = /^0x[0-9a-fA-F]{64}$/;
const PRICE_MIN = 50000n; // $0.05 * 1e6
const PRICE_MAX = 50000000n; // $50 * 1e6
const INDEX_PATH = resolve(process.cwd(), "data/attestation-index.json");

export type AttestationRecord = {
  slug: string;
  attestationUID: string;
  txHash: string;
  author: string;
  priceUSDC: string;
  publishedAt: number;
  version: number;
  disclaimerHash: string;
};

export function validateAttestationInput(x: AttestationRecord): void {
  if (!SLUG_RE.test(x.slug)) throw new Error("invalid slug");
  if (!HEX32.test(x.attestationUID)) throw new Error("invalid attestationUID");
  if (!HEX32.test(x.txHash)) throw new Error("invalid txHash");
  if (!isAddress(x.author)) throw new Error("invalid author address");
  let price: bigint;
  try { price = BigInt(x.priceUSDC); } catch { throw new Error("invalid priceUSDC"); }
  if (price < PRICE_MIN || price > PRICE_MAX) throw new Error("price out of range");
  if (x.version !== 1) throw new Error("version must be 1");
  if (!Number.isInteger(x.publishedAt) || x.publishedAt <= 0) throw new Error("invalid publishedAt");
  if (x.publishedAt > Math.floor(Date.now() / 1000)) throw new Error("publishedAt in the future");
  if (!HEX32.test(x.disclaimerHash)) throw new Error("invalid disclaimerHash");
}

export function readIndex(): AttestationRecord[] {
  if (!existsSync(INDEX_PATH)) return [];
  return JSON.parse(readFileSync(INDEX_PATH, "utf8"));
}

export function hasSlug(slug: string): boolean {
  return readIndex().some((r) => r.slug === slug);
}

export function findRecord(slug: string): AttestationRecord | undefined {
  return readIndex().find((r) => r.slug === slug);
}

/**
 * First-write-wins: a slug can only be claimed once. This prevents an attacker
 * from re-attesting an existing slug as themselves and REPLACING the record
 * (authorship/payout hijack). Re-publishing requires manually clearing the entry.
 * Writes atomically (temp file + rename) to avoid torn writes under concurrency.
 */
export function appendIndex(rec: AttestationRecord): void {
  const all = readIndex();
  if (all.some((r) => r.slug === rec.slug)) throw new Error("slug already published");
  all.push(rec);
  const tmp = `${INDEX_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(all, null, 2) + "\n");
  renameSync(tmp, INDEX_PATH);
}
