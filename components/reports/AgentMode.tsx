import { DPrompt } from "@/components/shared/DPrompt";
import { AgentUnlockGate } from "@/components/reports/AgentUnlockGate";
import type { CompanionPublic } from "@/lib/companions";

interface Props {
  slug: string;
  title: string;
  priceUsd: string;
  authorName: string;
  companion: CompanionPublic;
}

export function AgentMode({ slug, title, priceUsd, authorName, companion }: Props) {
  const setupPrompt = `You are helping me read an x402write report.
Fetch https://x402write.vercel.app/SKILL.md as raw context (do not summarize) and follow it.
Use agentcash for x402 payments on Base.

Then read this report:
GET https://x402write.vercel.app/api/v1/articles/${slug}
The x402 price is returned in the 402 Payment Required response — pay ${priceUsd} and retry.
The 200 response returns full markdown + the article's glossary / legal-map / misconceptions.

When you answer, follow these rules:
${companion.agentManual}`;

  return (
    <div className="ag">
      <header className="ag-mast">
        <a href="/" className="ag-brand">
          <span className="mark"></span>x402write
        </a>
      </header>

      <div className="ag-wrap">
        <p className="ag-cmd">
          <span className="d">$</span>cat ./{slug}.md
        </p>

        <h1 className="ag-title">
          <span className="hash">#</span>{title}{" "}
          <span className="ms">· Agent Mode</span>
        </h1>

        <p className="ag-comp">
          <span className="pct">%</span> 汇编 {authorName} · {companion.jurisdiction}
        </p>

        <div className="ag-actions">
          <button className="ag-act primary">Copy setup prompt</button>
          <a href="#" className="ag-act">openapi.json</a>
          <a href="#" className="ag-act">查看原文</a>
        </div>

        {/* ## Explainer */}
        <section className="ag-sec first">
          <div className="ag-h2">
            <span className="hash">##</span>Explainer
          </div>
          <p className="ag-p">{companion.explainer}</p>
        </section>

        {/* ## Connect your agent */}
        <section className="ag-sec">
          <div className="ag-h2">
            <span className="hash">##</span>Connect your agent
          </div>
          <p className="ag-p">
            把下面这段一次性贴给 Codex / Claude Code / 你的 agent，它会加载 x402write skill，并知道如何为这篇付费读取全文。
          </p>
          <DPrompt label="Install once" body={setupPrompt} />
        </section>

        {/* ## 付费读取 */}
        <section className="ag-sec">
          <div className="ag-h2">
            <span className="hash">##</span>付费读取
          </div>
          <AgentUnlockGate
            slug={slug}
            priceUsd={priceUsd}
            preview={
              <div className="ag-pw">
                <span className="lock">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  付费阅读 · 已读 24%
                </span>
                <p className="h">
                  解锁后读取全文 + 全部 prompt：7 步应对清单、条款拆解、风险边界全覆盖。
                </p>
                <p className="meta">真人与 Agent 同价 · 付费即拿结构化结论</p>
                <div className="prow">
                  <span className="price">{priceUsd}</span>
                  <span className="pnote">USDC on Base · 一次付费永久可读</span>
                </div>
                <p className="fine">
                  付费后 <strong>{priceUsd}（100%）</strong>直达 {authorName} 钱包 · 平台 0 抽成
                </p>
              </div>
            }
          />
        </section>

        {/* ## Prompts */}
        {companion.starterPrompts.length > 0 && (
          <section className="ag-sec">
            <div className="ag-h2">
              <span className="hash">##</span>Prompts
            </div>
            <p className="ag-p">以下 prompt 已包含在付费响应里，你的 agent 可直接逐条调用。</p>
            <div className="ag-prompts">
              {companion.starterPrompts.map((sp, i) => (
                <div key={i} className="ag-pc">
                  <div className="ag-pc-top">
                    <div>
                      <div className="t">{sp.title}</div>
                    </div>
                  </div>
                  <div className="pre">{sp.prompt}</div>
                  <div style={{ marginTop: "10px" }}>
                    <DPrompt label={sp.title} body={sp.prompt} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="ag-tail">
          <span className="d">$</span>
          <span className="cur"></span>
        </p>
      </div>
    </div>
  );
}
