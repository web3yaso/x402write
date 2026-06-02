/**
 * x402-client.ts
 *
 * Browser-side paid fetch using the connected wagmi/MetaMask wallet.
 *
 * The x402 exact-EVM client needs a `ClientEvmSigner`: an object with a top-level
 * `address` + `signTypedData` (and optional `readContract` for ERC-20 enrichment).
 * A viem WalletClient does NOT expose a top-level `.address` (it's at
 * `walletClient.account.address`), so we build the signer explicitly — delegating
 * `signTypedData` to the wallet and `readContract` to publicActions — instead of
 * casting the WalletClient (whose `.address` is undefined at runtime).
 */
import { x402Client } from "@x402/core/client";
import { type ClientEvmSigner } from "@x402/evm";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { publicActions, type WalletClient } from "viem";

export type ArticlePaid = {
  slug: string;
  title: string;
  content: string;
  companion: string;
  citation: { author: string; attestationUID: string; publishedAt: string };
};

export function makePaidFetch(walletClient: WalletClient) {
  const account = walletClient.account;
  if (!account) throw new Error("wallet not connected");

  // readContract is only needed for ERC-20 approval enrichment; USDC uses EIP-3009
  // transferWithAuthorization (no approval), but provide it for safety.
  const reader = walletClient.extend(publicActions);

  // viem's signTypedData is heavily overloaded; cast the method to a loose signature
  // (the runtime call shape is correct — account + EIP-712 payload).
  const signTyped = walletClient.signTypedData as (
    args: Record<string, unknown>,
  ) => Promise<`0x${string}`>;

  const signer: ClientEvmSigner = {
    address: account.address,
    signTypedData: (m) =>
      signTyped({ account, domain: m.domain, types: m.types, primaryType: m.primaryType, message: m.message }),
    readContract: (args) => reader.readContract(args as never),
  };

  const client = new x402Client();
  registerExactEvmScheme(client, { signer });
  return wrapFetchWithPayment(globalThis.fetch, client);
}

export async function unlockArticle(
  walletClient: WalletClient,
  slug: string,
): Promise<ArticlePaid> {
  const paidFetch = makePaidFetch(walletClient);
  const res = await paidFetch(`/api/v1/articles/${slug}`);
  // A 402 *after* the paid retry means the signed payment didn't settle — almost
  // always because the connected wallet lacks test USDC on Base Sepolia (or is on
  // the wrong network). Surface that instead of an opaque status code.
  if (res.status === 402) {
    throw new Error(
      "支付未完成:请确认钱包已切到 Base Sepolia 测试网,且持有足额测试 USDC(可在 faucet.circle.com 领取 Base Sepolia USDC),然后重试。",
    );
  }
  if (!res.ok) throw new Error(`unlock failed: ${res.status}`);
  return (await res.json()) as ArticlePaid;
}
