import { describe, it, expect } from "vitest";
import { routeForQuery } from "./query-route";

describe("routeForQuery", () => {
  it("routes the web3-employment question to the 违法用工 article", () => {
    expect(routeForQuery("为web3公司工作，有什么风险？")).toBe("/reports/web3-illegal-employment");
  });

  it("is tolerant of casing and phrasing variants", () => {
    expect(routeForQuery("Web3 用工合规怎么看")).toBe("/reports/web3-illegal-employment");
    expect(routeForQuery("在 WEB3 公司上班靠谱吗")).toBe("/reports/web3-illegal-employment");
  });

  it("routes OTC freeze / crypto-liability questions to the 姚前案 article", () => {
    expect(routeForQuery("我的工行卡因 OTC 出金被冻结,下一步怎么办?")).toBe(
      "/reports/yaoqian-crypto-liability",
    );
    expect(routeForQuery("银行卡冻结了怎么办")).toBe("/reports/yaoqian-crypto-liability");
    expect(routeForQuery("虚拟货币会不会有刑事责任")).toBe("/reports/yaoqian-crypto-liability");
    expect(routeForQuery("跑分被抓")).toBe("/reports/yaoqian-crypto-liability");
  });

  it("prefers the web3-employment rule when a query matches both", () => {
    // mentions both 工作(employment) and 冻结(freeze) — employment is the intent
    expect(routeForQuery("在 web3 公司工作,工资被冻结了")).toBe(
      "/reports/web3-illegal-employment",
    );
  });

  it("falls back to the full catalog for empty or unmatched queries", () => {
    expect(routeForQuery("")).toBe("/reports");
    expect(routeForQuery("   ")).toBe("/reports");
    expect(routeForQuery("今天天气怎么样")).toBe("/reports");
    expect(routeForQuery("工作")).toBe("/reports"); // needs the web3 qualifier too
  });
});
