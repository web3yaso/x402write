import { describe, it, expect } from "vitest";
import { getReportMeta, getReportBody, listReportSlugs, listPublishedReports, getPublishedReport, listReaderCatalog, listAgentCatalog, toCatalogItem, catalogMatches } from "./reports";

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

describe("reader catalog (home 收录文章)", () => {
  it("includes every published report — no hardcoded slug exclusion", () => {
    // Regression: the DAO import-example must appear here once it is published
    // (it was previously dropped by a hardcoded filter in app/page.tsx).
    const catalog = listReaderCatalog().map((r) => r.meta.slug).sort();
    const published = listPublishedReports().map((r) => r.meta.slug).sort();
    expect(catalog).toEqual(published);
  });

  it("is sorted newest-first by publishedAt", () => {
    const dates = listReaderCatalog().map((r) => r.meta.publishedAt);
    expect(dates).toEqual([...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)));
  });
});

describe("agent catalog (GET /api/v1/articles)", () => {
  it("projects a published report to metadata-only catalog items (no body)", () => {
    const items = listAgentCatalog();
    const yq = items.find((i) => i.slug === "yaoqian-crypto-liability");
    expect(yq).toBeTruthy();
    expect(yq!.title).toContain("姚前");
    expect(yq!.price).toMatch(/^\$\d/);
    expect(yq!.priceUSDC).toMatch(/^\d+$/);
    expect(yq!.attestationUID).toMatch(/^0x/);
    expect(Array.isArray(yq!.tags)).toBe(true);
    expect(yq!.read).toBe("/api/v1/articles/yaoqian-crypto-liability");
    expect(yq as Record<string, unknown>).not.toHaveProperty("content");
  });

  it("filters by a free-text query over title/summary/author/tags", () => {
    expect(listAgentCatalog({ q: "劳动" }).some((i) => i.slug === "web3-illegal-employment")).toBe(true);
    expect(listAgentCatalog({ q: "zzz-no-such-term-xyz" })).toHaveLength(0);
    // empty/whitespace query returns the full catalog
    expect(listAgentCatalog({ q: "   " }).length).toBe(listAgentCatalog().length);
  });

  it("filters by ?tag= (case-insensitive substring on tags)", () => {
    const crim = listAgentCatalog({ tag: "刑事" }).map((i) => i.slug);
    expect(crim).toContain("yaoqian-crypto-liability");
    expect(crim).not.toContain("web3-illegal-employment");
  });

  it("filters by ?author= (matches author name or org)", () => {
    const lawson = listAgentCatalog({ author: "lawson" }).map((i) => i.slug);
    expect(lawson).toContain("web3-illegal-employment");
    expect(lawson).toContain("yaoqian-crypto-liability");
  });

  it("combines filters with AND", () => {
    const r = listAgentCatalog({ author: "Lawson", tag: "刑事" }).map((i) => i.slug);
    expect(r).toContain("yaoqian-crypto-liability");
    expect(r).not.toContain("web3-illegal-employment"); // Lawson, but no 刑事 tag
  });

  it("catalogMatches is case-insensitive and covers org + tags", () => {
    const item = toCatalogItem(listReaderCatalog()[0]);
    expect(catalogMatches(item, item.author.toUpperCase())).toBe(true);
    expect(catalogMatches(item, "definitely-not-present")).toBe(false);
  });
});
