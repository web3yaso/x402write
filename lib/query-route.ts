/**
 * Map a reader's free-text question to the best catalog destination.
 *
 * Demo-grade intent routing: a few keyword rules point a recognised question at a
 * specific article; anything unmatched (including empty input) falls back to the
 * full `/reports` catalog. Add a rule per article as the catalog grows.
 */
type Rule = { slug: string; all?: string[]; any: string[] };

const RULES: Rule[] = [
  // "为 web3 公司工作，有什么风险？" → 违法用工
  {
    slug: "web3-illegal-employment",
    all: ["web3"],
    any: ["工作", "用工", "上班", "雇", "打工", "入职", "员工", "劳动"],
  },
];

export function routeForQuery(query: string): string {
  const q = query.trim().toLowerCase();
  if (!q) return "/reports";
  for (const r of RULES) {
    const allOk = (r.all ?? []).every((k) => q.includes(k.toLowerCase()));
    const anyOk = r.any.some((k) => q.includes(k.toLowerCase()));
    if (allOk && anyOk) return `/reports/${r.slug}`;
  }
  return "/reports";
}
