import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { decryptContent } from "./content-crypto";

const DIR = resolve(process.cwd(), "content/companions");
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export type StarterPrompt = { title: string; prompt: string };
export type CompanionPublic = {
  disclaimer: string;
  jurisdiction: string;
  explainer: string;
  agentManual: string;
  starterPrompts: StarterPrompt[];
};

function assertSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) throw new Error(`invalid slug: ${slug}`);
}

/** Body of the H2 section whose heading CONTAINS `prefix`, up to the next H2 (or EOF). */
function section(md: string, prefix: string): string {
  const lines = md.split("\n");
  const startIdx = lines.findIndex((l) => l.startsWith("## ") && l.includes(prefix));
  if (startIdx < 0) return "";
  let end = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) { end = i; break; }
  }
  return lines.slice(startIdx + 1, end).join("\n").trim();
}

export function getCompanionPublic(slug: string): CompanionPublic {
  assertSlug(slug);
  const file = resolve(DIR, `${slug}.md`);
  if (!existsSync(file)) throw new Error(`companion not found: ${slug}`);
  const md = readFileSync(file, "utf8");

  // Extract disclaimer: content inside the ⚠️ blockquote block
  const disclaimer = (md.match(/免责声明[^\n]*\*\*\s*\n([\s\S]*?)(?=\n\s*\n|\n\*\*本文法域)/)?.[1] ?? "")
    .replace(/^>\s?/gm, "").trim();

  // Extract jurisdiction: text between 本文法域：and the closing **
  const jurisdiction = (md.match(/\*\*本文法域[：:]\s*([\s\S]*?)\*\*/)?.[1] ?? "").replace(/\n/g, " ").trim();

  const explainer = section(md, "〔Explainer〕").trim();
  const agentManual = section(md, "〔B〕").trim();

  // Parse 〔C〕 starter prompts: ### N. <title> — <subtitle>\n> <prompt>
  const cBody = section(md, "〔C〕");
  const starterPrompts: StarterPrompt[] = [];
  // Each prompt is ### N. <title> [— <rest>]\n> <prompt text>
  // The em-dash (U+2014) or plain hyphen separates title from subtitle
  const re = /###\s*\d+\.\s*([^\n]+)\n>\s*([\s\S]*?)(?=\n\n###|\n\n##|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cBody)) !== null) {
    // Keep only the part before the em-dash (—) or space-hyphen-space
    const fullTitle = m[1].trim();
    const titlePart = fullTitle.split(/\s+[—\-]\s+/)[0].trim();
    const promptText = m[2].replace(/^>\s?/gm, "").trim();
    starterPrompts.push({
      title: titlePart,
      prompt: promptText,
    });
  }

  return { disclaimer, jurisdiction, explainer, agentManual, starterPrompts };
}

/** Decrypt the paid 〔A〕 zone (server-only). Requires CONTENT_ENC_KEY. */
export function getCompanionPaidZone(slug: string): string {
  assertSlug(slug);
  const key = process.env.CONTENT_ENC_KEY;
  if (!key) throw new Error("CONTENT_ENC_KEY not set");
  const file = resolve(DIR, `${slug}.A.enc`);
  if (!existsSync(file)) throw new Error(`companion paid zone not found: ${slug}`);
  return decryptContent(readFileSync(file, "utf8"), key);
}
