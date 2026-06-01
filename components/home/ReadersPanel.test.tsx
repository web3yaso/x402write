import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReadersPanel } from "./ReadersPanel";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("ReadersPanel", () => {
  it("renders the display headline and the collected-articles section", () => {
    render(<ReadersPanel />);
    expect(screen.getByText(/已经有人写过答案/)).toBeInTheDocument();
    expect(screen.getByText("收录文章")).toBeInTheDocument();
  });

  it("navigates to /reports when Find is clicked", async () => {
    const user = userEvent.setup();
    render(<ReadersPanel />);
    await user.click(screen.getByRole("button", { name: "Find" }));
    expect(push).toHaveBeenCalledWith("/reports");
  });
});
