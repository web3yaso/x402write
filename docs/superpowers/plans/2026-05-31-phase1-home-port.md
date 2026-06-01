# Phase 1 — Home Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `docs/mockups/01-home.html` into a React/Next.js home page with three working tabs (Try it / For Writers / For Agents·SOON), all copy buttons functional, faithful to the mockup's visual design.

**Architecture:** A server `app/page.tsx` composes client components: `Masthead`, `NewsletterStrip`, `HomeTabs` (holds tab state + renders `Pills` and the three panels), and `Footer`. The mockup's bespoke CSS is lifted wholesale into `app/globals.css` (raw `--paper/--ink/…` variable aliases + component rules) and the same class names are reused in JSX — Tailwind v4 (from Phase 0) coexists. The signature dark copy-prompt block becomes a reusable `components/shared/DPrompt.tsx` (reused later by reports/companion). `TopEarningAuthors` uses mock data in this phase; Phase 5 wires it to `data/payment-log.json`.

**Tech Stack:** Next.js 16 App Router, React 19, TS, Tailwind v4 + lifted CSS, Vitest + React Testing Library + jsdom.

**Conventions / decisions for this phase:**
- **Brand wordmark = `x402write`** (project name, matches Phase 0), NOT the mockup's "Write402". Keep the mockup's CSS lock-mark glyph.
- **Wallet UI:** reuse the real Phase-0 `components/shared/WalletConnect.tsx` (wagmi injected) in the Masthead. Do NOT port the mockup's fake-localStorage wallet crest/popover (it's a non-functional demo). The crest avatar/popover polish is out of scope for Phase 1.
- **Navigation targets** (pages built in later phases; wiring them now is correct-by-construction):
  - Masthead menu: `发布报告 → /publish`, `报告目录 → /reports`. Drop the mockup's "How it works" link (no such route planned).
  - Readers "Find" button + each collected-article card → `/reports` (Phase 3 makes cards deep-link to `/reports/<slug>`).
  - Writers "Import" button → `/publish?source=<encoded input>` (Story 1 entry).
  - Footer links → `#` (placeholder), except `home → /`.
- **Mockup source of truth:** `docs/mockups/01-home.html`. Where this plan says "port lines A–B", read that range and transform HTML→JSX: `class`→`className`, self-close void tags, inline `style="a:b;c:d"`→`style={{ a: 'b', c: 'd' }}` (camelCase keys), strip the `<style>`/`<script>` (behaviors are re-implemented in React per each task's spec), and wire the handlers this plan specifies.

**Series context:** Plan 2 of the build series (Phase 1). Prior: Phase 0 scaffold (`docs/superpowers/plans/2026-05-31-phase0-scaffold.md`). Decisions: `docs/superpowers/specs/2026-05-31-x402write-build-design.md`. Spec: `docs/HACKATHON.md` §6, §11 Phase 1.

---

### Task 1: Test infrastructure — React Testing Library + jsdom

**Files:**
- Modify: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (dev deps)

- [ ] **Step 1: Install RTL + jsdom**

Run: `pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
Expected: four dev deps added.

- [ ] **Step 2: Replace `vitest.config.ts`**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["lib/**/*.test.ts", "components/**/*.test.tsx", "app/**/*.test.tsx"],
  },
});
```

- [ ] **Step 3: Install the React plugin for Vitest**

Run: `pnpm add -D @vitejs/plugin-react`
Expected: added.

- [ ] **Step 4: Create `vitest.setup.ts`**

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());
```

- [ ] **Step 5: Verify existing tests still pass under jsdom**

Run: `pnpm test`
Expected: PASS — the 2 `lib/format.test.ts` cases still pass (jsdom runs node-compatible tests fine).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json pnpm-lock.yaml
git commit -m "test: add React Testing Library + jsdom for component tests (Phase 1)"
```

---

### Task 2: Lift the home design CSS into globals.css

**Files:**
- Modify: `app/globals.css`

The mockup's `<style>` block (`docs/mockups/01-home.html` lines 21–773) defines an inline `:root` palette and all component CSS. Lift it so the ported JSX can reuse the same class names. Our Phase-0 `@theme` already defines `--color-*` tokens; the mockup CSS uses raw `--paper/--ink/…`. Add those raw aliases, then append the component rules.

- [ ] **Step 1: Add raw variable aliases under the existing `@theme`/body block**

Append to `app/globals.css` (after the existing Phase-0 body rules), a `:root` block mapping the mockup's raw names to the same values (these mirror the Phase-0 `@theme` colors plus a few mockup-only ones):
```css
/* Raw aliases for the lifted 01-home.html component CSS (same values as @theme). */
:root {
  --paper: #f3f0e9;
  --paper-soft: #ece8df;
  --paper-card: #fffdf8;
  --ink: #1a1714;
  --ink-soft: #4a4339;
  --ink-mute: #8a8278;
  --line: #d9d2c5;
  --line-soft: #e6e0d4;
  --charcoal: #1e1b18;
  --charcoal-2: #2a2620;
  --crimson: #8B1F30;
  --crimson-hi: #A83245;
  --crimson-on-dark: #d29ba2;
}
```

- [ ] **Step 2: Append the component CSS**

From `docs/mockups/01-home.html`, copy the CSS rules for these selectors (lines ~56–773) into `app/globals.css`, EXCLUDING the mockup's own `:root{…}` (lines 23–37, replaced by Step 1) and the global `html/body/a/button/::selection/em` resets (lines 39–54, already in Phase-0 globals). Include the rules for: `.mast` and masthead children (`.mast-row`, `.brand`, `.brand .mark`, hamburger `.menu-btn`/`.menu-panel`/`.menu-eyebrow`), `.news*`, `main`, `.pills*`/`.pill*`, `.coming-*`, `.display`/`.sub`/`.powered`, `.panel`, `.big-input`/`.input-hint`, `.sec-title`, `.prompts-grid`/`.prompt-card`, `.guide-*`, `.chips`/`.chip`/`.via`, `.sec-actions`, `.stats`/`.stat`, `.lboard*`, `.say-*`, `.a-rule`/`.a-sec-*`, `.prov-pills`/`.prov`, `.dprompt*`, `.ep-*`, `.foot*`.
  - Omit the `.wallet-crest`/`.wc-*`/`.wallet-pop`/`.wp-*` rules (lines ~91–167) — the fake wallet UI is not ported.
  - Keep all `@media` queries that accompany these selectors.

- [ ] **Step 3: Verify build still compiles**

Run: `pnpm build`
Expected: "Compiled successfully", no CSS/type errors. (Visual correctness is verified at Task 10.)

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: lift 01-home.html component CSS into globals (Phase 1)"
```

---

### Task 3: DPrompt — reusable dark copy-prompt block (TDD)

**Files:**
- Create: `components/shared/DPrompt.tsx`
- Test: `components/shared/DPrompt.test.tsx`

The mockup's `.dprompt` block (e.g. lines 983–989) has a label, a `.body`, and a copy button that writes `.body` text to the clipboard and flips to "copied" for 1.4s.

- [ ] **Step 1: Write the failing test**

`components/shared/DPrompt.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DPrompt } from "./DPrompt";

describe("DPrompt", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders the label and body text", () => {
    render(<DPrompt label="Setup Prompt" body="hello world" />);
    expect(screen.getByText("Setup Prompt")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("copies the body to clipboard and shows 'copied' on click", async () => {
    const user = userEvent.setup();
    render(<DPrompt label="Setup Prompt" body="copy me" />);
    const btn = screen.getByRole("button", { name: /copy/i });
    await user.click(btn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("copy me");
    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/shared/DPrompt.test.tsx`
Expected: FAIL — cannot resolve `./DPrompt`.

- [ ] **Step 3: Implement `components/shared/DPrompt.tsx`**

```tsx
"use client";

import { useState } from "react";

export function DPrompt({ label, body }: { label: string; body: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <div className="dprompt">
      <span className="dprompt-lbl">{label}</span>
      <button className={`copy${copied ? " copied" : ""}`} onClick={handleCopy}>
        {copied ? "copied" : "copy"}
      </button>
      <div className="body">{body}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/shared/DPrompt.test.tsx`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add components/shared/DPrompt.tsx components/shared/DPrompt.test.tsx
git commit -m "feat: DPrompt reusable copy-prompt block (Phase 1)"
```

---

### Task 4: ReadersPanel ("Try it" tab)

**Files:**
- Create: `components/home/ReadersPanel.tsx`
- Test: `components/home/ReadersPanel.test.tsx`

Port the readers panel markup from `docs/mockups/01-home.html` lines 824–898 (display headline, sub, powered line, big-input "Find", "收录文章" guide-grid of 6 cards, "Supported Authors" chips, sec-actions). Transform per the plan header rules. Wire behaviors:
- The "Find" button and Enter key in the input → `router.push("/reports")`.
- Each `.guide-card` is a Next `<Link href="/reports">` (Phase 3 will deep-link by slug).

- [ ] **Step 1: Write the failing test**

`components/home/ReadersPanel.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReadersPanel } from "./ReadersPanel";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("ReadersPanel", () => {
  it("renders the display headline and the collected-articles section", () => {
    render(<ReadersPanel />);
    expect(screen.getByText(/已经有人写过答案/)).toBeInTheDocument();
    expect(screen.getByText("收录文章")).toBeInTheDocument();
  });

  it("navigates to /reports when Find is clicked", async () => {
    const user = userEvent.setup();
    render(<ReadersPanel />);
    await user.click(screen.getByRole("button", { name: "Find" }));
    expect(push).toHaveBeenCalledWith("/reports");
  });
});
```

- [ ] **Step 2: Run test → FAIL** (`./ReadersPanel` unresolved). Run: `pnpm test components/home/ReadersPanel.test.tsx`

- [ ] **Step 3: Implement `components/home/ReadersPanel.tsx`**

Create a `"use client"` component. Structure (port text verbatim from lines 824–898; use Next `Link` for cards, `useRouter` for Find):
```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const ARTICLES = [
  { cat: "Enforcement · 大陆", price: "$0.30", q: "OTC 卖 USDT 后银行卡被冻,24 小时内该做什么?", how: "5 分钟区分风控/司法冻结 · 7 步应对清单 · 训诫书该不该签 · 4 个可复制 prompt", author: "陈律师 · 公众号" },
  { cat: "Compliance · 大陆", price: "$0.20", q: "境内做 OTC 商家,会不会被认定帮信罪?", how: "最低合规门槛 · 帮信 vs 掩隐的认定边界 · 留痕清单 · 3 个可复制 prompt", author: "OTC 法律日记 · 公众号" },
  { cat: "License · 香港", price: "$0.25", q: "香港 VATP 牌照:条件、时间表和资本要求?", how: "申请门槛拆解 · 时间线与成本 · 常见驳回理由 · 2 个可复制 prompt", author: "Lex Web3 · Mirror" },
  { cat: "Tax · 跨境", price: "$0.15", q: "跨境收 USDT 当劳务报酬,境内个税怎么报?", how: "申报口径 · 折算与凭证 · 真实补税案例 · 2 个可复制 prompt", author: "币圈合规观察 · 公众号" },
  { cat: "Sanctions · 链上", price: "$0.10", q: "钱包被加进 OFAC SDN 名单后,链上还能转出吗?", how: "SDN 链上后果 · 合规出口 · 误伤申诉路径 · 2 个可复制 prompt", author: "Web3 合规小组 · 飞书" },
  { cat: "Case · 大陆", price: "$0.20", q: "NFT 在大陆被定性为虚拟商品的近期判例?", how: "判例时间线 · 定性逻辑 · 对发行方的启示 · 2 个可复制 prompt", author: "CN Crypto Court · Substack" },
];

const CHIPS = [
  ["币圈合规观察", "公众号"], ["SG MAS Watcher", "Substack"], ["Lex Web3", "Mirror"],
  ["ChainLaw HK", "公众号"], ["Paige Zhao", "Mirror"], ["OTC 法律日记", "公众号"],
  ["CN Crypto Court", "Substack"], ["Web3 合规小组", "飞书"],
];

export function ReadersPanel() {
  const router = useRouter();
  const find = () => router.push("/reports");

  return (
    <section className="panel active" id="panel-readers">
      <h1 className="display">你的问题,<em>已经有人写过答案</em>。</h1>
      <p className="sub">搜索你的处境,付费阅读实名律师写的对应文章,即得答案。</p>
      <p className="powered">Powered by MPP on Tempo and x402 on Base</p>

      <div className="big-input">
        <input
          type="text"
          placeholder="我的工行卡因 OTC 出金被冻结,下一步怎么办?"
          onKeyDown={(e) => { if (e.key === "Enter") find(); }}
        />
        <button onClick={find}>Find</button>
      </div>
      <p className="input-hint">付费阅读对应文章即得答案 · 付费直达作者</p>

      <div className="sec-title" style={{ fontSize: "21px", fontWeight: 700 }}>收录文章</div>
      <p className="guide-lead">每篇都由实名作者汇编自真实案例。付费后不仅能读到全文,还附场景 prompt —— 复制丢进你常用的 AI,帮你把文章用到自己的处境上,理解并解决问题。</p>
      <div className="guide-grid">
        {ARTICLES.map((a, i) => (
          <Link className="guide-card" href="/reports" key={i}>
            <div className="g-top"><span className="g-cat">{a.cat}</span><span className="g-price">{a.price}</span></div>
            <div className="g-q">{a.q}</div>
            <div className="g-how">{a.how}</div>
            <div className="g-foot"><span className="g-author">{a.author}</span></div>
          </Link>
        ))}
      </div>

      <div className="sec-title muted" style={{ marginTop: "48px" }}>Supported Authors</div>
      <div className="chips">
        {CHIPS.map(([name, via], i) => (
          <span className="chip" key={i}>{name} <span className="via">· {via}</span></span>
        ))}
      </div>

      <div className="sec-actions">
        找不到对应文章? <Link href="/reports">浏览全部收录</Link> · <a href="#">订阅 $19/月 畅读所有作者</a>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm test components/home/ReadersPanel.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add components/home/ReadersPanel.tsx components/home/ReadersPanel.test.tsx
git commit -m "feat: ReadersPanel (Try it tab) (Phase 1)"
```

---

### Task 5: WritersPanel + TopEarningAuthors

**Files:**
- Create: `components/home/WritersPanel.tsx`
- Create: `components/home/TopEarningAuthors.tsx`
- Test: `components/home/TopEarningAuthors.test.tsx`

Port the writers panel from `docs/mockups/01-home.html` lines 901–955 (display headline, sub, import big-input, stats grid, leaderboard). Split the leaderboard into `TopEarningAuthors.tsx` so Phase 5 can swap its data source. For this phase the data is the mock array below (from mockup lines 942–951). Import button + Enter → `router.push("/publish?source=" + encodeURIComponent(value))`.

- [ ] **Step 1: Write the failing test for the leaderboard**

`components/home/TopEarningAuthors.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopEarningAuthors } from "./TopEarningAuthors";

describe("TopEarningAuthors", () => {
  it("renders all 10 author rows with rank, name and earnings", () => {
    render(<TopEarningAuthors />);
    expect(screen.getByText("币圈合规观察")).toBeInTheDocument();
    expect(screen.getByText("$8,420.30")).toBeInTheDocument();
    expect(screen.getByText("RWA Watch CN")).toBeInTheDocument();
    // 10 data rows
    expect(screen.getAllByText(/^\$[\d,]+\.\d{2}$/)).toHaveLength(10);
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm test components/home/TopEarningAuthors.test.tsx`

- [ ] **Step 3: Implement `components/home/TopEarningAuthors.tsx`**

```tsx
type Row = { rank: string; name: string; desc: string; articles: string; earned: string };

const ROWS: Row[] = [
  { rank: "01", name: "币圈合规观察", desc: "@cryptolaw_cn · 公众号 · 大陆司法实践", articles: "156", earned: "$8,420.30" },
  { rank: "02", name: "SG MAS Watcher", desc: "@sgmas_watcher · Substack · 新加坡监管", articles: "89", earned: "$5,210.50" },
  { rank: "03", name: "Lex Web3", desc: "@lex_web3 · Mirror · 香港 VATP / VASP", articles: "72", earned: "$4,892.10" },
  { rank: "04", name: "ChainLaw HK", desc: "@chainlaw_hk · 公众号 · 跨境支付/合规", articles: "94", earned: "$4,201.85" },
  { rank: "05", name: "OTC 法律日记", desc: "@otc_legal_diary · 公众号 · 帮信罪/掩饰隐瞒", articles: "128", earned: "$3,950.40" },
  { rank: "06", name: "Paige Zhao", desc: "@paige_zhao · Mirror · 稳定币立法", articles: "41", earned: "$3,012.00" },
  { rank: "07", name: "CN Crypto Court", desc: "@cn_crypto_court · Substack · 判例分析", articles: "66", earned: "$2,710.75" },
  { rank: "08", name: "Web3 合规小组", desc: "@web3_compliance · 飞书 · 制裁筛查/反洗钱", articles: "38", earned: "$1,820.90" },
  { rank: "09", name: "链上侦查笔记", desc: "@onchain_detective · 公众号 · 链上取证", articles: "52", earned: "$1,510.20" },
  { rank: "10", name: "RWA Watch CN", desc: "@rwa_watch · Mirror · 现实资产代币化", articles: "29", earned: "$1,140.50" },
];

export function TopEarningAuthors() {
  return (
    <>
      <div className="lboard-head">
        <div>
          <h3>Top Earning Authors</h3>
          <p className="lboard-sub">Ranked by total earnings across paid unlocks · paid directly to wallets via x402.</p>
        </div>
        <span className="more">Top 10 of 47</span>
      </div>

      <div className="lboard">
        <div className="lboard-cols">
          <span>#</span>
          <span>AUTHOR</span>
          <span className="r-r c-art">ARTICLES</span>
          <span className="r-r">EARNED</span>
        </div>
        {ROWS.map((r) => (
          <div className="lboard-row" key={r.rank}>
            <span className="rank">{r.rank}</span>
            <div className="pub"><div className="name">{r.name}</div><div className="desc">{r.desc}</div></div>
            <span className="col-r c-art">{r.articles}</span>
            <span className="col-r acc">{r.earned}</span>
          </div>
        ))}
      </div>

      <p className="lboard-foot"><strong>0 platform fee on the article side</strong> · settlement: real-time via x402 on Base · Coinbase CDP facilitator</p>
    </>
  );
}
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm test components/home/TopEarningAuthors.test.tsx`

- [ ] **Step 5: Implement `components/home/WritersPanel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopEarningAuthors } from "./TopEarningAuthors";

export function WritersPanel() {
  const router = useRouter();
  const [src, setSrc] = useState("");
  const importGo = () => router.push("/publish?source=" + encodeURIComponent(src));

  return (
    <section className="panel" id="panel-writers">
      <h1 className="display">{"你的文章已经很有价值\n现在Agent也可以付费阅读"}</h1>
      <p className="sub">{"导入你的公众号文章,可先预览再建账户。\n我们还会为每篇自动配上场景 prompt,帮读者把文章用到自己的处境上 —— \n真人与 Agent 同价付费阅读,款项直达你的钱包。"}</p>

      <div className="big-input">
        <input
          type="text"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") importGo(); }}
          placeholder="cryptolaw_cn  ·  公众号名 / Mirror URL / Substack URL"
        />
        <button onClick={importGo}>Import</button>
      </div>
      <p className="input-hint">历史文章 + 后续新发可一次性授权</p>

      <div className="stats">
        <div className="stat">
          <div className="lbl">Total Articles Purchased</div>
          <div className="val">12,847</div>
          <div className="delta">+612 past 7d</div>
        </div>
        <div className="stat">
          <div className="lbl">Total Earned by Authors</div>
          <div className="val acc">$48,302.51</div>
          <div className="delta">+$2,841 past 7d · 0% platform fee</div>
        </div>
      </div>

      <TopEarningAuthors />
    </section>
  );
}
```
> Note: the `.display` and `.sub` CSS preserve newlines via the source's literal line breaks; here `\n` in a JSX string does NOT render as a break unless `white-space` is set. The mockup's `.display`/`.sub` do not set `white-space: pre`. To match the mockup's two-line headline, the CSS lift is fine as-is (the mockup relied on literal newlines in HTML which collapse the same way). Keep the `\n` strings; exact line-wrapping is cosmetic and verified at Task 10. If a hard break is needed, the implementer may split into `{"…"}<br/>{"…"}` — acceptable minor deviation.

- [ ] **Step 6: Commit**

```bash
git add components/home/WritersPanel.tsx components/home/TopEarningAuthors.tsx components/home/TopEarningAuthors.test.tsx
git commit -m "feat: WritersPanel + TopEarningAuthors leaderboard, mock data (Phase 1)"
```

---

### Task 6: AgentsPanel ("For Agents" tab)

**Files:**
- Create: `components/home/AgentsPanel.tsx`
- Test: `components/home/AgentsPanel.test.tsx`

Port from `docs/mockups/01-home.html` lines 958–1029 (coming-soon banner, headline, "Things you can say" box, §1 wallet provider pills + DPrompt, §2 DPrompt, §3 endpoint table). Use the `DPrompt` component for the two setup prompts. The provider pills (`AgentCash/Coinbase/Circle/Tempo`) are a local toggle (active state).

- [ ] **Step 1: Write the failing test**

`components/home/AgentsPanel.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentsPanel } from "./AgentsPanel";

describe("AgentsPanel", () => {
  it("renders the coming-soon banner and two copy prompts", () => {
    render(<AgentsPanel />);
    expect(screen.getByText(/Agent 接入将于下一阶段开放/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /copy/i })).toHaveLength(2);
  });

  it("toggles the active provider pill", async () => {
    const user = userEvent.setup();
    render(<AgentsPanel />);
    const coinbase = screen.getByRole("button", { name: "Coinbase" });
    await user.click(coinbase);
    expect(coinbase).toHaveClass("active");
    expect(screen.getByRole("button", { name: "AgentCash" })).not.toHaveClass("active");
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm test components/home/AgentsPanel.test.tsx`

- [ ] **Step 3: Implement `components/home/AgentsPanel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { DPrompt } from "@/components/shared/DPrompt";

const PROVIDERS = ["AgentCash", "Coinbase", "Circle", "Tempo"];

const ENDPOINTS = [
  { method: "GET", post: false, path: "/v1/articles/search?q=&jurisdiction=", meta: "$0.002" },
  { method: "GET", post: false, path: "/v1/articles/{slug}", meta: "author-set · $0.05+" },
  { method: "GET", post: false, path: "/v1/articles/{slug}/prompts", meta: "included" },
  { method: "GET", post: false, path: "/v1/articles/{slug}/citations", meta: "included" },
  { method: "GET", post: false, path: "/v1/authors", meta: "free" },
  { method: "POST", post: true, path: "/v1/chat", meta: "$0.001 / 1k tok" },
];

export function AgentsPanel() {
  const [provider, setProvider] = useState("AgentCash");

  return (
    <section className="panel" id="panel-agents">
      <div className="coming-wrap"><span className="coming-banner"><span className="pulse"></span>Agent 接入将于下一阶段开放 · 以下为功能预览</span></div>
      <h1 className="display">The best Chinese regulation analysis is behind paywalls. <em>Now let your agent read it.</em></h1>

      <div className="say-lbl">Things you can say</div>
      <div className="say-box">
        <span className="car">&gt;</span>我朋友在杭州 OTC 出金被工行冻结,金额 12 万,人在大陆,下一步该做什么?<span className="cursor"></span>
      </div>

      <div className="a-rule"></div>
      <div className="a-sec-num">1. Set up and fund a wallet</div>
      <p className="a-sec-desc">Your agent needs a USDC wallet on Base, funded with a few dollars to pay for reading paid articles. Pick a provider your agent already supports:</p>
      <div className="prov-pills">
        {PROVIDERS.map((p) => (
          <button key={p} className={`prov${provider === p ? " active" : ""}`} onClick={() => setProvider(p)}>{p}</button>
        ))}
      </div>

      <DPrompt
        label="Setup Prompt"
        body={"Read https://agentcash.io/SKILL.md and set up an AgentCash Wallet.\nFund it with at least 5 USDC on Base. Save the wallet address and\nsigning key in your local secrets."}
      />

      <div className="a-sec-num" style={{ marginTop: "48px" }}>2. Load the x402write article index</div>
      <p className="a-sec-desc">Fetch our <strong>SKILL.md</strong> as raw context. Your agent learns which articles exist, what each costs, and how to pay to read one — every paid read returns the full markdown <strong>plus the article&apos;s scenario prompts and citation metadata</strong>, ready to drop into your workflow.</p>

      <DPrompt
        label="Setup Prompt"
        body={"Fetch https://x402write.vercel.app/SKILL.md as raw context (do not summarize)\nand follow the instructions. Use agentcash for x402 payments."}
      />

      <div className="a-sec-num" style={{ marginTop: "48px" }}>3. Or call endpoints directly</div>
      <p className="a-sec-desc">All paths are in <a href="#" style={{ color: "var(--crimson)", borderBottom: "1px dotted currentColor" }}>openapi.json</a>. x402 price is returned in the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>402 Payment Required</code> header — your agent pays and retries, no API key needed. A paid read returns the article&apos;s full markdown, its prompts and citations.</p>

      <div className="ep-table">
        {ENDPOINTS.map((e) => (
          <div className="ep-row" key={e.path}>
            <span className={`method${e.post ? " post" : ""}`}>{e.method}</span>
            <span className="path">{e.path}</span>
            <span className="meta">{e.meta}</span>
          </div>
        ))}
      </div>
      <p className="ep-foot">
        <a href="#">openapi.json</a><span className="sep">·</span>
        <a href="#">SKILL.md</a><span className="sep">·</span>
        <a href="#">llms.txt</a><span className="sep">·</span>
        <a href="#">x402scan</a><span className="sep">·</span>
        <a href="#">mppscan</a>
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm test components/home/AgentsPanel.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add components/home/AgentsPanel.tsx components/home/AgentsPanel.test.tsx
git commit -m "feat: AgentsPanel with DPrompt copy cards + provider toggle (Phase 1)"
```

---

### Task 7: Pills + HomeTabs (tab state)

**Files:**
- Create: `components/home/HomeTabs.tsx`
- Test: `components/home/HomeTabs.test.tsx`

`HomeTabs` is the client tab controller: renders the pill switcher (mockup lines 815–821) and one of the three panels. The active panel uses the existing `.panel.active` CSS (display:block). Since panels already render their own `className="panel active|panel"`, HomeTabs controls which is mounted; render only the active panel to keep it simple (mounting one at a time). On tab change, scroll to top.

- [ ] **Step 1: Write the failing test**

`components/home/HomeTabs.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeTabs } from "./HomeTabs";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("HomeTabs", () => {
  it("shows the Readers panel by default", () => {
    render(<HomeTabs />);
    expect(screen.getByText(/已经有人写过答案/)).toBeInTheDocument();
  });

  it("switches to Writers panel on pill click", async () => {
    const user = userEvent.setup();
    render(<HomeTabs />);
    await user.click(screen.getByRole("tab", { name: /For Writers/ }));
    expect(screen.getByText("Top Earning Authors")).toBeInTheDocument();
    expect(screen.queryByText(/已经有人写过答案/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm test components/home/HomeTabs.test.tsx`

- [ ] **Step 3: Implement `components/home/HomeTabs.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ReadersPanel } from "./ReadersPanel";
import { WritersPanel } from "./WritersPanel";
import { AgentsPanel } from "./AgentsPanel";

type Tab = "readers" | "writers" | "agents";

const TABS: { key: Tab; label: React.ReactNode }[] = [
  { key: "readers", label: "Try it" },
  { key: "writers", label: "For Writers" },
  { key: "agents", label: <>For Agents <span className="soon">SOON</span></> },
];

export function HomeTabs() {
  const [tab, setTab] = useState<Tab>("readers");

  function select(t: Tab) {
    setTab(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="pills-wrap">
        <div className="pills" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`pill${tab === t.key ? " active" : ""}`}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => select(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "readers" && <ReadersPanel />}
      {tab === "writers" && <WritersPanel />}
      {tab === "agents" && <AgentsPanel />}
    </>
  );
}
```
> The panels render with their own `className="panel active"` / `"panel"`; since only the active one is mounted, it displays. (The `.panel{display:none}` rule is harmless on a mounted `panel active`.)

- [ ] **Step 4: Run test → PASS.** Run: `pnpm test components/home/HomeTabs.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeTabs.tsx components/home/HomeTabs.test.tsx
git commit -m "feat: HomeTabs tab switcher (Phase 1)"
```

---

### Task 8: Masthead (brand + menu + real WalletConnect)

**Files:**
- Create: `components/home/Masthead.tsx`
- Test: `components/home/Masthead.test.tsx`

Port the masthead shell from lines 779–801 but: brand text = `x402write`; replace the fake wallet crest with the Phase-0 `<WalletConnect/>`; keep the hamburger menu with the two real links. Menu behavior: toggle on button click, close on outside click and Escape.

- [ ] **Step 1: Write the failing test**

`components/home/Masthead.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Masthead } from "./Masthead";

vi.mock("@/components/shared/WalletConnect", () => ({
  WalletConnect: () => <button>Connect MetaMask</button>,
}));

describe("Masthead", () => {
  it("renders the x402write brand and wallet button", () => {
    render(<Masthead />);
    expect(screen.getByText("x402write")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect MetaMask" })).toBeInTheDocument();
  });

  it("opens the menu on hamburger click", async () => {
    const user = userEvent.setup();
    render(<Masthead />);
    await user.click(screen.getByRole("button", { name: "菜单" }));
    expect(screen.getByText("发布报告")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm test components/home/Masthead.test.tsx`

- [ ] **Step 3: Implement `components/home/Masthead.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WalletConnect } from "@/components/shared/WalletConnect";

export function Masthead() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <header className="mast">
      <div className="mast-row" ref={wrapRef}>
        <Link href="/" className="brand"><span className="mark"></span>x402write</Link>
        <div className="mast-right">
          <WalletConnect />
          <button
            className={`menu-btn${open ? " open" : ""}`}
            aria-label="菜单"
            aria-expanded={open}
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          >
            <span className="bars"></span>
          </button>
        </div>
        <nav className={`menu-panel${open ? " open" : ""}`} aria-label="站点导航">
          <div className="menu-eyebrow">x402write</div>
          <Link href="/publish"><span className="mtxt"><span className="mt">发布报告</span><span className="msub">签名上链你的文章</span></span><span className="ar">→</span></Link>
          <Link href="/reports"><span className="mtxt"><span className="mt">报告目录</span><span className="msub">链上可验证内容库</span></span><span className="ar">→</span></Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm test components/home/Masthead.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add components/home/Masthead.tsx components/home/Masthead.test.tsx
git commit -m "feat: Masthead with menu + real WalletConnect (Phase 1)"
```

---

### Task 9: NewsletterStrip (dismissible)

**Files:**
- Create: `components/home/NewsletterStrip.tsx`
- Test: `components/home/NewsletterStrip.test.tsx`

Port lines 804–809; the × button hides the strip.

- [ ] **Step 1: Write the failing test**

`components/home/NewsletterStrip.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterStrip } from "./NewsletterStrip";

describe("NewsletterStrip", () => {
  it("dismisses on close click", async () => {
    const user = userEvent.setup();
    render(<NewsletterStrip />);
    expect(screen.getByText(/Newsletter:/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close" }));
    expect(screen.queryByText(/Newsletter:/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm test components/home/NewsletterStrip.test.tsx`

- [ ] **Step 3: Implement `components/home/NewsletterStrip.tsx`**

```tsx
"use client";

import { useState } from "react";

export function NewsletterStrip() {
  const [shown, setShown] = useState(true);
  if (!shown) return null;
  return (
    <div className="news">
      <div className="news-inner">
        <span><b>Newsletter:</b> <a href="#">追踪每月合规动态 →</a></span>
        <button className="news-close" aria-label="close" onClick={() => setShown(false)}>×</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm test components/home/NewsletterStrip.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add components/home/NewsletterStrip.tsx components/home/NewsletterStrip.test.tsx
git commit -m "feat: NewsletterStrip dismissible bar (Phase 1)"
```

---

### Task 10: Footer + page assembly + verification

**Files:**
- Create: `components/home/Footer.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement `components/home/Footer.tsx`** (port lines 1033–1049; `home → /`, rest `#`)

```tsx
export function Footer() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <div className="foot-l">
          <a href="/">home</a>
          <a href="#">about</a>
          <a href="#">contact</a>
          <a href="#">openapi</a>
          <a href="#">skill</a>
          <a href="#">llms</a>
        </div>
        <div className="foot-mark" aria-hidden="true"></div>
        <div className="foot-r">
          <a href="#">mppscan</a>
          <a href="#">x402scan</a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx` with the assembled home**

```tsx
import { Masthead } from "@/components/home/Masthead";
import { NewsletterStrip } from "@/components/home/NewsletterStrip";
import { HomeTabs } from "@/components/home/HomeTabs";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <Masthead />
      <NewsletterStrip />
      <main>
        <HomeTabs />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Run the full test suite**

Run: `pnpm test`
Expected: all suites pass (format + DPrompt + ReadersPanel + TopEarningAuthors + AgentsPanel + HomeTabs + Masthead + NewsletterStrip).

- [ ] **Step 4: Verify production build**

Run: `pnpm build`
Expected: "Compiled successfully", `/` route listed, no type errors.

- [ ] **Step 5: Manual/automated visual smoke check**

Start `pnpm dev`, then `curl -s http://localhost:3000` and confirm the HTML contains: `x402write`, `Try it`, `For Writers`, `For Agents`, `收录文章`, `Connect MetaMask`. Stop the dev server. (Human verification: open the page, switch all three tabs, confirm the two Agents copy buttons flip to "copied", confirm the newsletter × dismisses, confirm the design visually matches `docs/mockups/01-home.html`.)

- [ ] **Step 6: Commit**

```bash
git add components/home/Footer.tsx app/page.tsx
git commit -m "feat: assemble home page — Masthead/Newsletter/Tabs/Footer (Phase 1)"
```

---

## Self-Review Notes

- **Spec coverage (HACKATHON.md §6 components/home + §11 Phase 1 "三 tab 切换、prompt 卡填入、copy 按钮全 work、视觉对齐"):** Masthead/NewsletterStrip/Pills(HomeTabs)/ReadersPanel/AgentsPanel/Footer + WritersPanel/TopEarningAuthors + shared/DPrompt — all present (Tasks 3–10). Three tabs switch (Task 7). Copy buttons work (Task 3 DPrompt, used in Task 6). ✓
- **Mock data for leaderboard (Story 5 deferred to Phase 5):** `TopEarningAuthors` is isolated with a `ROWS` constant so Phase 5 swaps only the data source. ✓
- **Navigation correctness:** Import → `/publish?source=`, Find/cards → `/reports`, menu → `/publish` `/reports`. Targets build in Phase 2/3; links are correct now. ✓
- **No fake wallet:** mockup crest/popover CSS omitted (Task 2 Step 2) and replaced by real `WalletConnect` (Task 8). ✓
- **Type consistency:** `DPrompt({label,body})` defined Task 3, consumed identically Task 6. `TopEarningAuthors`/`ReadersPanel`/`WritersPanel`/`AgentsPanel` defined Tasks 4–6, imported by `HomeTabs` Task 7. `Masthead`/`NewsletterStrip`/`HomeTabs`/`Footer` imported by `app/page.tsx` Task 10. ✓
- **Brand:** `x402write` used consistently (Masthead, menu eyebrow, Agents SKILL URL → x402write.vercel.app). ✓

## Next plan

Phase 2 — EAS integration: `scripts/eas-register-schema.ts` (Sophie runs once), `lib/eas.ts`, `/publish` sign + attest. First plan that needs the testnet wallet + `EAS_SCHEMA_UID`.
