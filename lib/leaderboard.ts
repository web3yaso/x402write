import { readIndex } from "./attestation-index";
import { readPaymentLog } from "./payment-log";
import { getReportMeta } from "./reports";

export type LeaderboardRow = {
  rank: string;   // "01".."10"
  name: string;
  desc: string;
  articles: string;
  earned: string; // "$X.XX"
};
export type WriterStats = { totalPurchased: number; totalEarned: string; authorCount: number };

function fmtUsd(atomic: bigint): string {
  return "$" + (Number(atomic) / 1e6).toFixed(2);
}

/** Aggregate published authors (by frontmatter authorName) + their paid earnings.
 *  Authors with no payments still appear at $0.00. */
export function listLeaderboard(): LeaderboardRow[] {
  const index = readIndex();
  const log = readPaymentLog();

  type Agg = { name: string; earned: bigint; slugs: Set<string>; sampleSlug: string };
  const byName = new Map<string, Agg>();
  const nameBySlug = new Map<string, string>();

  for (const r of index) {
    let name: string;
    try { name = getReportMeta(r.slug).authorName; } catch { continue; }
    nameBySlug.set(r.slug, name);
    const cur = byName.get(name) ?? { name, earned: 0n, slugs: new Set<string>(), sampleSlug: r.slug };
    cur.slugs.add(r.slug);
    byName.set(name, cur);
  }
  for (const p of log) {
    const name = nameBySlug.get(p.slug);
    if (!name) continue;
    const cur = byName.get(name);
    if (!cur) continue;
    try { cur.earned += BigInt(p.amount); } catch { /* skip malformed */ }
  }

  return [...byName.values()]
    .map((agg) => {
      let desc = agg.name;
      try {
        const m = getReportMeta(agg.sampleSlug);
        desc = [m.authorOrg, ...(m.tags ?? [])].filter(Boolean).join(" · ");
      } catch { /* keep name */ }
      return { name: agg.name, desc, articles: String(agg.slugs.size), earnedAtomic: agg.earned };
    })
    .sort((a, b) => (b.earnedAtomic > a.earnedAtomic ? 1 : b.earnedAtomic < a.earnedAtomic ? -1 : 0))
    .slice(0, 10)
    .map((r, i) => ({
      rank: String(i + 1).padStart(2, "0"),
      name: r.name,
      desc: r.desc,
      articles: r.articles,
      earned: fmtUsd(r.earnedAtomic),
    }));
}

export function getWriterStats(): WriterStats {
  const log = readPaymentLog();
  const total = log.reduce((acc, p) => { try { return acc + BigInt(p.amount); } catch { return acc; } }, 0n);
  const names = new Set<string>();
  for (const r of readIndex()) { try { names.add(getReportMeta(r.slug).authorName); } catch {} }
  return { totalPurchased: log.length, totalEarned: fmtUsd(total), authorCount: names.size };
}
