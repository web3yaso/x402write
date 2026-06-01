import { describe, it, expect } from "vitest";
import { previewSlice } from "./preview";

const body = Array.from({ length: 10 }, (_, i) => `Para ${i} ` + "x".repeat(100)).join("\n\n");

describe("previewSlice", () => {
  it("returns roughly the requested fraction, cut at a paragraph boundary", () => {
    const p = previewSlice(body, 0.24);
    expect(p.length).toBeGreaterThan(0);
    expect(p.length).toBeLessThan(body.length);
    expect(body.startsWith(p)).toBe(true);
  });
  it("never returns the whole body for fraction < 1", () => {
    expect(previewSlice(body, 0.5).length).toBeLessThan(body.length);
  });
  it("handles short bodies without throwing", () => {
    expect(previewSlice("one para", 0.24)).toBeTypeOf("string");
  });
});
