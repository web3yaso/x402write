import { describe, it, expect } from "vitest";
import { validateAttestationInput } from "./attestation-index";

const base = {
  slug: "onchain-partnership-rwa",
  attestationUID: "0x" + "ab".repeat(32),
  txHash: "0x" + "cd".repeat(32),
  author: "0x1234567890abcdef1234567890abcdef12345678",
  priceUSDC: "300000",
  publishedAt: 1707436800,
  version: 1,
  disclaimerHash: "0x" + "ef".repeat(32),
};

describe("validateAttestationInput", () => {
  it("accepts a well-formed input", () => {
    expect(() => validateAttestationInput(base)).not.toThrow();
  });
  it("rejects bad slug", () => {
    expect(() => validateAttestationInput({ ...base, slug: "../x" })).toThrow(/slug/i);
  });
  it("rejects price out of range ($0.05–$50 => 50000–50000000)", () => {
    expect(() => validateAttestationInput({ ...base, priceUSDC: "40000" })).toThrow(/price/i);
    expect(() => validateAttestationInput({ ...base, priceUSDC: "60000000" })).toThrow(/price/i);
  });
  it("rejects version != 1", () => {
    expect(() => validateAttestationInput({ ...base, version: 2 })).toThrow(/version/i);
  });
  it("rejects future publishedAt", () => {
    const future = Math.floor(Date.now() / 1000) + 86400;
    expect(() => validateAttestationInput({ ...base, publishedAt: future })).toThrow(/publishedAt/i);
  });
  it("rejects non-address author", () => {
    expect(() => validateAttestationInput({ ...base, author: "nope" })).toThrow(/address/i);
  });
});
