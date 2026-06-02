import * as fs from "node:fs";
import { resolve } from "node:path";

const LOG_PATH = resolve(process.cwd(), "data/payment-log.json");
export type PaymentEntry = { slug: string; payer: string; amount: string; txHash: string; ts: number };

export function readPaymentLog(): PaymentEntry[] {
  if (!fs.existsSync(LOG_PATH)) return [];
  return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
}

/**
 * Append a payment entry. Best-effort: serverless filesystems (e.g. Vercel) are
 * read-only, so a write failure must NOT break an already-settled paid unlock —
 * the caller has been paid and the reader is owed their content. Returns whether
 * the entry persisted (false on a read-only FS); for durable prod logging, back
 * this with KV/DB (see DEPLOY.md).
 */
export function appendPaymentLog(e: PaymentEntry): boolean {
  try {
    const all = readPaymentLog();
    all.push(e);
    const tmp = `${LOG_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(all, null, 2) + "\n");
    fs.renameSync(tmp, LOG_PATH);
    return true;
  } catch (err) {
    console.warn("[payment-log] append failed (non-fatal):", (err as Error).message);
    return false;
  }
}
