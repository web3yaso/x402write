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
  /小说阅读器/,         // "在小说阅读器读本章" reader-widget promo
  /javascript:void/,    // WeChat dead links (the 原创 byline / nav rows carry these)
];

function isCruftLine(t: string): boolean {
  if (CRUFT_CONTAINS.some((re) => re.test(t))) return true;
  // empty-emphasis / rule artifacts: ****, __, —, ──, ×分析, the social action row
  if (/^(\*{2,}|_{2,}|—+|─+|×\s*分析|分享\s*留言\s*收藏\s*听过)$/.test(t)) return true;
  // WeChat "原创" byline row + standalone reader CTA ("去阅读")
  if (/^原创(\s|$)/.test(t) || /^去阅读$/.test(t)) return true;
  // standalone publish timestamp line — date, optional time, optional IP-location
  // footer — with underscore artifacts anywhere, e.g.
  //   "_2026年02月06日 13:47_ __ _ _"  or  "_2026年02月09日 17:36_ __ 广东 _".
  const bare = t.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (/^\d{4}年\d{1,2}月\d{1,2}日(\s+\d{1,2}:\d{2})?(\s+[一-鿿]{2,6})?$/.test(bare)) return true;
  // punctuation/separator-only line (e.g. "：  ，  ，  ，  。")
  if (t.length > 0 && /^[\s：:，,。、；;！!？?·…—\-~]+$/.test(t)) return true;
  return false;
}

// Reduce a string to its letters/digits only (drop whitespace, markdown emphasis
// markers, and full/half-width punctuation) so a body H1 can be compared to the
// page title across WeChat's empty-bold noise and quote/colon width variants.
function squash(s: string): string {
  return s.replace(/[^\p{L}\p{N}]/gu, "");
}

export function normalizeMarkdown(md: string, opts: { title?: string } = {}): string {
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
  out = out.replace(/\n{3,}/g, "\n\n").trim();
  // 4) drop a leading H1 that merely repeats the page title (WeChat exports lead
  //    with the title as an H1, which the page already renders separately).
  if (opts.title) {
    const lines = out.split("\n");
    const h = lines[0]?.match(/^#{1,3}\s+(.+?)\s*$/);
    if (h && squash(h[1]) === squash(opts.title)) {
      out = lines.slice(1).join("\n").replace(/^\n+/, "").trimStart();
    }
  }
  return out;
}
