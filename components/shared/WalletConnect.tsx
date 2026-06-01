"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { truncateAddress } from "@/lib/format";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="rounded-md bg-charcoal px-4 py-2 font-mono text-sm text-paper-card hover:bg-charcoal-2"
      >
        {truncateAddress(address)} · Disconnect
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected({ target: "metaMask" }) })}
      disabled={isPending}
      className="rounded-md bg-crimson px-4 py-2 text-sm font-semibold text-white hover:bg-crimson-hi disabled:opacity-60"
    >
      {isPending ? "Connecting…" : "Connect MetaMask"}
    </button>
  );
}
