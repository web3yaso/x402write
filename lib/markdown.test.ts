import { describe, it, expect } from "vitest";
import { normalizeMarkdown } from "./markdown";

describe("normalizeMarkdown", () => {
  it("tightens spaced inline bold so CommonMark renders it", () => {
    expect(normalizeMarkdown("本文基于 ** LXDAO ** 的实践")).toBe("本文基于 **LXDAO** 的实践");
  });

  it("tightens bold that crosses a hard line wrap", () => {
    expect(normalizeMarkdown('的"  **\n链上合伙制  ** ”范式')).toBe('的"  **链上合伙制** ”范式');
  });

  it("promotes a standalone bold line to a heading", () => {
    expect(normalizeMarkdown("** 治理的黄昏 **")).toBe("## 治理的黄昏");
    expect(normalizeMarkdown("**01**")).toBe("## 01");
  });

  it("leaves already-tight bold untouched", () => {
    expect(normalizeMarkdown("用 **Builder Card** 把治理权剥离")).toBe("用 **Builder Card** 把治理权剥离");
  });

  it("does not alter plain lines or real headings", () => {
    expect(normalizeMarkdown("# 标题")).toBe("# 标题");
    expect(normalizeMarkdown("普通段落,没有强调。")).toBe("普通段落,没有强调。");
  });

  it("strips broken/hotlinked images", () => {
    expect(normalizeMarkdown("![cover](https://mmbiz.qpic.cn/x.jpg)\n\n正文在此")).toBe("正文在此");
    expect(normalizeMarkdown("行内 ![](http://x/y.png) 图")).not.toContain("![");
  });

  it("strips WeChat platform boilerplate", () => {
    const dirty = "真正的正文。\n\n微信扫一扫\n关注该公众号\n\n使用小程序\n****\n× 分析\n：  ，  ，  。\n分享 留言 收藏 听过";
    const clean = normalizeMarkdown(dirty);
    expect(clean).toBe("真正的正文。");
    expect(clean).not.toMatch(/微信扫一扫|关注该公众号|分享 留言 收藏 听过/);
  });

  it("strips WeChat byline, timestamp and reader-widget cruft", () => {
    const dirty = [
      "原创  Lawson Riskman  Lawson Riskman  [ Web3风险官 ](javascript:void\\(0\\);)",
      "",
      "_2026年02月06日 13:47_ __ _ _ _ _",
      "",
      "在小说阅读器读本章",
      "",
      "去阅读",
      "",
      "在 Web3 行业，有一套被反复使用的用工操作：",
    ].join("\n");
    expect(normalizeMarkdown(dirty)).toBe("在 Web3 行业，有一套被反复使用的用工操作：");
  });

  it("drops a leading H1 that duplicates the provided title (quote/space tolerant)", () => {
    const md = '#  你以为在“降本增效”，法院认为你在违法用工\n\n正文从这里开始。';
    expect(normalizeMarkdown(md, { title: '你以为在"降本增效"，法院认为你在违法用工' })).toBe(
      "正文从这里开始。",
    );
  });

  it("keeps a leading H1 when no title is provided, or when it does not match", () => {
    expect(normalizeMarkdown("# 标题")).toBe("# 标题");
    expect(normalizeMarkdown("# 真实小节\n\n正文", { title: "完全不同的文章标题" })).toBe(
      "# 真实小节\n\n正文",
    );
  });

  it("matches the title H1 through empty-bold noise and full/half-width punctuation", () => {
    // WeChat injects empty "** **" between glyphs and the body H1 uses a full-width
    // colon while the frontmatter title uses a half-width one.
    const md = "# 重****构链上契约：从 DAO 到 RWA\n\n正文。";
    expect(normalizeMarkdown(md, { title: "重构链上契约:从 DAO 到 RWA" })).toBe("正文。");
  });

  it("strips a timestamp line that carries an IP-location footer", () => {
    expect(normalizeMarkdown("_2026年02月09日 17:36_ __ 广东  _\n\n正文。")).toBe("正文。");
  });
});
