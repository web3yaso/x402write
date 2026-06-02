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
});
