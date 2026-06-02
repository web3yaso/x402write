import { describe, it, expect } from "vitest";
import { explainPaymentError, paymentErrorFromHeader } from "./x402-errors";

describe("explainPaymentError", () => {
  it("explains self-send (buying your own article)", () => {
    expect(explainPaymentError("self_send_not_allowed")).toMatch(/作者|自己/);
  });
  it("explains insufficient balance with a faucet hint", () => {
    expect(explainPaymentError("invalid_exact_evm_insufficient_balance")).toMatch(/USDC|faucet/);
  });
  it("explains network mismatch", () => {
    expect(explainPaymentError("invalid_exact_evm_network_mismatch")).toMatch(/Base Sepolia|84532/);
  });
  it("preserves the raw reason for unknown codes", () => {
    expect(explainPaymentError("some_new_reason")).toContain("some_new_reason");
  });
  it("has a generic fallback for an empty reason", () => {
    expect(explainPaymentError("")).toMatch(/Base Sepolia|USDC/);
  });
});

describe("paymentErrorFromHeader", () => {
  it("decodes the x402 error reason from a base64 payment-required header (UTF-8 safe)", () => {
    const payload = {
      x402Version: 2,
      error: "self_send_not_allowed",
      resource: { description: "x402write — paid article 全文" }, // non-ASCII to exercise UTF-8
    };
    const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
    expect(paymentErrorFromHeader(b64)).toBe("self_send_not_allowed");
  });
  it("returns empty string for null or non-decodable input", () => {
    expect(paymentErrorFromHeader(null)).toBe("");
    expect(paymentErrorFromHeader("@@@not base64@@@")).toBe("");
  });
});
