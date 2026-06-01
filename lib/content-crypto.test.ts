import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { encryptContent, decryptContent } from "./content-crypto";

const KEY = randomBytes(32).toString("base64");

describe("content-crypto", () => {
  it("round-trips plaintext through encrypt/decrypt", () => {
    const plain = "你好,world — 链上契约\n第二行";
    const blob = encryptContent(plain, KEY);
    expect(blob).not.toContain(plain);
    expect(decryptContent(blob, KEY)).toBe(plain);
  });

  it("throws on tampered ciphertext (GCM auth)", () => {
    const blob = encryptContent("secret", KEY);
    const bytes = Buffer.from(blob, "base64");
    bytes[bytes.length - 1] ^= 0xff; // flip a tag byte
    expect(() => decryptContent(bytes.toString("base64"), KEY)).toThrow();
  });

  it("throws on wrong key", () => {
    const blob = encryptContent("secret", KEY);
    const other = randomBytes(32).toString("base64");
    expect(() => decryptContent(blob, other)).toThrow();
  });
});
