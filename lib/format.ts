/** Shorten an EVM address to `0x1234…5678`. Throws if not a 0x-prefixed 40-hex address. */
export function truncateAddress(address: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Invalid EVM address: ${address}`);
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
