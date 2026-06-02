import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import { findRecord } from "./attestation-index";

export const X402_NETWORK = "eip155:84532";

if (process.env.X402_NETWORK && process.env.X402_NETWORK !== X402_NETWORK) {
  throw new Error(`X402_NETWORK must be ${X402_NETWORK}, got ${process.env.X402_NETWORK}`);
}

let _server: x402ResourceServer | null = null;
export function getX402Server(): x402ResourceServer {
  if (!_server) {
    const facilitator = new HTTPFacilitatorClient(
      createFacilitatorConfig(process.env.CDP_API_KEY_ID, process.env.CDP_API_KEY_SECRET),
    );
    _server = new x402ResourceServer(facilitator).register(X402_NETWORK, new ExactEvmScheme());
  }
  return _server;
}

export function slugFromPath(path: string): string {
  return path.replace(/\/+$/, "").split("/").pop() ?? "";
}

export function payToForSlug(slug: string): string {
  const rec = findRecord(slug);
  if (!rec) throw new Error(`no published record for ${slug}`);
  return rec.author;
}

export function priceUsdForSlug(slug: string): string {
  const rec = findRecord(slug);
  if (!rec) throw new Error(`no published record for ${slug}`);
  return "$" + (Number(BigInt(rec.priceUSDC)) / 1e6).toFixed(2);
}
