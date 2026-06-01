import { keccak256, toBytes } from "viem";
import { getReportMeta, getReportBody, type ReportMeta } from "./reports";

const SEED_SLUG = "onchain-partnership-rwa";

export type PublishData = { meta: ReportMeta; contentHash: string };

/** MVP: any imported source maps to the seed article. */
export function getPublishData(): PublishData {
  const meta = getReportMeta(SEED_SLUG);
  const contentHash = keccak256(toBytes(getReportBody(SEED_SLUG)));
  return { meta, contentHash };
}
