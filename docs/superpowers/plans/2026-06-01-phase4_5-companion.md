# Phase 4.5 — Companion / Agent Mode (Story 6)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Add the article's **Agent mode** (Human/Agent toggle on `/reports/[slug]`) showing the companion's public scaffold — Explainer + Connect-your-agent setup prompt + four reader starter prompts (copy buttons) + the paywall card. Ingest the seed companion split into a public scaffold (plaintext) and an encrypted paid 〔A〕 zone.

**Architecture:** The companion source (user-provided, full 0/A/B/C) is ingested into `content/companions/<slug>.md` (public scaffold: disclaimer + jurisdiction + Explainer + 〔B〕 manual + 〔C〕 prompts) plus `content/companions/<slug>.A.enc` (AES-256-GCM of the paid 〔A〕 zone: A1 article digest / A2 glossary / A3 legal-map / A4 misconceptions). `lib/companions.ts` exposes the public scaffold (parsed) to `/reports/[slug]`; `getCompanionPaidZone(slug)` decrypts 〔A〕 for the Phase-4 paid endpoint. The article detail page gains a client `ArticleModeToggle` that switches Human ↔ Agent; the Agent view (terminal `.ag*` styling lifted from `article.html`) renders the public scaffold using the existing `DPrompt` copy cards.

**Scope / deferrals:**
- **This phase:** companion ingest (public + encrypted 〔A〕); loader; Human/Agent toggle; agent terminal view rendering Explainer + setup prompt + 4 starter prompts + the (Phase-3) paywall card; `POST /api/internal/companions` stub.
- **NOT this phase:** the paid 〔A〕 actually being SERVED (that's Phase 4's `/api/v1/articles/[slug]` 200 response); the real x402 unlock (Phase 4). The agent view's "x402 自动付费" CTA stays disabled like Story 3's, with the same Phase-4 note.

**Source companion:** `/Users/kidinamoto/Documents/work/after-automation-agent-mode/legal-explainer-agent-mode/companions/链上契约-dao-to-rwa.md` (the user prepared it). Slug = `onchain-partnership-rwa`. Spec: HACKATHON §5 Story 6, §8.6, §8.7. Mockup: `docs/mockups/article.html` agent mode = lines 503–606 + toggle 608–618.

**Series:** Plan 5 (Phase 4.5). Prior: Phase 3 (`/reports/[slug]` human mode + paywall; `.article`-scoped CSS; `lib/content-crypto.ts`, `lib/reports.ts`, `DPrompt` all exist).

---

### Task 1: Ingest the companion (public scaffold + encrypted 〔A〕)

**Files:** `.gitignore`; `content/companions/_plaintext/onchain-partnership-rwa.md` (gitignored); `scripts/ingest-companion.ts`; produces `content/companions/onchain-partnership-rwa.md` + `content/companions/onchain-partnership-rwa.A.enc`.

- [ ] **Step 1: gitignore the companion plaintext source.** Add to `.gitignore` (next to the reports `_plaintext` rule):
```
/content/companions/_plaintext/
```

- [ ] **Step 2: Copy the source companion** into the gitignored plaintext dir:
```bash
mkdir -p content/companions/_plaintext
cp "/Users/kidinamoto/Documents/work/after-automation-agent-mode/legal-explainer-agent-mode/companions/链上契约-dao-to-rwa.md" content/companions/_plaintext/onchain-partnership-rwa.md
```

- [ ] **Step 3: Write `scripts/ingest-companion.ts`.** It reads `_plaintext/<slug>.md`, splits at the section markers, writes the public scaffold `.md` and the encrypted `.A.enc`. The source uses these headers: `## 〔Explainer〕…`, `## 〔A〕…`, `## 〔B〕…`, `## 〔C〕…`, and a top block (before `## 〔Explainer〕`) with the disclaimer / 本文法域 / 汇编 byline. Split: **paid = the `## 〔A〕` section** (from `## 〔A〕` up to but excluding `## 〔B〕`); **public = everything else** (top block + 〔Explainer〕 + 〔B〕 + 〔C〕).
```ts
/**
 * Ingest a companion source into:
 *   content/companions/<slug>.md       (PUBLIC scaffold — committed plaintext)
 *   content/companions/<slug>.A.enc    (PAID zone 〔A〕 — AES-256-GCM, committed)
 * Source: content/companions/_plaintext/<slug>.md (gitignored).
 * Usage: node_modules/.bin/tsx scripts/ingest-companion.ts <slug>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { encryptContent } from "../lib/content-crypto";

function loadEnvLocal(): void {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnvLocal();

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) throw new Error("usage: ingest-companion <slug>");
const key = process.env.CONTENT_ENC_KEY;
if (!key) throw new Error("CONTENT_ENC_KEY not set");

const root = resolve(__dirname, "..");
const src = readFileSync(resolve(root, `content/companions/_plaintext/${slug}.md`), "utf8");

// Split on the H2 section markers. The paid 〔A〕 runs from "## 〔A〕" to the next "## 〔".
const aStart = src.indexOf("## 〔A〕");
const bStart = src.indexOf("## 〔B〕");
if (aStart < 0 || bStart < 0 || bStart < aStart) throw new Error("could not locate 〔A〕/〔B〕 markers in source");
const paidA = src.slice(aStart, bStart).trim();          // 〔A〕 only — PAID
const publicScaffold = (src.slice(0, aStart) + src.slice(bStart)).trim(); // top + Explainer + 〔B〕 + 〔C〕

writeFileSync(resolve(root, `content/companions/${slug}.md`), publicScaffold + "\n");
writeFileSync(resolve(root, `content/companions/${slug}.A.enc`), encryptContent(paidA, key));
console.log(`ingested companion ${slug}: public .md + paid .A.enc`);
```

- [ ] **Step 4: Run** `node_modules/.bin/tsx scripts/ingest-companion.ts onchain-partnership-rwa`. Expected: prints the success line; `content/companions/onchain-partnership-rwa.md` (public, contains 〔Explainer〕/〔B〕/〔C〕 but NOT 〔A〕) + `.A.enc` (base64) exist.

- [ ] **Step 5: Verify the 〔A〕 zone is NOT in the public file** — `grep -c "术语表\|法条地图\|误区表\|Howey" content/companions/onchain-partnership-rwa.md` must be `0` (those live only in the encrypted `.A.enc`). And `git status` must NOT list `content/companions/_plaintext/`.

- [ ] **Step 6: Commit** (public .md + .A.enc + script; NEVER _plaintext):
```bash
git add .gitignore scripts/ingest-companion.ts content/companions/onchain-partnership-rwa.md content/companions/onchain-partnership-rwa.A.enc
git commit -m "feat: ingest seed companion — public scaffold + encrypted 〔A〕 (Phase 4.5 T1)"
```

---

### Task 2: `lib/companions.ts` loader (TDD)

**Files:** `lib/companions.ts`, `lib/companions.test.ts`

The public `.md` keeps the source's markdown. Parse it into a structured scaffold:
- `disclaimer` — the blockquote免责 near the top.
- `jurisdiction` — the `**本文法域：…**` line.
- `explainer` — the paragraph under `## 〔Explainer〕`.
- `agentManual` — the body under `## 〔B〕` (used inside the setup prompt).
- `starterPrompts` — under `## 〔C〕`, each `### N. <title>` followed by a `> <prompt>` blockquote → `{ title, prompt }[]` (expect 4).

- [ ] **Step 1: Failing test** — `lib/companions.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getCompanionPublic, getCompanionPaidZone } from "./companions";

describe("companions loader", () => {
  it("parses the public scaffold for the seed", () => {
    const c = getCompanionPublic("onchain-partnership-rwa");
    expect(c.explainer.length).toBeGreaterThan(20);
    expect(c.jurisdiction).toMatch(/法域|跨法域/);
    expect(c.starterPrompts).toHaveLength(4);
    expect(c.starterPrompts[0].title.length).toBeGreaterThan(0);
    expect(c.starterPrompts[0].prompt.length).toBeGreaterThan(10);
  });
  it("public scaffold never contains the paid 〔A〕 content", () => {
    const c = getCompanionPublic("onchain-partnership-rwa");
    const blob = JSON.stringify(c);
    expect(blob).not.toMatch(/术语表|法条地图|误区表/);
  });
  it("decrypts the paid 〔A〕 zone (server-only)", () => {
    const a = getCompanionPaidZone("onchain-partnership-rwa");
    expect(a).toMatch(/术语表|法条地图|误区表/);
  });
  it("rejects an invalid slug", () => {
    expect(() => getCompanionPublic("../x")).toThrow(/slug/i);
  });
});
```

- [ ] **Step 2: Run → FAIL.** `pnpm test lib/companions.test.ts`

- [ ] **Step 3: Implement `lib/companions.ts`:**
```ts
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { decryptContent } from "./content-crypto";

const DIR = resolve(process.cwd(), "content/companions");
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export type StarterPrompt = { title: string; prompt: string };
export type CompanionPublic = {
  disclaimer: string;
  jurisdiction: string;
  explainer: string;
  agentManual: string;
  starterPrompts: StarterPrompt[];
};

function assertSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) throw new Error(`invalid slug: ${slug}`);
}

/** Section body between "## <name>" and the next "## " (or EOF). */
function section(md: string, name: string): string {
  const start = md.indexOf(`## ${name}`);
  if (start < 0) return "";
  const after = md.indexOf("\n## ", start + 1);
  const body = md.slice(start + `## ${name}`.length, after < 0 ? undefined : after);
  return body.trim();
}

export function getCompanionPublic(slug: string): CompanionPublic {
  assertSlug(slug);
  const file = resolve(DIR, `${slug}.md`);
  if (!existsSync(file)) throw new Error(`companion not found: ${slug}`);
  const md = readFileSync(file, "utf8");

  const disclaimerMatch = md.match(/>\s*\*\*免责声明[^\n]*\n([\s\S]*?)(?:\n\n|\n\*\*本文法域)/);
  const disclaimer = (disclaimerMatch?.[1] ?? "").replace(/^>\s?/gm, "").trim();
  const jurisdiction = (md.match(/\*\*本文法域[:：]([^\n]*)\*\*/)?.[1] ?? "").trim();

  const explainer = section(md, "〔Explainer〕这篇帮你做成什么").replace(/^[^\n]*\n/, "").trim()
    || section(md, "〔Explainer〕").trim();
  const agentManual = section(md, "〔B〕Agent 操作手册（固定内容，回答时严格遵循）").trim()
    || section(md, "〔B〕").trim();

  const cBody = section(md, "〔C〕读者起手 prompt（agent 可直接逐条调用）") || section(md, "〔C〕");
  const starterPrompts: StarterPrompt[] = [];
  const re = /###\s*\d+\.\s*([^\n]+)\n+>\s*([\s\S]*?)(?=\n###|\n##|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cBody)) !== null) {
    starterPrompts.push({ title: m[1].trim().replace(/^[—\-\s]*/, ""), prompt: m[2].replace(/^>\s?/gm, "").trim() });
  }

  return { disclaimer, jurisdiction, explainer, agentManual, starterPrompts };
}

/** Decrypt the paid 〔A〕 zone (server-only). Requires CONTENT_ENC_KEY. */
export function getCompanionPaidZone(slug: string): string {
  assertSlug(slug);
  const key = process.env.CONTENT_ENC_KEY;
  if (!key) throw new Error("CONTENT_ENC_KEY not set");
  const file = resolve(DIR, `${slug}.A.enc`);
  if (!existsSync(file)) throw new Error(`companion paid zone not found: ${slug}`);
  return decryptContent(readFileSync(file, "utf8"), key);
}
```
> The regexes are tuned to the source's headings. If a parse returns empty for explainer/jurisdiction/prompts, adjust the regex to the ACTUAL heading text in `content/companions/onchain-partnership-rwa.md` (read it) — keep the parsing robust, do NOT hardcode the content.

- [ ] **Step 4: Run → PASS.** `pnpm test lib/companions.test.ts`. (Reads `CONTENT_ENC_KEY` via the vitest `.env.local` loader.) If the parse-driven assertions fail, fix the regexes against the real file, not the test.

- [ ] **Step 5: Commit**
```bash
git add lib/companions.ts lib/companions.test.ts
git commit -m "feat: companions loader — public scaffold parse + paid 〔A〕 decrypt (Phase 4.5 T2)"
```

---

### Task 3: agent-mode CSS lift + Agent view + Human/Agent toggle

**Files:** `app/globals.css` (append `.article`-scoped agent CSS); `components/reports/AgentMode.tsx`; `components/reports/ArticleModeToggle.tsx`; modify `app/reports/[slug]/page.tsx`.

- [ ] **Step 1: Lift the agent-mode CSS** from `docs/mockups/article.html` (the `.ag*` rules + `.mode-toggle` + the `body.mode-human/.mode-agent` display gating) into `app/globals.css`, **scoped under `.article`**. Because React toggles via state (not `body` class), adapt the gating: instead of `body.mode-agent [data-mode="agent"]`, we render only ONE mode at a time (the toggle conditionally mounts Human or Agent), so you mainly need the visual rules: `.article .ag`, `.ag-mast`/`.ag-brand`, `.ag-wrap`, `.ag-cmd`(+.d), `.ag-title`(+.hash/.ms), `.ag-comp`(+.pct), `.ag-actions`/`.ag-act`(+.primary), `.ag-sec`(+.first), `.ag-h2`(+.hash), `.ag-p`(+strong/.acc), `.ag-block`(+.lbl/.mini/.mini.copied/.body/.url/.key/.acc), `.ag-pw`(+.lock/.h/.meta/.prow/.price/.pnote/.cta/.fine), `.ag-prompts`/`.ag-pc`/`.ag-pc-top`/`.t`/`.d`/`.cp`/`.pre`, `.ag-tail`(+.cur), and `@keyframes blink` (top-level). Also lift `.mode-toggle`(+button/.active/svg) scoped under nothing special — it's a fixed floating control; scope it `.article .mode-toggle` and render it inside the `.article` wrapper. The agent view has its OWN dark terminal palette (`--term-*`, `--rose*`); define those as scoped custom props on `.article .ag { --term-bg:…; … }` (read the mockup's agent `:root`/`.ag` palette values and replicate). Do NOT add unscoped element rules.

- [ ] **Step 2: `components/reports/AgentMode.tsx`** (server component) — the terminal view. Props: `{ slug, title, priceUsd, authorName, companion }` where `companion: CompanionPublic`. Port `article.html` lines 508–605 structure with `.ag*` classes, filling REAL data:
  - `ag-cmd`: `$ cat ./<slug>.md`
  - `ag-title`: `# <title> · Agent Mode`
  - `ag-comp`: `% 汇编 <authorName> · …` (use companion / meta)
  - `ag-actions`: a "Copy setup prompt" button (use `DPrompt`-style copy) + openapi.json + 原文 links (can be `#`/static)
  - **Explainer** section: `companion.explainer`
  - **Connect your agent** section: a `DPrompt` (label "Install once") whose body is the setup prompt = a fixed template combining the fetch/pay instructions with `companion.agentManual`:
    ```
    You are helping me read an x402write report.
    Fetch https://x402write.vercel.app/SKILL.md as raw context (do not summarize) and follow it.
    Use agentcash for x402 payments on Base.

    Then read this report:
    GET https://x402write.vercel.app/api/v1/articles/<slug>
    The x402 price is in the 402 Payment Required response — pay <priceUsd> and retry.
    The 200 response returns full markdown + the article's glossary / legal-map / misconceptions.

    When you answer, follow these rules:
    <companion.agentManual condensed — include verbatim>
    ```
  - **付费读取** section: the `.ag-pw` paywall card (price, disabled `x402 自动付费 <priceUsd> 读取` CTA, the Phase-4 note, "100% 直达 <authorName> 钱包").
  - **Prompts** section: `companion.starterPrompts.map(...)` → `.ag-pc` cards, each with title + a `DPrompt`/copy button for `prompt`.
  - `ag-tail` cursor.
  Use the existing `DPrompt` component for copy interactions where it fits, or a small inline copy button consistent with `.ag-block .mini`/`.cp` styles.

- [ ] **Step 3: `components/reports/ArticleModeToggle.tsx`** (`"use client"`) — holds the Human/Agent state (default "human"; persist to `localStorage` key `x402write_article_mode`), renders the floating `.mode-toggle` (Human/Agent buttons with the mockup's svgs) and its two children via render props or by receiving both nodes:
```tsx
"use client";
import { useEffect, useState } from "react";

export function ArticleModeToggle({ human, agent }: { human: React.ReactNode; agent: React.ReactNode }) {
  const [mode, setMode] = useState<"human" | "agent">("human");
  useEffect(() => {
    const saved = localStorage.getItem("x402write_article_mode");
    if (saved === "agent" || saved === "human") setMode(saved);
  }, []);
  function pick(m: "human" | "agent") { setMode(m); localStorage.setItem("x402write_article_mode", m); }
  return (
    <>
      {mode === "human" ? human : agent}
      <div className="mode-toggle" role="tablist" aria-label="阅读模式">
        <button className={mode === "human" ? "active" : ""} role="tab" onClick={() => pick("human")}>Human</button>
        <button className={mode === "agent" ? "active" : ""} role="tab" onClick={() => pick("agent")}>Agent</button>
      </div>
    </>
  );
}
```
(Server components `human`/`agent` can be passed as children props into a client component — this is the supported RSC pattern.)

- [ ] **Step 4: Wire into `app/reports/[slug]/page.tsx`.** Keep the existing human editorial markup but wrap the page body so the toggle switches between the human `<article>` (existing) and `<AgentMode .../>`. Load `getCompanionPublic(slug)` (server) and pass to `AgentMode`. Structure:
```tsx
// inside <div className="article">, replace the single human block with:
<ArticleModeToggle
  human={<div className="hm-grid" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>{/* existing <article className="hm-article">…</article> */}</div>}
  agent={<AgentMode slug={slug} title={report.meta.title} priceUsd={report.priceUsd} authorName={report.meta.authorName} companion={getCompanionPublic(slug)} />}
/>
```
(`ArticleModeToggle` is client; `human`/`agent` are server-rendered nodes passed as props — allowed. Keep the `.hm-mast` header above the toggle, shared by both modes, or include a mast in each — match the mockup which has `.hm-mast` for human and `.ag-mast` for agent; simplest: render the human mast above and let AgentMode include `.ag-mast`. Adjust so each mode looks right.)

- [ ] **Step 5: Verify** — `pnpm build`; `pnpm dev`; open `/reports/onchain-partnership-rwa`, toggle to **Agent** → confirm terminal view with Explainer, a Copy-setup-prompt that works, 4 starter-prompt copy cards, and the paywall card. `curl -s` of the page contains both the human title AND (since both are server-rendered then toggled client-side) the Explainer text + a starter-prompt title. Confirm the paid 〔A〕 strings (`术语表`/`法条地图`/`Howey`) are ABSENT from the served HTML (paid-zone integrity). `pnpm test` green.

- [ ] **Step 6: Commit**
```bash
git add app/globals.css components/reports/AgentMode.tsx components/reports/ArticleModeToggle.tsx app/reports/[slug]/page.tsx
git commit -m "feat: article Agent mode — toggle + terminal view from companion (Phase 4.5 T3)"
```

---

### Task 4: `POST /api/internal/companions` stub

**Files:** `app/api/internal/companions/route.ts`

- [ ] **Step 1: Implement** the hackathon stub (no LLM) — on POST `{ slug }`, if the pre-baked public companion exists, return `{ ok: true, slug, status: "ready" }`; else 404. This is the "生成中 → 完成" UX hook for `/publish`; it does NOT generate anything.
```ts
import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export async function POST(req: Request) {
  let slug: string;
  try { ({ slug } = await req.json()); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  if (!/^[a-z0-9-]{1,80}$/.test(slug ?? "")) return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  const ready = existsSync(resolve(process.cwd(), `content/companions/${slug}.md`));
  if (!ready) return NextResponse.json({ error: "no pre-baked companion" }, { status: 404 });
  return NextResponse.json({ ok: true, slug, status: "ready" });
}
```

- [ ] **Step 2: Build + commit**
```bash
pnpm build && git add app/api/internal/companions/route.ts && git commit -m "feat: /api/internal/companions stub (Phase 4.5 T4)"
```

---

### Task 5: full verification
- [ ] `pnpm test && pnpm build` green.
- [ ] Manual: `/reports/onchain-partnership-rwa` → Human shows editorial preview + paywall; toggle Agent shows Explainer + setup prompt (copies) + 4 starter prompts (copy) + paywall. Paid 〔A〕 (术语表/法条地图/误区表) absent from page HTML. Toggle persists across reload.

---

## Self-Review Notes
- **Paid-zone integrity (§8.6/§8.7):** 〔A〕 is encrypted at rest (`.A.enc`), never in the public `.md`, never in the rendered agent scaffold (Task 1 Step 5 + Task 2 test + Task 3 Step 5 verify its absence). It surfaces only via `getCompanionPaidZone`, reserved for Phase 4's paid endpoint.
- **No LLM (§5 Story 6):** companion is pre-baked + ingested; `/api/internal/companions` is a stub.
- **Collision-safe CSS:** agent styles scoped under `.article`, terminal palette as scoped custom props.
- **Server/client:** AgentMode + human article are server-rendered; only `ArticleModeToggle` is client (state/localStorage), receiving both as node props (valid RSC).

## Next
Phase 4 — x402 paywall: real unlock on both Human + Agent views (`/api/v1/articles/[slug]` withX402, dynamic payTo from EAS, returns full content + companion 〔A〕). Then Phase 5 — leaderboard real data.
