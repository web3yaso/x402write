import { describe, it, expect } from "vitest";
import { encodeAttestationData, decodeAttestationData, EAS_SCHEMA } from "./eas";

const fields = {
  contentHash: "0x" + "ab".repeat(32),
  author: "0x1234567890abcdef1234567890abcdef12345678",
  priceUSDC: 300000n,
  slug: "onchain-partnership-rwa",
  title: "重构链上契约",
  publishedAt: 1707436800n,
  version: 1,
  disclaimer: "本文不构成法律意见。",
};

describe("eas encode/decode", () => {
  it("schema string matches PRD §7", () => {
    expect(EAS_SCHEMA).toBe(
      "bytes32 contentHash,address author,uint96 priceUSDC,string slug,string title,uint64 publishedAt,uint16 version,string disclaimer"
    );
  });

  it("round-trips encoded attestation data", () => {
    const encoded = encodeAttestationData(fields);
    expect(encoded.startsWith("0x")).toBe(true);
    const back = decodeAttestationData(encoded);
    expect(back.slug).toBe(fields.slug);
    expect(back.priceUSDC).toBe(300000n);
    expect(back.author.toLowerCase()).toBe(fields.author);
    expect(back.version).toBe(1);
  });
});
