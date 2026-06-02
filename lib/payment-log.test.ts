import { describe, it, expect } from "vitest";
import { readPaymentLog } from "./payment-log";

describe("readPaymentLog", () => {
  it("returns an array", () => {
    const result = readPaymentLog();
    expect(Array.isArray(result)).toBe(true);
  });
});
