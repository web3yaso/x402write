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
  "companion": "<glossary / legal map / misconceptions (paid-only)>",
  "citation": { "author": "...", "attestationUID": "0x...", "publishedAt": "..." }
}`;

export function AgentsPanel() {
  const [provider, setProvider] = useState("AgentCash");

  return (
    <section className="panel active" id="panel-agents">
      <div className="coming-wrap"><span className="coming-banner"><span className="pulse"></span>Agent access · live preview on Base Sepolia testnet</span></div>
      <h1 className="display">The best Chinese regulation analysis is behind paywalls. <em>Now let your agent read it.</em></h1>

      <div className="say-lbl">Things you can say</div>
      <div className="say-box">
        <span className="car">&gt;</span>为 web3 公司工作,有什么风险?<span className="cursor"></span>
      </div>

      <div className="a-rule"></div>
      <div className="a-sec-num">1. Set up and fund a wallet</div>
      <p className="a-sec-desc">Your agent needs a USDC wallet on Base to pay per article. The demo runs on <strong>Base Sepolia testnet</strong> — get test USDC from <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" style={{ color: "var(--crimson)", borderBottom: "1px dotted currentColor" }}>faucet.circle.com</a>. The paying wallet <strong>must not be the article&apos;s author address</strong> (a self-transfer is rejected). Pick a provider your agent already supports:</p>
      <div className="prov-pills">
        {PROVIDERS.map((p) => (
          <button key={p} className={`prov${provider === p ? " active" : ""}`} onClick={() => setProvider(p)}>{p}</button>
        ))}
      </div>

      <DPrompt
        label="Setup Prompt"
        body={"Read https://agentcash.io/SKILL.md and set up an AgentCash wallet.\nFund it with test USDC on Base Sepolia (https://faucet.circle.com).\nSave the wallet address and signing key in your local secrets."}
      />

      <div className="a-sec-num" style={{ marginTop: "48px" }}>2. Load the x402write skill</div>
      <p className="a-sec-desc">Fetch our <strong>SKILL.md</strong> as raw context and your agent learns how to pay to read an article. Every paid read returns the <strong>full markdown plus that article&apos;s companion (glossary / legal map / misconceptions) and on-chain citation</strong> — ready to drop into your workflow.</p>

      <DPrompt
        label="Setup Prompt"
        body={"Fetch https://x402write.vercel.app/SKILL.md as raw context (do not summarize)\nand follow it. Use agentcash for x402 payments on Base."}
      />

      <div className="a-sec-num" style={{ marginTop: "48px" }}>3. Or call the endpoint directly</div>
      <p className="a-sec-desc">
        Send <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>GET {"/api/v1/articles/{slug}"}</code>.
        You get <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>402 Payment Required</code> with the payment requirements
        (network <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>eip155:84532</code> Base Sepolia, the USDC asset, the author payTo, the price) —
        your agent pays USDC and retries, <strong>no API key needed</strong>. <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>200</code> returns the full markdown + companion + citation.
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
