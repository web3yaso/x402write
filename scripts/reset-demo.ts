/**
 * Reset the demo to a clean pre-recording state:
 *   - removes the /publish import-example article (onchain-partnership-rwa) from the
 *     attestation index, so the live /publish → Sign+Attest demo re-adds it
 *     (appendIndex is first-write-wins, so a stale entry would block re-publishing);
 *   - clears the payment log, so EARNED starts at $0 and visibly rises during the demo.
 *
 * Keeps the seed articles (姚前案 / 违法用工) and ALL content files (.mdx/.enc/companions).
 * Re-runnable after each demo run.
 *
 *   node_modules/.bin/tsx scripts/reset-demo.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const IMPORT_EXAMPLE = "onchain-partnership-rwa";
const indexPath = resolve(process.cwd(), "data/attestation-index.json");
const logPath = resolve(process.cwd(), "data/payment-log.json");

const index: Array<{ slug: string }> = existsSync(indexPath)
  ? JSON.parse(readFileSync(indexPath, "utf8"))
  : [];
const kept = index.filter((r) => r.slug !== IMPORT_EXAMPLE);
writeFileSync(indexPath, JSON.stringify(kept, null, 2) + "\n");
writeFileSync(logPath, "[]\n");

console.log(
  `reset-demo: removed '${IMPORT_EXAMPLE}' from index (kept ${kept.length} seed${kept.length === 1 ? "" : "s"}); payment-log cleared.`,
);
