/**
 * Ingest a plaintext source into committable artifacts:
 *   content/reports/_plaintext/<slug>.md  (frontmatter + body, gitignored)
 *     -> content/reports/<slug>.mdx        (frontmatter only, no body)
 *     -> content/reports/<slug>.enc        (AES-256-GCM of the body)
 * Usage: node_modules/.bin/tsx scripts/encrypt-content.ts <slug>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { encryptContent } from "../lib/content-crypto";

// Minimal .env.local loader (no dependency).
function loadEnvLocal(): void {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* rely on process.env */ }
}
loadEnvLocal();

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) throw new Error("usage: encrypt-content <slug:[a-z0-9-]>");
const key = process.env.CONTENT_ENC_KEY;
if (!key) throw new Error("CONTENT_ENC_KEY not set (env or .env.local)");

const root = resolve(__dirname, "..");
const src = readFileSync(resolve(root, `content/reports/_plaintext/${slug}.md`), "utf8");
const { content: body, data } = matter(src);

writeFileSync(resolve(root, `content/reports/${slug}.mdx`), matter.stringify("", data));
writeFileSync(resolve(root, `content/reports/${slug}.enc`), encryptContent(body.trim(), key));
console.log(`ingested ${slug}: .mdx + .enc written`);
