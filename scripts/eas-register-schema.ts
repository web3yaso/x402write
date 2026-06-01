/**
 * One-time: register the x402write EAS schema on Base Sepolia and print the schema UID.
 *
 *   pnpm tsx scripts/eas-register-schema.ts
 *
 * Reads .env.local for DEMO_AUTHOR_PRIVATE_KEY (testnet only!) and optional
 * BASE_SEPOLIA_RPC_URL. Schema registration is permissionless — the registrant
 * identity is irrelevant to later attestations. Put the printed UID into
 * .env.local as EAS_SCHEMA_UID and NEXT_PUBLIC_EAS_SCHEMA_UID.
 */
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { Wallet, JsonRpcProvider, ZeroAddress } from "ethers";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimal .env.local loader (no dependency). Does not print values.
function loadEnvLocal(): void {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* no .env.local — rely on process.env */
  }
}
loadEnvLocal();

const SCHEMA =
  "bytes32 contentHash,address author,uint96 priceUSDC,string slug,string title,uint64 publishedAt,uint16 version,string disclaimer";
const REGISTRY = process.env.EAS_SCHEMA_REGISTRY ?? "0x4200000000000000000000000000000000000020";

async function main() {
  let pk = process.env.DEMO_AUTHOR_PRIVATE_KEY;
  if (!pk) throw new Error("DEMO_AUTHOR_PRIVATE_KEY not found in .env.local");
  if (!pk.startsWith("0x")) pk = "0x" + pk;

  const rpc = process.env.BASE_SEPOLIA_RPC_URL ?? "https://base-sepolia-rpc.publicnode.com";
  const provider = new JsonRpcProvider(rpc);
  const net = await provider.getNetwork();
  if (net.chainId !== 84532n) throw new Error(`expected Base Sepolia (84532), got ${net.chainId}`);

  const wallet = new Wallet(pk, provider);
  console.log("RPC        :", rpc);
  console.log("registrant :", await wallet.getAddress());
  console.log("schema     :", SCHEMA);
  console.log("registering…");

  const registry = new SchemaRegistry(REGISTRY);
  registry.connect(wallet);
  const tx = await registry.register({ schema: SCHEMA, resolverAddress: ZeroAddress, revocable: true });
  const uid = await tx.wait();

  console.log("\n✅ schema registered. Add these to .env.local:\n");
  console.log("EAS_SCHEMA_UID=" + uid);
  console.log("NEXT_PUBLIC_EAS_SCHEMA_UID=" + uid + "\n");
}

main().catch((e) => {
  console.error("ERROR:", e?.shortMessage ?? e?.message ?? e);
  process.exit(1);
});
