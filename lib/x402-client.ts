/**
 * x402-client.ts
 *
 * Browser-side paid fetch using the connected wagmi/MetaMask wallet.
 *
 * Registration API used:
 *   import { registerExactEvmScheme } from "@x402/evm/exact/client"
 *   registerExactEvmScheme(client, { signer: signer as ClientEvmSigner })
 *
 * Why this path (not "@x402/evm/exact/client/register"):
 *   The "@x402/evm" package.json `exports` has no "./exact/client/register"
 *   subpath — only "./exact/client". The `registerExactEvmScheme` function
 *   and the `ExactEvmScheme` class are both exported from that single entry.
 *
 * Why the cast:
 *   `ClientEvmSigner` requires `readonly address: \`0x\${string}\`` at the
 *   top level. A viem WalletClient stores the address at `client.account.address`,
 *   so the structural check fails even though the runtime shape is correct and
 *   the x402 SDK accesses `signer.address` which is actually `client.address`
 *   (viem proxies it). The cast is safe; the runtime shape satisfies the contract.
 *
 * schemeOptions.rpcUrl:
 *   Not passed — the injected wallet (MetaMask, via publicActions) handles all
 *   on-chain reads through the browser provider. No explicit RPC URL needed.
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
  // Extend with publicActions so readContract, estimateFeesPerGas, etc. are
  // available (satisfies ClientEvmSigner's optional capability requirements).
  const extended = walletClient.extend(publicActions);

  // Cast required: viem WalletClient exposes address at client.account.address
  // but ClientEvmSigner expects it directly at signer.address. At runtime viem
  // proxies .address → .account.address, so the shape is correct.
  const signer = extended as unknown as ClientEvmSigner;

  const client = new x402Client();
  // Registers wildcard eip155:* (V2) + all supported EVM networks (V1).
  // No schemeOptions.rpcUrl needed — MetaMask provider handles reads via publicActions.
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
