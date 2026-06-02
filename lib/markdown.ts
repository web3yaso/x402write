/**
 * Normalize "dirty" markdown for DISPLAY ONLY. Never changes the canonical body
 * that is content-hashed on-chain — callers pass the body here purely for rendering.
 * WeChat/Mirror exports commonly:
 *   - pad emphasis markers with spaces ("**  text  **"), sometimes across a wrapped
 *     line, which CommonMark renders literally instead of as bold;
 *   - use a standalone bold line as a section title instead of a real "## heading";
 *   - hotlink images (`![](mmbiz…)`) that 403 / break;
 *   - append platform boilerplate (微信扫一扫 / 关注该公众号 / 此图片来自微信公众平台 /
 *     视频 赞 在看 留言 收藏 听过 …) and empty `****` / punctuation-only separators.
 */

// Lines whose trimmed form contains any of these are WeChat-export chrome → drop.
const CRUFT_CONTAINS = [
  /微信扫一扫/,
  /关注该公众号/,
  /使用小程序/,
  /使用完整服务/,
  /此图片来自微信公众平台/,
  /未经允许不可引用/,
  /预览时标签不可点/,
  /轻点两下取消赞/,
];

function isCruftLine(t: string): boolean {
  if (CRUFT_CONTAINS.some((re) => re.test(t))) return true;
  // empty-emphasis / rule artifacts: ****, __, —, ──, ×分析, the social action row
  if (/^(\*{2,}|_{2,}|—+|─+|×\s*分析|分享\s*留言\s*收藏\s*听过)$/.test(t)) return true;
  // punctuation/separator-only line (e.g. "：  ，  ，  ，  。")
  if (t.length > 0 && /^[\s：:，,。、；;！!？?·…—\-~]+$/.test(t)) return true;
  return false;
}

export function normalizeMarkdown(md: string): string {
  // 0) drop images (broken WeChat hotlinks)
  let out = md.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  // 1) tighten spaced bold globally, even across a wrapped line break
  out = out.replace(/\*\*[ \t\n]*([^*]+?)[ \t\n]*\*\*/g, "**$1**");
  // 2) per line: drop platform cruft; promote a standalone bold line to a heading
  out = out
    .split("\n")
    .filter((line) => !isCruftLine(line.trim()))
    .map((line) => {
      const t = line.trim();
      const heading = t.match(/^\*\*\s*(.+?)\s*\*\*$/);
      return heading ? `## ${heading[1]}` : line;
    })
    .join("\n");
  // 3) collapse runs of blank lines left behind by removals
  return out.replace(/\n{3,}/g, "\n\n").trim();
}
