import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const LOG_PATH = resolve(process.cwd(), "data/payment-log.json");
export type PaymentEntry = { slug: string; payer: string; amount: string; txHash: string; ts: number };

export function readPaymentLog(): PaymentEntry[] {
  if (!existsSync(LOG_PATH)) return [];
  return JSON.parse(readFileSync(LOG_PATH, "utf8"));
}
export function appendPaymentLog(e: PaymentEntry): void {
  const all = readPaymentLog();
  all.push(e);
  const tmp = `${LOG_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(all, null, 2) + "\n");
  renameSync(tmp, LOG_PATH);
}
