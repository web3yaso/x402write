/**
 * Seed-attest: attest the given article slugs on-chain (EAS, Base Sepolia) with
 * DEMO_AUTHOR_PRIVATE_KEY and append index records — so SEED articles appear in
 * /reports and are payable without a manual /publish per article.
 *
 *   node_modules/.bin/tsx scripts/seed-attest.ts <slug> [<slug> ...]
 *
 * Requires the article to be ingested first (`encrypt-content.ts`), plus
 * DEMO_AUTHOR_PRIVATE_KEY, EAS_SCHEMA_UID, CONTENT_ENC_KEY, BASE_SEPOLIA_RPC_URL.
 * Idempotent per slug: appendIndex is first-write-wins (re-seeding a slug throws).
 */
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { Wallet, JsonRpcProvider } from "ethers";
import { keccak256, toBytes, parseUnits } from "viem";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { encodeAttestationData, EAS_CONTRACT_ADDRESS } from "../lib/eas";
import { getReportMeta, getReportBody } from "../lib/reports";
import { appendIndex } from "../lib/attestation-index";

function loadEnvLocal(): void {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnvLocal();

// Per-slug price in USD (atomic = USD * 1e6). Defaults to $0.30.
const PRICE_USD: Record<string, string> = {
  "yaoqian-crypto-liability": "0.30",
  "web3-illegal-employment": "0.25",
};
const DEFAULT_PRICE = "0.30";

// Per-slug author wallet (payTo). The attestation is signed by DEMO_AUTHOR_PRIVATE_KEY
// (the platform seeder) but records this address as the article's author/recipient,
// so payments route to the real author wallet — not the seeder. Defaults to the signer.
const AUTHOR_BY_SLUG: Record<string, string> = {
  "yaoqian-crypto-liability": "0xCC2D5DC5148d8Ad52Da32bd7C6B6F9d43510A392", // web3law / Lawson Riskman
  "web3-illegal-employment": "0xCC2D5DC5148d8Ad52Da32bd7C6B6F9d43510A392",
};
const DISCLAIMER =
  "本文为作者个人观点,不构成法律意见。读者应结合自身情况并咨询持牌专业人士。";

async function main() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) throw new Error("usage: seed-attest <slug> [<slug> ...]");

  let pk = process.env.DEMO_AUTHOR_PRIVATE_KEY;
  if (!pk) throw new Error("DEMO_AUTHOR_PRIVATE_KEY not set");
  if (!pk.startsWith("0x")) pk = "0x" + pk;
  const schemaUID = process.env.EAS_SCHEMA_UID;
  if (!schemaUID) throw new Error("EAS_SCHEMA_UID not set");

  const rpc = process.env.BASE_SEPOLIA_RPC_URL ?? "https://base-sepolia-rpc.publicnode.com";
  const provider = new JsonRpcProvider(rpc);
  const net = await provider.getNetwork();
  if (net.chainId !== 84532n) throw new Error(`expected Base Sepolia (84532), got ${net.chainId}`);

  const wallet = new Wallet(pk, provider);
  const author = await wallet.getAddress();
  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  eas.connect(wallet);
  const disclaimerHash = keccak256(toBytes(DISCLAIMER));

  for (const slug of slugs) {
    const meta = getReportMeta(slug);
    const body = getReportBody(slug);
    const contentHash = keccak256(toBytes(body));
    const priceUSDC = parseUnits(PRICE_USD[slug] ?? DEFAULT_PRICE, 6);
    const publishedAt = BigInt(Math.floor(Date.parse(meta.publishedAt) / 1000));
    const articleAuthor = AUTHOR_BY_SLUG[slug] ?? author; // payTo = real author wallet

    const data = encodeAttestationData({
      contentHash, author: articleAuthor, priceUSDC, slug, title: meta.title, publishedAt, version: 1, disclaimer: DISCLAIMER,
    });
    console.log(`attesting ${slug} (price ${PRICE_USD[slug] ?? DEFAULT_PRICE}, payTo ${articleAuthor})…`);
    const tx = await eas.attest({
      schema: schemaUID,
      data: { recipient: articleAuthor, expirationTime: 0n, revocable: true, refUID: "0x" + "0".repeat(64), data },
    });
    const uid = await tx.wait();
    appendIndex({
      slug,
      attestationUID: uid,
      txHash: tx.receipt?.hash ?? uid,
      author: articleAuthor,
      priceUSDC: priceUSDC.toString(),
      publishedAt: Number(publishedAt),
      version: 1,
      disclaimerHash,
    });
    console.log(`  ✅ ${slug} -> ${uid}`);
  }
  console.log("\ndone.");
}

main().catch((e) => {
  console.error("ERROR:", e?.shortMessage ?? e?.message ?? e);
  process.exit(1);
});
