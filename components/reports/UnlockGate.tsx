"use client";
import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { createWalletClient, custom, type EIP1193Provider } from "viem";
import { baseSepolia } from "viem/chains";
import { unlockArticle, type ArticlePaid } from "@/lib/x402-client";

const cacheKey = (slug: string) => `x402write_unlocked_${slug}`;

export function UnlockGate({
  slug,
  priceUsd,
  preview,
  renderFull,
  ctaClassName,
}: {
  slug: string;
  priceUsd: string;
  preview: React.ReactNode;
  renderFull: (full: ArticlePaid) => React.ReactNode;
  ctaClassName?: string;
}) {
  const { isConnected, address, connector } = useAccount();
  const { connect } = useConnect();
  const [full, setFull] = useState<ArticlePaid | null>(null);
  const [status, setStatus] = useState<"idle" | "paying" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey(slug));
    if (cached) {
      try {
        setFull(JSON.parse(cached));
      } catch {}
    }
  }, [slug]);

  async function onUnlock() {
    setErr(null);
    if (!isConnected || !address || !connector?.getProvider) {
      connect({ connector: injected({ target: "metaMask" }) });
      return;
    }
    setStatus("paying");
    try {
      // Build the wallet client on-demand from the live connector provider —
      // avoids the reactive useWalletClient() hook lagging after cookie reconnect.
      const provider = (await connector.getProvider()) as EIP1193Provider;
      const walletClient = createWalletClient({
        account: address,
        chain: baseSepolia,
        transport: custom(provider),
      });
      const data = await unlockArticle(walletClient, slug);
      localStorage.setItem(cacheKey(slug), JSON.stringify(data));
      setFull(data);
      setStatus("idle");
    } catch (e) {
      setErr((e as Error).message ?? "unlock failed");
      setStatus("error");
    }
  }

  if (full) return <>{renderFull(full)}</>;
  return (
    <>
      {preview}
      <div style={{ marginTop: 14 }}>
        <button
          className={ctaClassName ?? "pw-cta"}
          onClick={onUnlock}
          disabled={status === "paying"}
        >
          {status === "paying"
            ? "付款中…"
            : !isConnected
            ? `连接钱包付 ${priceUsd} 解锁全文`
            : `用钱包付 ${priceUsd} 解锁全文`}
        </button>
        {err && (
          <p className="pw-fine" style={{ color: "var(--crimson)" }}>
            {err}
          </p>
        )}
      </div>
    </>
  );
}
