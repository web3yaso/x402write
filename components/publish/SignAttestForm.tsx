"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { parseUnits, keccak256, toBytes, isAddress } from "viem";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { walletClientToSigner } from "@/lib/ethers-signer";
import { encodeAttestationData, EAS_CONTRACT_ADDRESS } from "@/lib/eas";
import { WalletConnect } from "@/components/shared/WalletConnect";
import type { ReportMeta } from "@/lib/reports";

const DEFAULT_DISCLAIMER = "本文为作者个人观点,不构成法律意见。读者应结合自身情况并咨询持牌专业人士。";
const EXPLORER = "https://base-sepolia.easscan.org/attestation/view/";

export function SignAttestForm({ meta, contentHash, source }: { meta: ReportMeta; contentHash: string; source: string }) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [price, setPrice] = useState("0.30");
  const [disclaimer, setDisclaimer] = useState(DEFAULT_DISCLAIMER);
  const [status, setStatus] = useState<"idle" | "signing" | "done" | "error">("idle");
  const [uid, setUid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const priceNum = Number(price);
  const priceValid = priceNum >= 0.05 && priceNum <= 50;
  const disclaimerValid = disclaimer.length <= 500;

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
        contentHash, author: address, priceUSDC, slug: meta.slug, title: meta.title, publishedAt, version: 1, disclaimer,
      });
      const tx = await eas.attest({
        schema: process.env.NEXT_PUBLIC_EAS_SCHEMA_UID as string,
        data: { recipient: address, expirationTime: 0n, revocable: true, refUID: "0x" + "0".repeat(64), data },
      });
      const newUid = await tx.wait();
      // tx.receipt is populated by wait(); receipt.hash is the on-chain tx hash.
      const txHash = tx.receipt?.hash ?? newUid;
      await fetch("/api/internal/attestations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: meta.slug, attestationUID: newUid, txHash,
          author: address, priceUSDC: priceUSDC.toString(),
          publishedAt: Number(publishedAt), version: 1,
          disclaimerHash: keccak256(toBytes(disclaimer)),
        }),
      });
      setUid(newUid); setStatus("done");
    } catch (e) {
      setErr((e as Error).message ?? "attest failed"); setStatus("error");
    }
  }

  if (status === "done" && uid) {
    return (
      <div className="rounded-lg border border-line bg-paper-card p-6">
        <p className="text-lg font-semibold text-ink">✓ 已上链</p>
        <p className="mt-2 break-all font-mono text-xs text-ink-soft">UID: {uid}</p>
        <a className="mt-4 inline-block text-crimson underline" href={EXPLORER + uid} target="_blank" rel="noreferrer">在 EAS Explorer 查看 →</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-paper-card p-6">
      <Field label="Title">{meta.title}</Field>
      <Field label="Tags">{meta.tags.join(" · ")}</Field>
      <Field label="Author">{meta.authorName}{meta.authorOrg ? ` · ${meta.authorOrg}` : ""}</Field>
      <Field label="Source">{source || "—"}</Field>
      <Field label="Published">{meta.publishedAt}</Field>

      <label className="text-sm font-medium text-ink">Price (USD)
        <input type="number" step="0.01" min="0.05" max="50" value={price} onChange={(e) => setPrice(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" />
        {!priceValid && <span className="text-xs text-crimson">须在 $0.05–$50</span>}
      </label>

      <label className="text-sm font-medium text-ink">Disclaimer ({disclaimer.length}/500)
        <textarea maxLength={500} value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} rows={3}
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" />
      </label>

      {!isConnected ? <WalletConnect /> : (
        <button onClick={signAndAttest} disabled={status === "signing" || !priceValid || !disclaimerValid}
          className="rounded-md bg-crimson px-4 py-2 font-semibold text-white hover:bg-crimson-hi disabled:opacity-60">
          {status === "signing" ? "签名中…" : "Sign + Attest"}
        </button>
      )}
      {err && <p className="text-sm text-crimson">{err}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line-soft pb-2 text-sm">
      <span className="text-ink-mute">{label}</span>
      <span className="text-right text-ink">{children}</span>
    </div>
  );
}
