/**
 * Map an x402 facilitator reject reason to a reader-facing Chinese message.
 *
 * When a paid retry still returns 402, the server re-issues the `payment-required`
 * header (base64 JSON) carrying an `error` reason. The exact-EVM reasons mirror the
 * Go facilitator constants (@x402/evm errors). Surfacing the real reason turns an
 * opaque "unlock failed: 402" into something the user can act on.
 */

/** Decode the `error` reason out of a base64 `payment-required` header value. */
export function paymentErrorFromHeader(header: string | null): string {
  if (!header) return "";
  try {
    const parsed = JSON.parse(b64ToUtf8(header)) as { error?: unknown };
    return typeof parsed.error === "string" ? parsed.error : "";
  } catch {
    return "";
  }
}

/** Human-readable explanation for a facilitator reject reason (raw code preserved). */
export function explainPaymentError(reason: string): string {
  switch (reason) {
    case "self_send_not_allowed":
      return "无法购买自己的文章:当前钱包就是作者收款地址,请切换到另一个(读者)钱包再购买。";
    case "invalid_exact_evm_insufficient_balance":
      return "测试 USDC 余额不足:请在 docs.base.org/base-chain/network-information/network-faucets 领取 Base Sepolia USDC(≥本文价格)后重试。";
    case "invalid_exact_evm_network_mismatch":
      return "网络不匹配:请将钱包切换到 Base Sepolia 测试网(chainId 84532)后重试。";
    case "invalid_exact_evm_nonce_already_used":
      return "该笔授权已被使用,请刷新页面后重新发起支付。";
    case "":
      return "支付未完成:请确认钱包已切到 Base Sepolia 测试网,且持有足额测试 USDC(docs.base.org/base-chain/network-information/network-faucets),然后重试。";
    default:
      return `支付未完成(${reason})。请确认钱包在 Base Sepolia 测试网、持有足额测试 USDC,且不是作者本人地址。`;
  }
}

/** Base64 → UTF-8, isomorphic across the browser (atob) and Node (Buffer). */
function b64ToUtf8(b64: string): string {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8");
}
