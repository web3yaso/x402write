import { describe, it, expect } from "vitest";
import { getReportMeta, getReportBody, listReportSlugs, listPublishedReports, getPublishedReport } from "./reports";

describe("reports loader", () => {
  it("reads frontmatter meta for the seed", () => {
    const m = getReportMeta("onchain-partnership-rwa");
    expect(m.title).toContain("重构链上契约");
    expect(m.slug).toBe("onchain-partnership-rwa");
    expect(m.authorName).toBe("Alex Fan");
    expect(m.tags).toHaveLength(2);
  });

  it("decrypts the body and it is non-trivial", () => {
    const body = getReportBody("onchain-partnership-rwa");
    expect(body.length).toBeGreaterThan(500);
  });

  it("rejects an invalid slug", () => {
    expect(() => getReportMeta("../etc/passwd")).toThrow(/slug/i);
    expect(() => getReportBody("bad slug")).toThrow(/slug/i);
  });

  it("lists the seed slug", () => {
    expect(listReportSlugs()).toContain("onchain-partnership-rwa");
  });
});

describe("published reports join", () => {
  it("lists a published seed report with a formatted price", () => {
    // The DAO article (onchain-partnership-rwa) is the unpublished /publish import
    // example; the always-published seed is yaoqian-crypto-liability ($0.30).
    const seed = listPublishedReports().find((r) => r.meta.slug === "yaoqian-crypto-liability");
    expect(seed).toBeTruthy();
    expect(seed!.priceUsd).toBe("$0.30");
  });
  it("returns null for an unpublished slug", () => {
    expect(getPublishedReport("does-not-exist")).toBeNull();
  });
});
