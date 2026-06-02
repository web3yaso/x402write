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
import { explainPaymentError, paymentErrorFromHeader } from "./x402-errors";

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
  if (res.ok) return (await res.json()) as ArticlePaid;
  // A 402 *after* the paid retry carries the facilitator's reject reason in the
  // re-issued `payment-required` header (self_send_not_allowed / insufficient
  // balance / network mismatch / …). Surface it instead of an opaque status code.
  const reason = paymentErrorFromHeader(res.headers.get("payment-required"));
  if (res.status === 402) throw new Error(explainPaymentError(reason));
  throw new Error(`unlock failed: ${res.status}${reason ? ` (${reason})` : ""}`);
}
