/**
 * Ingest a companion source into:
 *   content/companions/<slug>.md       (PUBLIC scaffold — committed plaintext)
 *   content/companions/<slug>.A.enc    (PAID zone 〔A〕 — AES-256-GCM, committed)
 * Source: content/companions/_plaintext/<slug>.md (gitignored).
 * Usage: node_modules/.bin/tsx scripts/ingest-companion.ts <slug>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { encryptContent } from "../lib/content-crypto";

function loadEnvLocal(): void {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnvLocal();

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) throw new Error("usage: ingest-companion <slug>");
const key = process.env.CONTENT_ENC_KEY;
if (!key) throw new Error("CONTENT_ENC_KEY not set");

const root = resolve(__dirname, "..");
const src = readFileSync(resolve(root, `content/companions/_plaintext/${slug}.md`), "utf8");

const aStart = src.indexOf("## 〔A〕");
const bStart = src.indexOf("## 〔B〕");
if (aStart < 0 || bStart < 0 || bStart < aStart) throw new Error("could not locate 〔A〕/〔B〕 markers in source");
const paidA = src.slice(aStart, bStart).trim();                          // 〔A〕 only — PAID
const publicScaffold = (src.slice(0, aStart) + src.slice(bStart)).trim(); // top + Explainer + 〔B〕 + 〔C〕

writeFileSync(resolve(root, `content/companions/${slug}.md`), publicScaffold + "\n");
writeFileSync(resolve(root, `content/companions/${slug}.A.enc`), encryptContent(paidA, key));
console.log(`ingested companion ${slug}: public .md + paid .A.enc`);
