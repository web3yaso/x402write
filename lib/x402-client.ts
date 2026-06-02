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

  const signer: ClientEvmSigner = {
    address: account.address,
    signTypedData: (m) =>
      walletClient.signTypedData({
        account,
        domain: m.domain as never,
        types: m.types as never,
        primaryType: m.primaryType as never,
        message: m.message as never,
      }),
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
  if (!res.ok) throw new Error(`unlock failed: ${res.status}`);
  return (await res.json()) as ArticlePaid;
}
