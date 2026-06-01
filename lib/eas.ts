import { SchemaEncoder, EAS } from "@ethereum-attestation-service/eas-sdk";
import { JsonRpcProvider } from "ethers";

export const EAS_SCHEMA =
  "bytes32 contentHash,address author,uint96 priceUSDC,string slug,string title,uint64 publishedAt,uint16 version,string disclaimer";

export const EAS_CONTRACT_ADDRESS =
  process.env.EAS_CONTRACT_ADDRESS ?? "0x4200000000000000000000000000000000000021";
export const EAS_SCHEMA_REGISTRY =
  process.env.EAS_SCHEMA_REGISTRY ?? "0x4200000000000000000000000000000000000020";
export const BASE_SEPOLIA_CHAIN_ID = 84532;

export type AttestationFields = {
  contentHash: string;
  author: string;
  priceUSDC: bigint;
  slug: string;
  title: string;
  publishedAt: bigint;
  version: number;
  disclaimer: string;
};

export function assertBaseSepolia(): void {
  const net = process.env.X402_NETWORK;
  if (net && net !== "eip155:84532") {
    throw new Error(`expected Base Sepolia (eip155:84532), got ${net}`);
  }
}

export function encodeAttestationData(f: AttestationFields): string {
  const enc = new SchemaEncoder(EAS_SCHEMA);
  return enc.encodeData([
    { name: "contentHash", value: f.contentHash, type: "bytes32" },
    { name: "author", value: f.author, type: "address" },
    { name: "priceUSDC", value: f.priceUSDC, type: "uint96" },
    { name: "slug", value: f.slug, type: "string" },
    { name: "title", value: f.title, type: "string" },
    { name: "publishedAt", value: f.publishedAt, type: "uint64" },
    { name: "version", value: f.version, type: "uint16" },
    { name: "disclaimer", value: f.disclaimer, type: "string" },
  ]);
}

export function decodeAttestationData(data: string): AttestationFields {
  const enc = new SchemaEncoder(EAS_SCHEMA);
  const items = enc.decodeData(data);
  const m = Object.fromEntries(items.map((i) => [i.name, i.value.value]));
  return {
    contentHash: String(m.contentHash),
    author: String(m.author),
    priceUSDC: BigInt(m.priceUSDC as bigint),
    slug: String(m.slug),
    title: String(m.title),
    publishedAt: BigInt(m.publishedAt as bigint),
    version: Number(m.version),
    disclaimer: String(m.disclaimer),
  };
}

/** Read an attestation on-chain (server-only). Returns attester + decoded fields. */
export async function getOnchainAttestation(uid: string) {
  const rpc = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
  const provider = new JsonRpcProvider(rpc);
  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  eas.connect(provider);
  const att = await eas.getAttestation(uid);
  return {
    attester: att.attester,
    recipient: att.recipient,
    revoked: att.revocationTime > 0n,
    fields: decodeAttestationData(att.data),
  };
}
