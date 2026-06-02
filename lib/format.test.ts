import { describe, it, expect } from "vitest";
import { truncateAddress, isExternalSourceUrl } from "./format";

describe("truncateAddress", () => {
  it("shortens a valid EVM address to 0x1234…5678 form", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234…5678"
    );
  });

  it("throws on a non-address string", () => {
    expect(() => truncateAddress("nope")).toThrow("Invalid EVM address");
  });
});

describe("isExternalSourceUrl", () => {
  it("is false for a bare-domain placeholder (no real article path)", () => {
    expect(isExternalSourceUrl("https://mp.weixin.qq.com/")).toBe(false);
    expect(isExternalSourceUrl("https://mp.weixin.qq.com")).toBe(false);
  });

  it("is true for a real article URL with a path", () => {
    expect(isExternalSourceUrl("https://mp.weixin.qq.com/s/AbC123")).toBe(true);
  });

  it("is false for empty/undefined/invalid input", () => {
    expect(isExternalSourceUrl(undefined)).toBe(false);
    expect(isExternalSourceUrl("")).toBe(false);
    expect(isExternalSourceUrl("not a url")).toBe(false);
  });
});
