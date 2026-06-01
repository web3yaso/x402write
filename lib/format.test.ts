import { describe, it, expect } from "vitest";
import { truncateAddress } from "./format";

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
