"use client";

import { useState } from "react";
import { DPrompt } from "@/components/shared/DPrompt";

const PROVIDERS = ["AgentCash", "Coinbase", "Circle", "Tempo"];

// The paid endpoint that works today. (Search / authors indexes are planned.)
const ENDPOINTS = [
  { method: "GET", post: false, path: "/api/v1/articles/{slug}", meta: "402 → pay → 200 · author-set price" },
];

const RESPONSE_SHAPE = `// 200 OK — paid read
{
  "slug": "...",
  "title": "...",
  "content": "<full article markdown>",
  "companion": "<术语表 / 法条地图 / 误区表 (paid-only)>",
  "citation": { "author": "...", "attestationUID": "0x...", "publishedAt": "..." }
}`;

export function AgentsPanel() {
  const [provider, setProvider] = useState("AgentCash");

  return (
    <section className="panel active" id="panel-agents">
      <div className="coming-wrap"><span className="coming-banner"><span className="pulse"></span>Agent 接入将于下一阶段开放 · 以下为功能预览</span></div>
      <h1 className="display">The best Chinese regulation analysis is behind paywalls. <em>Now let your agent read it.</em></h1>

      <div className="say-lbl">Things you can say</div>
      <div className="say-box">
        <span className="car">&gt;</span>我朋友在杭州 OTC 出金被工行冻结,金额 12 万,人在大陆,下一步该做什么?<span className="cursor"></span>
      </div>

      <div className="a-rule"></div>
      <div className="a-sec-num">1. 准备并充值一个钱包</div>
      <p className="a-sec-desc">你的 agent 需要一个 Base 上的 USDC 钱包来按篇付费。演示跑在 <strong>Base Sepolia 测试网</strong>:在 <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" style={{ color: "var(--crimson)", borderBottom: "1px dotted currentColor" }}>faucet.circle.com</a> 领测试 USDC;付费钱包<strong>不能是文章作者本人的收款地址</strong>(自付会被拒)。选一个你的 agent 已支持的钱包:</p>
      <div className="prov-pills">
        {PROVIDERS.map((p) => (
          <button key={p} className={`prov${provider === p ? " active" : ""}`} onClick={() => setProvider(p)}>{p}</button>
        ))}
      </div>

      <DPrompt
        label="Setup Prompt"
        body={"Read https://agentcash.io/SKILL.md and set up an AgentCash wallet.\nFund it with test USDC on Base Sepolia (https://faucet.circle.com).\nSave the wallet address and signing key in your local secrets."}
      />

      <div className="a-sec-num" style={{ marginTop: "48px" }}>2. 加载 x402write skill</div>
      <p className="a-sec-desc">把我们的 <strong>SKILL.md</strong> 作为原始上下文拉进去,你的 agent 就知道如何对一篇文章付费读取。每次付费读取返回 <strong>全文 markdown + 该文的 companion(术语表 / 法条地图 / 误区表)+ 链上 citation</strong>,可直接用进你的工作流。</p>

      <DPrompt
        label="Setup Prompt"
        body={"Fetch https://x402write.vercel.app/SKILL.md as raw context (do not summarize)\nand follow it. Use agentcash for x402 payments on Base."}
      />

      <div className="a-sec-num" style={{ marginTop: "48px" }}>3. 或直接调用端点</div>
      <p className="a-sec-desc">
        对一篇文章发 <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>GET {"/api/v1/articles/{slug}"}</code>。
        返回 <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>402 Payment Required</code>,
        响应里带支付要求(network <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>eip155:84532</code> Base Sepolia、USDC asset、author 收款地址、价格)——
        你的 agent 付 USDC 后重试即可,<strong>无需 API key</strong>。<code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>200</code> 返回该文全文 + companion + citation。
      </p>

      <div className="ep-table">
        {ENDPOINTS.map((e) => (
          <div className="ep-row" key={e.path}>
            <span className={`method${e.post ? " post" : ""}`}>{e.method}</span>
            <span className="path">{e.path}</span>
            <span className="meta">{e.meta}</span>
          </div>
        ))}
      </div>

      <DPrompt label="200 response" body={RESPONSE_SHAPE} />

      <p className="ep-foot">
        <a href="/SKILL.md" target="_blank" rel="noreferrer">SKILL.md</a>
      </p>
    </section>
  );
}
