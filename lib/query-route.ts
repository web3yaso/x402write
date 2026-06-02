/**
 * Map a reader's free-text question to the best catalog destination.
 *
 * Demo-grade intent routing: a few keyword rules point a recognised question at a
 * specific article; anything unmatched (including empty input) falls back to the
 * full `/reports` catalog. Add a rule per article as the catalog grows.
 */
type Rule = { slug: string; all?: string[]; any: string[] };

// Ordered: more specific rules first (the first match wins).
const RULES: Rule[] = [
  // "为 web3 公司工作，有什么风险？" → 违法用工 (needs the web3 qualifier)
  {
    slug: "web3-illegal-employment",
    all: ["web3"],
    any: ["工作", "用工", "上班", "雇", "打工", "入职", "员工", "劳动", "发薪", "工资"],
  },
  // OTC 冻卡 / 虚拟货币刑事定责 → 姚前案
  {
    slug: "yaoqian-crypto-liability",
    any: [
      "otc", "出金", "入金", "冻卡", "冻结", "银行卡", "工行",
      "刑事", "定责", "判刑", "被抓", "帮信", "洗钱", "跑分", "u商",
      "虚拟货币", "数字货币", "涉币", "买币", "卖币", "姚前",
    ],
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
