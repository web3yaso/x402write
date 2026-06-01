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
