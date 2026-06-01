# Phase 3 — /reports list + /reports/[slug] detail (24% preview + paywall)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make published reports browsable — `/reports` lists on-chain reports (EAS badge), `/reports/[slug]` shows the editorial article with a ~24% markdown preview + a paywall card. Fixes the current 404 on `/reports/onchain-partnership-rwa`.

**Architecture:** Both pages are server components reading REAL data: `data/attestation-index.json` (which slugs are published + price/UID/author) joined with `lib/reports.ts` frontmatter meta; the detail page also decrypts the body server-side (`getReportBody`) and renders the first ~24% as markdown, then a teaser-fade + paywall card. The mockups' bespoke CSS is lifted into `app/globals.css` scoped under collision-safe wrappers (`.reports` for the list, `.article` for the detail — NOT generic names, learning from the `.pub` collision). Tokens are shared with home; the article view adds serif fonts.

**Scope / deferrals (explicit):**
- **This phase:** list cards + on-chain badge; detail header (title/byline/publishedAt/on-chain badge); 24% markdown preview; paywall card (price from EAS/index, lock copy, CTA, "100% 直达作者钱包"). `notFound()` for slugs not in the index.
- **Deferred to Phase 4 (x402):** the paywall CTA actually unlocking. For Phase 3 the CTA renders per design but is **disabled with a "全文解锁将在 x402 付费上线" note** — do NOT fake-unlock. The hidden full text stays unrendered.
- **Deferred to Phase 4.5 (companion):** the article's **Agent terminal mode** + the Agent Mode 配套区. Port ONLY the human editorial mode now.

**Tech Stack:** Next.js 16 App Router, `react-markdown` + `remark-gfm`, Vitest. Mockups: `docs/mockups/reports.html` (list), `docs/mockups/article.html` (detail, human mode = lines 393–501). Spec: `docs/HACKATHON.md` §5 Story 2 & 3, §7.

**Series:** Plan 4 (Phase 3). Prior: Phase 2 (EAS + ingestion; `lib/reports.ts`, `lib/attestation-index.ts`, `data/attestation-index.json` all exist; the seed `onchain-partnership-rwa` is published).

---

### Task 1: deps + fonts + CSS lifts (scoped)

**Files:** `package.json`, `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1: Install markdown renderer** — `pnpm add react-markdown remark-gfm`
- [ ] **Step 2: Add serif fonts** for the article view. In `app/layout.tsx`, extend the existing Google Fonts `<link>` href to also load `Spectral` (wght 400;500;600;800; ital 400) and `Noto Serif SC` (wght 400;500;600;700). Keep the existing Inter/JetBrains Mono/Noto Sans SC families.
- [ ] **Step 3: Lift the list CSS** from `docs/mockups/reports.html` into `app/globals.css`, scoped under `.reports` (prefix every page selector with `.reports `). Lift the page rules: search-bar/filters (if simple), `.cards`, `.card`(+`.card-top`/`.card-tags`/`.tag`/the on-chain `.badge`+`.chk`/`.card-foot`/price/author/`.eas`), section headers. Do NOT lift `.mast`/`.brand`/`.menu-*`/wallet/`.foot` (reused). Add `--ok` already present. Read reports.html's `<style>` for exact rules.
- [ ] **Step 4: Lift the article human-mode CSS** from `docs/mockups/article.html` into `app/globals.css`, scoped under `.article`. The article mockup has its OWN palette (`--paper #faf8f2`, serif vars) — to avoid clobbering the global tokens, define the article's palette + serif under `.article { --paper: …; --serif: …; … }` (CSS custom props scoped to the wrapper) and prefix component rules with `.article `. Lift: `.hm-mast`/`.hm-brand`/`.hm-back`, `.hm-grid`, `.hm-toc`/`.toc-item`, `.hm-article`/`.hm-pub`/`.hm-rule`/`.hm-title`/`.hm-deck`/`.hm-byline`(+av/name/role), `.hm-body`(+`.lead`/`.hm-h2`/`table`/`ul.acts`/`.do`/`.dont`/`p`/`strong`), `.teaser-fade`, `.pw`(+`.pw-lock`/`.pw-h`/`.pw-meta`/`.pw-price-row`/`.pw-price`/`.pw-price-note`/`.pw-cta`/`.pw-fine`). Do NOT lift the agent-mode (`.ag*`) CSS or `.mode-toggle` or `.unlock-only`/`.lock-only` gating (Phase 4/4.5). Map the article's `--paper`/`--ink` etc. by scoping them under `.article` so the page reads warm-paper while the rest of the site is unaffected.
  - `@keyframes` (e.g. blink) stay top-level (Phase 4.5 uses them; only add if needed now — skip blink).
- [ ] **Step 5: Verify build** — `pnpm build` compiles. Commit:
```bash
git add package.json pnpm-lock.yaml app/layout.tsx app/globals.css
git commit -m "chore: react-markdown + serif fonts + reports/article CSS lift (Phase 3 T1)"
```

---

### Task 2: data join + 24% preview slice (TDD)

**Files:** `lib/reports.ts` (extend), `lib/preview.ts` (+ test), `lib/reports.test.ts` (extend)

- [ ] **Step 1: Failing test** — `lib/preview.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { previewSlice } from "./preview";

const body = Array.from({ length: 10 }, (_, i) => `Para ${i} ` + "x".repeat(100)).join("\n\n");

describe("previewSlice", () => {
  it("returns roughly the requested fraction, cut at a paragraph boundary", () => {
    const p = previewSlice(body, 0.24);
    expect(p.length).toBeGreaterThan(0);
    expect(p.length).toBeLessThan(body.length);
    // ends at a paragraph boundary (no mid-paragraph cut): the slice is a prefix of body
    expect(body.startsWith(p)).toBe(true);
  });
  it("never returns the whole body for fraction < 1", () => {
    expect(previewSlice(body, 0.5).length).toBeLessThan(body.length);
  });
  it("handles short bodies without throwing", () => {
    expect(previewSlice("one para", 0.24)).toBeTypeOf("string");
  });
});
```

- [ ] **Step 2: Run → FAIL.** `pnpm test lib/preview.test.ts`

- [ ] **Step 3: Implement `lib/preview.ts`:**
```ts
/**
 * Return the leading ~fraction of a markdown body, cut at the nearest
 * paragraph boundary (double-newline) at or before the target offset.
 * Always a prefix of `body`; never returns the whole body when fraction < 1.
 */
export function previewSlice(body: string, fraction = 0.24): string {
  const target = Math.floor(body.length * fraction);
  if (target <= 0) return "";
  const paras = body.split(/\n\n+/);
  let acc = "";
  for (let i = 0; i < paras.length; i++) {
    const next = acc.length === 0 ? paras[i] : acc + "\n\n" + paras[i];
    if (next.length > target && acc.length > 0) break;
    acc = next;
    if (acc.length >= target) break;
  }
  // Guard: if we somehow accumulated everything, drop the last paragraph.
  if (acc.length >= body.length && paras.length > 1) {
    acc = paras.slice(0, -1).join("\n\n");
  }
  return acc;
}
```

- [ ] **Step 4: Run → PASS.** `pnpm test lib/preview.test.ts`

- [ ] **Step 5: Extend `lib/reports.ts`** with a published-reports join. Append:
```ts
import { readIndex, type AttestationRecord } from "./attestation-index";

export type PublishedReport = {
  meta: ReportMeta;
  record: AttestationRecord;
  priceUsd: string; // formatted "$0.30"
};

function formatUsdc(priceUSDC: string): string {
  return "$" + (Number(BigInt(priceUSDC)) / 1e6).toFixed(2);
}

/** Reports that have an on-chain attestation recorded in the index, newest first. */
export function listPublishedReports(): PublishedReport[] {
  return readIndex()
    .filter((r) => { try { getReportMeta(r.slug); return true; } catch { return false; } })
    .map((r) => ({ meta: getReportMeta(r.slug), record: r, priceUsd: formatUsdc(r.priceUSDC) }));
}

/** A single published report, or null if the slug is not published (not in the index). */
export function getPublishedReport(slug: string): PublishedReport | null {
  const rec = readIndex().find((r) => r.slug === slug);
  if (!rec) return null;
  let meta: ReportMeta;
  try { meta = getReportMeta(slug); } catch { return null; }
  return { meta, record: rec, priceUsd: formatUsdc(rec.priceUSDC) };
}
```

- [ ] **Step 6: Add a test to `lib/reports.test.ts`** for the join (the seed is published):
```ts
import { listPublishedReports, getPublishedReport } from "./reports";
// ...
it("lists the published seed report with a formatted price", () => {
  const all = listPublishedReports();
  const seed = all.find((r) => r.meta.slug === "onchain-partnership-rwa");
  expect(seed).toBeTruthy();
  expect(seed!.priceUsd).toBe("$0.30");
});
it("returns null for an unpublished slug", () => {
  expect(getPublishedReport("does-not-exist")).toBeNull();
});
```

- [ ] **Step 7: Run → PASS** (`pnpm test lib/reports.test.ts lib/preview.test.ts`). Commit:
```bash
git add lib/preview.ts lib/preview.test.ts lib/reports.ts lib/reports.test.ts
git commit -m "feat: published-reports join + 24% preview slice (Phase 3 T2)"
```

---

### Task 3: `/reports` list page

**Files:** `app/reports/page.tsx`, `components/reports/ReportCard.tsx`

- [ ] **Step 1: `components/reports/ReportCard.tsx`** (server component) — port a card from `docs/mockups/reports.html` (`.card`, lines ~482–507): tags (first = category crimson), title, on-chain badge (`✓ on-chain · EAS:0x12ab…` linking to `https://base-sepolia.easscan.org/attestation/view/<uid>`), foot with price + author. Props: `{ report: PublishedReport }`. Link the card to `/reports/<slug>`. Truncate the UID with the existing `truncateAddress`-style helper (or inline `uid.slice(0,6)+"…"+uid.slice(-4)`).
- [ ] **Step 2: `app/reports/page.tsx`** (server component):
```tsx
import { Masthead } from "@/components/home/Masthead";
import { Footer } from "@/components/home/Footer";
import { ReportCard } from "@/components/reports/ReportCard";
import { listPublishedReports } from "@/lib/reports";

export default function ReportsPage() {
  const reports = listPublishedReports();
  return (
    <>
      <Masthead />
      <main className="reports">
        <h1>报告目录</h1>
        <p>链上可验证内容库 · 每篇附 EAS attestation。</p>
        {reports.length === 0 ? (
          <p>还没有已上链的报告。</p>
        ) : (
          <div className="cards">
            {reports.map((r) => <ReportCard key={r.meta.slug} report={r} />)}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
```
(Style the `<h1>`/intro with `.reports`-scoped rules from the mockup's header.)
- [ ] **Step 3: Build + smoke** — `pnpm build`; `pnpm dev` then `curl -s http://localhost:3000/reports` contains `报告目录` and `重构链上契约` (the seed title). Commit:
```bash
git add app/reports/page.tsx components/reports/ReportCard.tsx
git commit -m "feat: /reports list with on-chain badge cards (Phase 3 T3)"
```

---

### Task 4: `/reports/[slug]` detail — preview + paywall

**Files:** `app/reports/[slug]/page.tsx`, `components/reports/Paywall.tsx`, `components/reports/ArticleBody.tsx`

- [ ] **Step 1: `components/reports/ArticleBody.tsx`** (`"use client"` not needed; can be server) — renders markdown via `react-markdown` + `remark-gfm`:
```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="hm-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: `components/reports/Paywall.tsx`** (server component, visual-only for Phase 3) — port the `.pw` card from `article.html` lines 450–469, props `{ priceUsd: string; authorName: string }`. Lock eyebrow "付费阅读 · 已读 24%", a heading, price row (`priceUsd` + "USDC on Base · 一次付费永久可读"), and the CTA **disabled** with text like `用钱包付 {priceUsd} 解锁全文`, plus a small note `全文解锁将在 x402 付费上线(Phase 4)`. Fine print "付费后 100% 直达 {authorName} 钱包 · 平台 0 抽成". Include the `.teaser-fade` div before the card.

- [ ] **Step 3: `app/reports/[slug]/page.tsx`** (server component):
```tsx
import { notFound } from "next/navigation";
import { Masthead } from "@/components/home/Masthead";
import { getPublishedReport, getReportBody } from "@/lib/reports";
import { previewSlice } from "@/lib/preview";
import { ArticleBody } from "@/components/reports/ArticleBody";
import { Paywall } from "@/components/reports/Paywall";

export default async function ReportDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = getPublishedReport(slug);
  if (!report) notFound();
  const preview = previewSlice(getReportBody(slug), 0.24);
  const easUrl = `https://base-sepolia.easscan.org/attestation/view/${report.record.attestationUID}`;
  return (
    <div className="article">
      <header className="hm-mast">
        <a href="/" className="hm-brand"><span className="mark"></span>x402write</a>
        <a href="/reports" className="hm-back">← 收录目录</a>
      </header>
      <div className="hm-grid">
        <article className="hm-article">
          <div className="hm-pub">
            原发布 {report.meta.publishedAt} ·{" "}
            <a href={easUrl} target="_blank" rel="noreferrer">on-chain ✓ EAS:{report.record.attestationUID.slice(0,6)}…</a>
          </div>
          <hr className="hm-rule" />
          <h1 className="hm-title">{report.meta.title}</h1>
          <p className="hm-deck">{report.meta.summary}</p>
          <div className="hm-byline">
            <span className="hm-av">{report.meta.authorName.slice(0,1)}</span>
            <div>
              <div className="hm-au-name">{report.meta.authorName}</div>
              <div className="hm-au-role">{report.meta.authorOrg ?? ""} · {report.meta.tags.join(" · ")}</div>
            </div>
          </div>
          <ArticleBody markdown={preview} />
          <Paywall priceUsd={report.priceUsd} authorName={report.meta.authorName} />
        </article>
      </div>
    </div>
  );
}
```
(Note: TOC rail is optional for Phase 3 — you may omit `.hm-toc` or include a static one; keep the grid single-column if omitting. The disclaimer per §7 should be visible to unpaid readers; since our seed disclaimer lives on-chain, render `report` has no disclaimer text field — Phase 3 may show the meta summary only; full disclaimer display is a Phase 4 detail when the paid response returns it. Do not block on it.)

- [ ] **Step 4: Verify** — `pnpm build`; `pnpm dev`, open `/reports/onchain-partnership-rwa` → confirm: title, byline, ~24% of the article rendered as markdown, teaser-fade, paywall card with `$0.30` + disabled CTA. `curl -s` contains the title + `付费阅读`. Confirm `/reports/nope` returns 404. Commit:
```bash
git add app/reports/[slug]/page.tsx components/reports/Paywall.tsx components/reports/ArticleBody.tsx
git commit -m "feat: /reports/[slug] detail — 24% preview + paywall card (Phase 3 T4)"
```

---

### Task 5: full verification

- [ ] **Step 1:** `pnpm test && pnpm build` — all suites pass, build clean.
- [ ] **Step 2 (manual):** open `/reports` (seed card with on-chain badge) → click it → `/reports/onchain-partnership-rwa` shows preview + paywall. The home "收录文章" card now resolves (no more 404). Visually compare to `docs/mockups/article.html` (human mode) + `reports.html`.

---

## Self-Review Notes
- **Fixes the 404** (Task 4) — the home card → `/reports/<slug>` now renders.
- **Spec coverage:** §5 Story 2 (list from index, EAS badge) → Task 3; Story 3 24% preview + paywall → Task 4; price from on-chain/index, not frontmatter → `formatUsdc(record.priceUSDC)`.
- **Collision-safe scoping:** list under `.reports`, article under `.article` (article palette as scoped custom props) — avoids the `.pub` mistake.
- **Deferrals are explicit and not faked:** paywall CTA disabled (no fake unlock), agent mode/companion absent — Phase 4 / 4.5.
- **Type consistency:** `PublishedReport` (lib/reports) used by ReportCard, list page, detail page; `previewSlice` by detail page.

## Next
Phase 4 — x402 paywall (real unlock on the detail page) + agent endpoint `/api/v1/articles/[slug]`. Then Phase 4.5 companion / Agent Mode.
