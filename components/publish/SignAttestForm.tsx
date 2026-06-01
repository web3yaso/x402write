"use client";

import { useState } from "react";
import { useAccount, useWalletClient, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { parseUnits, keccak256, toBytes, isAddress } from "viem";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { walletClientToSigner } from "@/lib/ethers-signer";
import { encodeAttestationData, EAS_CONTRACT_ADDRESS } from "@/lib/eas";
import { truncateAddress } from "@/lib/format";
import type { ReportMeta } from "@/lib/reports";

const DEFAULT_DISCLAIMER =
  "本文为作者个人观点,不构成法律意见。读者应结合自身情况并咨询持牌专业人士。";
const EXPLORER = "https://base-sepolia.easscan.org/attestation/view/";
const PRESETS = ["0.05", "0.30", "0.50", "1.00"] as const;

interface AttestResult {
  uid: string;
  txHash: string;
  attester: string;
}

export function SignAttestForm({
  meta,
  contentHash,
  source,
}: {
  meta: ReportMeta;
  contentHash: string;
  source: string;
}) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [price, setPrice] = useState("0.30");
  const [disclaimer, setDisclaimer] = useState(DEFAULT_DISCLAIMER);
  const [status, setStatus] = useState<"idle" | "signing" | "done" | "error">("idle");
  const [result, setResult] = useState<AttestResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const priceNum = parseFloat(price);
  const priceValid = !isNaN(priceNum) && priceNum >= 0.05 && priceNum <= 50;
  const disclaimerValid = disclaimer.length <= 500;
  const priceUSDCDisplay = priceValid ? Math.round(priceNum * 1e6).toLocaleString("en-US") : "—";

  function handlePriceInput(val: string) {
    setPrice(val);
  }

  function handlePriceBlur() {
    const p = parseFloat(price);
    if (isNaN(p) || p < 0.05) setPrice("0.05");
    else if (p > 50) setPrice("50.00");
    else setPrice(p.toFixed(2));
  }

  async function signAndAttest() {
    if (!walletClient || !address || !isAddress(address)) return;
    if (!priceValid) { setErr("价格须在 $0.05–$50"); return; }
    if (!disclaimerValid) { setErr("免责声明须 ≤ 500 字"); return; }
    setStatus("signing"); setErr(null);
    try {
      const signer = walletClientToSigner(walletClient);
      const eas = new EAS(EAS_CONTRACT_ADDRESS);
      eas.connect(signer);
      const priceUSDC = parseUnits(price, 6);
      const publishedAt = BigInt(Math.floor(Date.parse(meta.publishedAt) / 1000));
      const data = encodeAttestationData({
        contentHash,
        author: address,
        priceUSDC,
        slug: meta.slug,
        title: meta.title,
        publishedAt,
        version: 1,
        disclaimer,
      });
      const tx = await eas.attest({
        schema: process.env.NEXT_PUBLIC_EAS_SCHEMA_UID as string,
        data: {
          recipient: address,
          expirationTime: 0n,
          revocable: true,
          refUID: "0x" + "0".repeat(64),
          data,
        },
      });
      const newUid = await tx.wait();
      const txHash = tx.receipt?.hash ?? newUid;
      await fetch("/api/internal/attestations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: meta.slug,
          attestationUID: newUid,
          txHash,
          author: address,
          priceUSDC: priceUSDC.toString(),
          publishedAt: Number(publishedAt),
          version: 1,
          disclaimerHash: keccak256(toBytes(disclaimer)),
        }),
      });
      setResult({ uid: newUid, txHash, attester: address });
      setStatus("done");
    } catch (e) {
      setErr((e as Error).message ?? "attest failed");
      setStatus("error");
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1400);
    }).catch(() => {});
  }

  const canSign = isConnected && priceValid && disclaimerValid && status !== "signing";

  // Truncate hash for display in attest preview
  const hashShort = contentHash.length > 10
    ? `${contentHash.slice(0, 8)}…${contentHash.slice(-4)}`
    : contentHash;

  const authorDisplay = isConnected && address
    ? address
    : "— 连接钱包后填入 —";

  const firstTag = meta.tags[0] ?? "";

  return (
    <>
      {/* ── Header ── */}
      <p className="eyebrow">Story 1 · Import → Sign + Attest</p>
      <h1 className="display">
        确认导入的报告,<em>定价并签名上链</em>。
      </h1>
      <p className="sub">
        从首页导入一篇公众号 / Mirror / Substack 文章后,这里会抓取标题、标签和作者。你设定价格,连接钱包签名
        —— 一条 EAS 存证写入 Base,报告即刻进入 /reports,之后每笔付费都直达你的地址。
      </p>

      {/* ── Import strip ── */}
      <div className="import-strip">
        <span className="is-ico">⇣</span>
        <div className="is-text">
          <div className="is-l1">已从外部导入这篇文章</div>
          <div className="is-l2">{source || "— 无导入来源 —"}</div>
        </div>
        <a href="/" className="is-edit">重新导入</a>
      </div>

      {/* ── Step 01 ── */}
      <div className="step">
        <span className="num">01</span>
        <h2>确认导入的报告</h2>
        <span className="hint">title / tags / author 自动抓取</span>
      </div>

      <div className="review">
        <div className="review-top">
          <div className="review-tags">
            {meta.tags.map((tag, i) => (
              <span key={tag} className={i === 0 ? "tag cat" : "tag"}>{tag}</span>
            ))}
          </div>
          <h3>{meta.title}</h3>
          <p className="summary">{meta.summary}</p>
          <div className="review-byline">
            <span className="av">{meta.authorName.charAt(0)}</span>
            <b>{meta.authorName}</b>
            {meta.authorOrg && (
              <span className="plat">@{meta.authorOrg}</span>
            )}
          </div>
        </div>
        <div className="review-meta">
          <div className="rm-cell">
            <div className="k">slug</div>
            <div className="v" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "12.5px" }}>
              {meta.slug}
            </div>
          </div>
          <div className="rm-cell">
            <div className="k">jurisdiction</div>
            <div className="v">{meta.tags[1] ?? "—"}</div>
          </div>
          <div className="rm-cell">
            <div className="k">category</div>
            <div className="v">{firstTag || "—"}</div>
          </div>
          <div className="rm-cell">
            <div className="k">published</div>
            <div className="v">{meta.publishedAt}</div>
          </div>
        </div>
      </div>

      <div className="hash-strip">
        <span className="k">contentHash</span>
        <span className="v">{contentHash}</span>
        <span className="tip">keccak256(markdown body)</span>
      </div>

      {/* ── Step 02 ── */}
      <div className="step">
        <span className="num">02</span>
        <h2>设定价格</h2>
        <span className="hint">作者自己定 · 链上写入</span>
      </div>

      <div className="price-set">
        <div className="price-field">
          <span className="cur">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={price}
            aria-label="单篇价格"
            onChange={(e) => handlePriceInput(e.target.value)}
            onBlur={handlePriceBlur}
          />
          <span className="per">/ 篇</span>
        </div>
        <div className="price-side">
          <div className="ps-conv">
            链上写入 <code>{priceUSDCDisplay}</code>{" "}
            <span>priceUSDC · USDC 6 decimals</span>
          </div>
          <div className="ps-presets">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={parseFloat(price).toFixed(2) === parseFloat(p).toFixed(2) ? "on" : ""}
                onClick={() => setPrice(parseFloat(p).toFixed(2))}
                type="button"
              >
                ${p}
              </button>
            ))}
          </div>
          {!priceValid && price !== "" && (
            <p className="price-error">价格须在 $0.05–$50</p>
          )}
          <p className="ps-note">
            真人 x402 阅读与 Agent API 调用 <b>同价</b> · 最低 $0.05 · 平台 0 抽成,100% 直达你的钱包。
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-wrap">
        <label>
          Disclaimer ({disclaimer.length}/500)
        </label>
        <textarea
          maxLength={500}
          value={disclaimer}
          onChange={(e) => setDisclaimer(e.target.value)}
          rows={3}
        />
        <p className="disc-note">
          此免责声明将随 EAS 存证一起上链,最多 500 字。
        </p>
      </div>

      {/* ── Step 03 ── */}
      <div className="step">
        <span className="num">03</span>
        <h2>连接钱包并签名上链</h2>
        <span className="hint">revocable · recipient = author</span>
      </div>

      {/* Wallet bar */}
      <div className="wallet-bar">
        <div className="wallet-l">
          <span className={`wallet-dot${isConnected ? " on" : ""}`}></span>
          <div className="wallet-text">
            <div className="l1">{isConnected ? "已连接" : "钱包未连接"}</div>
            <div className="l2">
              {isConnected && address
                ? address
                : "连接的地址必须 = 作者地址,否则拒绝上链"}
            </div>
          </div>
        </div>
        {isConnected && (
          <span className="net-badge">
            network · <b>Base Sepolia</b>
          </span>
        )}
        <button
          className="btn-wallet"
          onClick={() =>
            isConnected
              ? disconnect()
              : connect({ connector: injected({ target: "metaMask" }) })
          }
          disabled={isConnecting}
          type="button"
        >
          {isConnected ? "断开" : isConnecting ? "连接中…" : "连接钱包"}
        </button>
      </div>

      {/* EAS attestation preview */}
      <div className="attest" style={{ marginTop: "12px" }}>
        <span className="attest-lbl">EAS Schema</span>
        <div className="schema">{`bytes32 contentHash, address author, uint96 priceUSDC,\nstring slug, string title, uint64 publishedAt, uint8 version, string disclaimer`}</div>
        <div className="row">
          <span className="field">contentHash</span>
          <span className="val">{hashShort}</span>
        </div>
        <div className="row">
          <span className="field">author</span>
          <span className="val">{authorDisplay}</span>
        </div>
        <div className="row">
          <span className="field">priceUSDC</span>
          <span className="val acc">
            {priceUSDCDisplay}{" "}
            <span style={{ color: "#7a7064" }}>
              · ${priceValid ? priceNum.toFixed(2) : "—"} · 6 decimals
            </span>
          </span>
        </div>
        <div className="row">
          <span className="field">slug</span>
          <span className="val">{meta.slug}</span>
        </div>
        <div className="row">
          <span className="field">title</span>
          <span className="val">
            {meta.title.length > 28 ? meta.title.slice(0, 28) + "…" : meta.title}
          </span>
        </div>
      </div>

      {/* Sign zone */}
      <div className="sign-zone">
        <button
          className={`btn-sign${status === "signing" ? " busy" : ""}`}
          disabled={!canSign}
          onClick={signAndAttest}
          type="button"
        >
          <span className="spin"></span>
          <span>
            {status === "signing"
              ? "签名中…"
              : isConnected
              ? "Sign + Attest"
              : "连接钱包后可签名"}
          </span>
        </button>
        <p className="sign-note">
          签名只确认作者身份与定价,<b>不</b>支付内容费用 —— 仅需少量 Sepolia ETH 付 gas。
        </p>
      </div>

      {/* Pending toast */}
      <div className={`pending${status === "signing" ? " show" : ""}`}>
        <span className="spin"></span>
        <span>
          <span className="ph">tx pending</span> · 等待 Base Sepolia 确认…
        </span>
      </div>

      {/* Error display */}
      {err && (
        <div className="form-error">{err}</div>
      )}

      {/* Result panel */}
      {result && status === "done" && (
        <div className="result show">
          <div className="result-head">
            <span className="result-check">✓</span>
            <div>
              <div className="rt">存证已上链 · Attestation live</div>
              <div className="rs">
                这篇报告现在可被任何人验证作者与定价,并将自动出现在 /reports。
              </div>
            </div>
          </div>
          <div className="result-rows">
            <div className="result-row">
              <span className="k">attestation uid</span>
              <span className="v">{result.uid}</span>
              <button
                className={`copy${copiedField === "uid" ? " copied" : ""}`}
                onClick={() => copyToClipboard(result.uid, "uid")}
                type="button"
              >
                {copiedField === "uid" ? "copied" : "copy"}
              </button>
            </div>
            <div className="result-row">
              <span className="k">tx hash</span>
              <span className="v">{result.txHash}</span>
              <button
                className={`copy${copiedField === "tx" ? " copied" : ""}`}
                onClick={() => copyToClipboard(result.txHash, "tx")}
                type="button"
              >
                {copiedField === "tx" ? "copied" : "copy"}
              </button>
            </div>
            <div className="result-row">
              <span className="k">attester</span>
              <span className="v">{result.attester}</span>
              <button
                className={`copy${copiedField === "att" ? " copied" : ""}`}
                onClick={() => copyToClipboard(result.attester, "att")}
                type="button"
              >
                {copiedField === "att" ? "copied" : "copy"}
              </button>
            </div>
          </div>
          <div className="result-actions">
            <a
              href={EXPLORER + result.uid}
              target="_blank"
              rel="noopener noreferrer"
              className="a-primary"
            >
              在 EAS Explorer 验证 ↗
            </a>
            <a href="/reports" className="a-ghost">
              前往 /reports 查看 →
            </a>
          </div>
        </div>
      )}

      {/* Security note */}
      <p className="secnote">
        <span className="lock">⛨</span>{" "}
        <b>服务端独立校验</b> · contentHash 在响应内重算并比对,attester 必须等于 frontmatter author,slug
        走 a-z0-9- 白名单。任一不一致则拒绝上索引。
      </p>
    </>
  );
}
