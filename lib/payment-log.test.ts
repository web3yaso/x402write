import { vi, describe, it, expect } from "vitest";

// Keep the real read fns; force writes to fail like a read-only serverless FS.
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    writeFileSync: () => {
      throw new Error("EROFS: read-only file system");
    },
  };
});

import { readPaymentLog, appendPaymentLog } from "./payment-log";

describe("readPaymentLog", () => {
  it("returns an array", () => {
    expect(Array.isArray(readPaymentLog())).toBe(true);
  });
});

describe("appendPaymentLog (best-effort)", () => {
  const entry = { slug: "x", payer: "0x0", amount: "1", txHash: "0x0", ts: 1 };

  it("does not throw and returns false when the write fails (read-only fs, e.g. Vercel)", () => {
    // A settled paid unlock must still return content even if logging can't persist.
    expect(() => appendPaymentLog(entry)).not.toThrow();
    expect(appendPaymentLog(entry)).toBe(false);
  });
});
