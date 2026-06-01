import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// On-disk format: base64( iv(12) ‖ ciphertext ‖ authTag(16) ). AES-256-GCM.
const IV_LEN = 12;
const TAG_LEN = 16;

function loadKey(keyB64: string): Buffer {
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) throw new Error("CONTENT_ENC_KEY must be 32 bytes (base64)");
  return key;
}

export function encryptContent(plaintext: string, keyB64: string): string {
  const key = loadKey(keyB64);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString("base64");
}

export function decryptContent(blobB64: string, keyB64: string): string {
  const key = loadKey(keyB64);
  const blob = Buffer.from(blobB64, "base64");
  const iv = blob.subarray(0, IV_LEN);
  const tag = blob.subarray(blob.length - TAG_LEN);
  const ct = blob.subarray(IV_LEN, blob.length - TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
