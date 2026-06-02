/**
 * Normalize "dirty" markdown for DISPLAY ONLY. This never changes the canonical
 * body that is content-hashed on-chain — callers pass the body to this purely for
 * rendering. WeChat/Mirror exports commonly:
 *   - pad emphasis markers with spaces ("**  text  **"), which CommonMark renders
 *     literally instead of as bold — and the span sometimes crosses a hard line wrap;
 *   - use a standalone bold line as a section title instead of a real "## heading".
 */
export function normalizeMarkdown(md: string): string {
  // 1) Tighten spaced bold globally, even across a wrapped line break.
  //    Non-greedy [^*]+? pairs the nearest ** markers; [ \t\n]* trims inner padding.
  let out = md.replace(/\*\*[ \t\n]*([^*]+?)[ \t\n]*\*\*/g, "**$1**");
  // 2) A line that is now entirely one bold span → promote to a section heading.
  out = out
    .split("\n")
    .map((line) => {
      const h = line.trim().match(/^\*\*\s*(.+?)\s*\*\*$/);
      return h ? `## ${h[1]}` : line;
    })
    .join("\n");
  return out;
}
