"use client";

import { useState } from "react";
import { DPrompt } from "@/components/shared/DPrompt";

// Agent wallets that can hold USDC on Base Sepolia and pay an x402 request.
// Cobo Agentic Wallet is the default / featured solution: it natively signs x402
// (and MPP) payments and supports Base Sepolia (Cobo chain TBASE_SETH).
const PROVIDERS = ["Cobo", "Coinbase", "AgentCash", "Circle"] as const;
type Provider = (typeof PROVIDERS)[number];

// The payment mechanism is identical (sign an x402 payment, the client retries);
// only the wallet differs — so each prompt is true at this level, not fabricated.
const SETUP_PROMPTS: Record<Provider, string> = {
  Cobo:
    "Add Cobo Agentic Wallet to your agent:\nnpx skills add CoboGlobal/cobo-agentic-wallet --skill cobo-agentic-wallet-developer --yes --global\nPair with your owner wallet, create a wallet on Base Sepolia (Cobo chain TBASE_SETH),\nand fund it with test USDC (https://docs.base.org/base-chain/network-information/network-faucets).",
  Coinbase:
    "Use a Coinbase CDP wallet with x402 (@coinbase/x402) on Base Sepolia.\nFund it with test USDC (https://docs.base.org/base-chain/network-information/network-faucets). Let the x402 client\npay each 402 and retry — no API key needed.",
  AgentCash:
    "Read https://agentcash.io/SKILL.md and set up an AgentCash wallet.\nFund it with test USDC on Base Sepolia (https://docs.base.org/base-chain/network-information/network-faucets).\nSave the wallet address and signing key in your local secrets.",
  Circle:
    "Set up a Circle programmable wallet on Base Sepolia.\nFund it with test USDC (https://docs.base.org/base-chain/network-information/network-faucets) and sign x402\npayments with it to unlock paid reads.",
};

// The endpoints that work today.
const ENDPOINTS = [
  { method: "GET", post: false, path: "/api/v1/articles", meta: "free · list catalog · ?q= to search" },
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
  const [provider, setProvider] = useState<Provider>("Cobo");

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
      <p className="a-sec-desc">Your agent needs a USDC wallet on Base to pay per article. The demo uses <strong><a href="https://www.cobo.com/products/agentic-wallet" target="_blank" rel="noreferrer" style={{ color: "var(--crimson)", borderBottom: "1px dotted currentColor" }}>Cobo Agentic Wallet</a></strong> on <strong>Base Sepolia testnet</strong> — get test USDC + gas from a <a href="https://docs.base.org/base-chain/network-information/network-faucets" target="_blank" rel="noreferrer" style={{ color: "var(--crimson)", borderBottom: "1px dotted currentColor" }}>Base Sepolia faucet</a>. The paying wallet <strong>must not be the article&apos;s author address</strong> (a self-transfer is rejected). Cobo is the default; pick another only if your agent already uses it:</p>
      <div className="prov-pills">
        {PROVIDERS.map((p) => (
          <button key={p} className={`prov${provider === p ? " active" : ""}`} onClick={() => setProvider(p)}>{p}</button>
        ))}
      </div>

      <DPrompt key={provider} label={`Setup Prompt · ${provider}`} body={SETUP_PROMPTS[provider]} />

      <div className="a-sec-num" style={{ marginTop: "48px" }}>2. Load the x402write skill</div>
      <p className="a-sec-desc">Fetch our <strong>SKILL.md</strong> as raw context and your agent learns how to pay to read an article. Every paid read returns the <strong>full markdown plus that article&apos;s companion (glossary / legal map / misconceptions) and on-chain citation</strong> — ready to drop into your workflow.</p>

      <DPrompt
        label="Setup Prompt"
        body={"Fetch https://x402write.vercel.app/SKILL.md as raw context (do not summarize)\nand follow it. Use Cobo Agentic Wallet to make the x402 payment on Base."}
      />

      <div className="a-sec-num" style={{ marginTop: "48px" }}>3. Or call the endpoint directly</div>
      <p className="a-sec-desc">
        List the catalog (free) with <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>GET /api/v1/articles</code> (add <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>?q=</code> to search), then pay for one:
        <br />Send <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>GET {"/api/v1/articles/{slug}"}</code>.
        You get <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>402 Payment Required</code> with the payment requirements
        (network <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>eip155:84532</code> Base Sepolia, the USDC asset, the author payTo, the price) —
        your agent pays USDC and retries. <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>200</code> returns the full markdown + companion + citation.
        With <strong>Cobo Agentic Wallet</strong> the pay step is one call — POST the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>Payment-Required</code> header to <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>{"/v1/wallets/{id}/payment"}</code> (protocol <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>x402</code>), then replay with the returned <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", background: "var(--paper-soft)", padding: "1px 4px", borderRadius: "3px" }}>PAYMENT-SIGNATURE</code>.
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
