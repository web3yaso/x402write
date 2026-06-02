import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleModeToggle } from "./ArticleModeToggle";

const replace = vi.fn();
let params = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/reports/yaoqian-crypto-liability",
  useSearchParams: () => params,
}));

beforeEach(() => {
  replace.mockClear();
  params = new URLSearchParams();
});

const human = <div>HUMAN VIEW</div>;
const agent = <div>AGENT VIEW</div>;

describe("ArticleModeToggle", () => {
  it("defaults to the human view when there is no ?view param", () => {
    render(<ArticleModeToggle human={human} agent={agent} />);
    expect(screen.getByText("HUMAN VIEW")).toBeInTheDocument();
  });

  it("renders the agent view when the URL is ?view=agent (shareable/bookmarkable)", () => {
    params = new URLSearchParams("view=agent");
    render(<ArticleModeToggle human={human} agent={agent} />);
    expect(screen.getByText("AGENT VIEW")).toBeInTheDocument();
  });

  it("pushes ?view=agent into the URL when Agent is clicked", async () => {
    const user = userEvent.setup();
    render(<ArticleModeToggle human={human} agent={agent} />);
    await user.click(screen.getByRole("tab", { name: /Agent/ }));
    expect(replace).toHaveBeenCalledWith("/reports/yaoqian-crypto-liability?view=agent", {
      scroll: false,
    });
    expect(screen.getByText("AGENT VIEW")).toBeInTheDocument();
  });

  it("returns to the bare path when Human is clicked", async () => {
    params = new URLSearchParams("view=agent");
    const user = userEvent.setup();
    render(<ArticleModeToggle human={human} agent={agent} />);
    await user.click(screen.getByRole("tab", { name: /Human/ }));
    expect(replace).toHaveBeenCalledWith("/reports/yaoqian-crypto-liability", { scroll: false });
  });
});
