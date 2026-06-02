/** Shorten an EVM address to `0x1234…5678`. Throws if not a 0x-prefixed 40-hex address. */
export function truncateAddress(address: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Invalid EVM address: ${address}`);
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * True only when `url` points at a real external article (has a path beyond "/").
 * A bare-domain placeholder like `https://mp.weixin.qq.com/` — used as a stand-in
 * on original pieces with no canonical repost — returns false, so "查看原文" stays hidden.
 */
export function isExternalSourceUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/+$/, "") !== "";
  } catch {
    return false;
  }
}
