import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReadersPanel } from "./ReadersPanel";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const ARTICLES = [
  {
    meta: {
      slug: "yaoqian-crypto-liability",
      title: "从姚前案说起",
      authorName: "Lawson Riskman",
      authorOrg: "Web3风险官",
      tags: ["Enforcement / 刑事", "中国大陆"],
      summary: "摘要文本",
      publishedAt: "2026-02-01",
    },
    record: {},
    priceUsd: "$0.30",
  },
] as never;

describe("ReadersPanel", () => {
  it("renders the headline, collected-articles section, and the passed article card", () => {
    render(<ReadersPanel articles={ARTICLES} />);
    expect(screen.getByText(/已经有人写过答案/)).toBeInTheDocument();
    expect(screen.getByText("收录文章")).toBeInTheDocument();
    expect(screen.getByText("从姚前案说起")).toBeInTheDocument();
    expect(screen.getByText("$0.30")).toBeInTheDocument();
  });

  it("routes the sample web3-employment question (empty input → placeholder) to 违法用工", async () => {
    const user = userEvent.setup();
    render(<ReadersPanel articles={ARTICLES} />);
    await user.click(screen.getByRole("button", { name: "Find" }));
    expect(push).toHaveBeenCalledWith("/reports/web3-illegal-employment");
  });

  it("falls back to the full catalog for an unmatched query", async () => {
    push.mockClear();
    const user = userEvent.setup();
    render(<ReadersPanel articles={ARTICLES} />);
    await user.type(screen.getByRole("textbox"), "今天天气怎么样");
    await user.click(screen.getByRole("button", { name: "Find" }));
    expect(push).toHaveBeenCalledWith("/reports");
  });
});
