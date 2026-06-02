# Phase 5 — Leaderboard from real payment data (Story 5)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Switch the home "For Writers" tab's `TopEarningAuthors` (and the two stats cards) from hardcoded mock to a real aggregate over `data/payment-log.json` joined with `data/attestation-index.json`. After a paid unlock (Phase 4), refreshing the home page shows the demo author's EARNED rise.

**Architecture:** `lib/leaderboard.ts` aggregates: base set = every author in the attestation index (so a published-but-unpaid author still appears at $0.00 — the §5 Story 5 seed-placeholder behavior); for each, `articles` = count of their published slugs, `earned` = SUM of `amount` over payment-log rows whose `slug` belongs to that author. Ranked by earned desc, top 10. The fs reads are **server-only**, so the data is computed in the server `app/page.tsx` and threaded as serializable props down through `HomeTabs` → `WritersPanel` → `TopEarningAuthors` (the existing client components just render passed data instead of a hardcoded array).

**Why prop-threading:** `TopEarningAuthors` is rendered inside the client `HomeTabs`/`WritersPanel`, so it can't read the filesystem itself. The server home page reads the aggregate once and passes it as props (plain arrays/objects — serializable across the RSC boundary).

**Scope:** leaderboard rows + the two writer stats cards become real. Payment-log is written by Phase 4's paid endpoint. (Note: payment-log `txHash` currently stores the attestation UID as a placeholder — the leaderboard only uses `slug`/`amount`/`ts`, so this is fine; do NOT surface `txHash` as a settlement hash.)

**Series:** Plan 7 (Phase 5). Spec: HACKATHON §5 Story 5. Prior: `lib/payment-log.ts` (`readPaymentLog`), `lib/attestation-index.ts` (`readIndex`), `lib/reports.ts` (`getReportMeta`); `components/home/{TopEarningAuthors,WritersPanel,HomeTabs}.tsx` + `app/page.tsx`.

---

### Task 1: `lib/leaderboard.ts` (TDD)

**Files:** `lib/leaderboard.ts`, `lib/leaderboard.test.ts`

- [x] **Step 1: Failing test** — `lib/leaderboard.test.ts` (the seed `onchain-partnership-rwa` is in the index; payment-log may be empty → seed author appears at $0.00):
```ts
import { describe, it, expect } from "vitest";
import { listLeaderboard, getWriterStats } from "./leaderboard";

describe("leaderboard", () => {
  it("includes every indexed author, even with no payments (at $0.00)", () => {
    const rows = listLeaderboard();
    const seed = rows.find((r) => r.name === "Alex Fan");
    expect(seed).toBeTruthy();
    expect(seed!.articles).toBeGreaterThanOrEqual(1);
    expect(seed!.earned).toMatch(/^\$\d/);          // formatted "$X.XX"
    expect(seed!.rank).toMatch(/^\d{2}$/);          // "01".."10"
  });

  it("is ranked by earned descending and capped at 10", () => {
    const rows = listLeaderboard();
    expect(rows.length).toBeLessThanOrEqual(10);
    const nums = rows.map((r) => Number(r.earned.replace(/[$,]/g, "")));
    expect(nums).toEqual([...nums].sort((a, b) => b - a));
  });

  it("reports writer stats (totals)", () => {
    const s = getWriterStats();
    expect(s.totalEarned).toMatch(/^\$/);
    expect(s.totalPurchased).toBeGreaterThanOrEqual(0);
    expect(s.authorCount).toBeGreaterThanOrEqual(1);
  });
});
```

- [x] **Step 2: Run → FAIL.** `pnpm test lib/leaderboard.test.ts`

- [x] **Step 3: Implement `lib/leaderboard.ts`:**
```ts
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

function fmtUsd(atomicSum: bigint): string {
  return "$" + (Number(atomicSum) / 1e6).toFixed(2);
}

/** Aggregate published authors + their paid earnings. Authors with no payments appear at $0.00. */
export function listLeaderboard(): LeaderboardRow[] {
  const index = readIndex();
  const log = readPaymentLog();

  // slug -> author address (from the index)
  const authorBySlug = new Map(index.map((r) => [r.slug, r.author.toLowerCase()]));

  // author -> { earned, slugs }
  type Agg = { earned: bigint; slugs: Set<string>; sampleSlug: string };
  const byAuthor = new Map<string, Agg>();
  for (const r of index) {
    const a = r.author.toLowerCase();
    const cur = byAuthor.get(a) ?? { earned: 0n, slugs: new Set(), sampleSlug: r.slug };
    cur.slugs.add(r.slug);
    byAuthor.set(a, cur);
  }
  for (const p of log) {
    const a = authorBySlug.get(p.slug);
    if (!a) continue;
    const cur = byAuthor.get(a);
    if (!cur) continue;
    try { cur.earned += BigInt(p.amount); } catch { /* skip malformed */ }
  }

  const rows = [...byAuthor.entries()]
    .map(([author, agg]) => {
      let name = author.slice(0, 6) + "…" + author.slice(-4);
      let desc = author;
      try {
        const meta = getReportMeta(agg.sampleSlug);
        name = meta.authorName || name;
        desc = [meta.authorOrg, ...(meta.tags ?? [])].filter(Boolean).join(" · ");
      } catch { /* fall back to address */ }
      return { author, name, desc, articles: String(agg.slugs.size), earnedAtomic: agg.earned };
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

  return rows;
}

export function getWriterStats(): WriterStats {
  const log = readPaymentLog();
  const total = log.reduce((acc, p) => { try { return acc + BigInt(p.amount); } catch { return acc; } }, 0n);
  return {
    totalPurchased: log.length,
    totalEarned: fmtUsd(total),
    authorCount: new Set(readIndex().map((r) => r.author.toLowerCase())).size,
  };
}
```

- [x] **Step 4: Run → PASS.** `pnpm test lib/leaderboard.test.ts`. Then full `pnpm test`. Commit:
```bash
git add lib/leaderboard.ts lib/leaderboard.test.ts
git commit -m "feat: leaderboard aggregate from payment-log + index (Phase 5 T1)"
```

---

### Task 2: thread real data into the home For Writers tab

**Files:** `app/page.tsx`, `components/home/HomeTabs.tsx`, `components/home/WritersPanel.tsx`, `components/home/TopEarningAuthors.tsx`

- [x] **Step 1: `app/page.tsx` (server)** — compute the aggregate and pass it down:
```tsx
import { listLeaderboard, getWriterStats } from "@/lib/leaderboard";
// ...
const leaderboard = listLeaderboard();
const writerStats = getWriterStats();
// ...
<main><HomeTabs leaderboard={leaderboard} writerStats={writerStats} /></main>
```

- [x] **Step 2: `HomeTabs.tsx`** — accept and forward the props:
```tsx
import type { LeaderboardRow, WriterStats } from "@/lib/leaderboard";
export function HomeTabs({ leaderboard, writerStats }: { leaderboard: LeaderboardRow[]; writerStats: WriterStats }) {
  // ...
  {tab === "writers" && <WritersPanel leaderboard={leaderboard} writerStats={writerStats} />}
}
```
(Readers/Agents panels unchanged.)

- [x] **Step 3: `WritersPanel.tsx`** — accept props; replace the two hardcoded stat cards' values with `writerStats`; pass `leaderboard` to `TopEarningAuthors`:
- `Total Articles Purchased` value → `writerStats.totalPurchased.toLocaleString()` (delta line can stay or be removed/simplified).
- `Total Earned by Authors` value → `writerStats.totalEarned`.
- `<TopEarningAuthors rows={leaderboard} />`.

- [x] **Step 4: `TopEarningAuthors.tsx`** — accept `rows: LeaderboardRow[]` prop instead of the hardcoded `ROWS`. Render `rows.map(...)` with the existing `.lboard-row`/`.lb-pub` markup. Update the header count label `<span className="more">` from "1 author" to `{rows.length} author{rows.length === 1 ? "" : "s"}`. Keep the column headers + foot copy. If `rows` is empty, render the empty board (headers + foot) gracefully.
  - Update `components/home/TopEarningAuthors.test.tsx` accordingly: it now takes a `rows` prop — pass a small fixture array and assert the rows render (e.g. `render(<TopEarningAuthors rows={[{rank:"01",name:"Alex Fan",desc:"LXDAO",articles:"1",earned:"$0.00"}]} />)` → expect "Alex Fan" + "$0.00").

- [x] **Step 5: Verify** — `pnpm test` (update the TopEarningAuthors test) + `pnpm build` green. `pnpm dev`; `curl -s http://localhost:3000` then switch to For Writers in the browser → confirm the leaderboard shows the seed author (Alex Fan) with their real earned (likely `$0.00` until a payment, or the paid amount if Phase 4 was exercised). Confirm the two stats cards show real totals (e.g. `0` / `$0.00` on a fresh log, or the real numbers after payments).

- [x] **Step 6: Commit**
```bash
git add app/page.tsx components/home/HomeTabs.tsx components/home/WritersPanel.tsx components/home/TopEarningAuthors.tsx components/home/TopEarningAuthors.test.tsx
git commit -m "feat: For Writers leaderboard + stats from real payment data (Phase 5 T2)"
```

---

### Task 3: verification

- [x] `pnpm test && pnpm build` green.
- [x] **Demo loop (after a Phase-4 paid unlock):** with at least one row in `data/payment-log.json`, refresh the home page → For Writers → the demo author's EARNED reflects the sum (e.g. one $0.30 unlock → `$0.30`; a human + an agent unlock → `$0.60`). The two stats cards show the real purchase count + total. This closes §3.1 item 5 ("收益可见").
- [x] Note: `app/page.tsx` is now dynamic (reads the log per request). Confirm it's `ƒ` (dynamic) in the build output, or add `export const dynamic = "force-dynamic"` / `revalidate = 0` so the leaderboard isn't statically cached.

---

## Self-Review Notes
- **§5 Story 5 seed-placeholder:** authors from the index appear even with no payments (at $0.00), so the demo author is always on the board and visibly rises after payment.
- **Aggregation source:** earned = SUM(payment.amount) joined slug→author via the index; articles = count of the author's indexed slugs. No mock numbers remain.
- **Server-only fs reads:** the aggregate is computed in the server page and passed as serializable props; the client components only render.
- **Dynamic rendering:** the home page must not statically cache the leaderboard (Task 3 dynamic note).
- **Stats cards:** the previously-inconsistent mock stats (12,847 / $48,302.51) are replaced with real totals.

## Next
Phase 6 — polish + deploy: `DEPLOY.md` (Vercel env incl. CDP/CONTENT_ENC_KEY; note the `payment-log.json`/`attestation-index.json` filesystem-write caveat on serverless → KV/DB for prod), `.env.local.example` final pass, the 3-minute demo script, README.
