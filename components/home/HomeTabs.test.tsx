import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeTabs } from "./HomeTabs";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("HomeTabs", () => {
  it("shows the Readers panel by default", () => {
    render(<HomeTabs readerArticles={[]} />);
    expect(screen.getByText(/已经有人写过答案/)).toBeInTheDocument();
  });

  it("switches to Writers panel on pill click", async () => {
    const user = userEvent.setup();
    render(<HomeTabs readerArticles={[]} />);
    await user.click(screen.getByRole("tab", { name: /For Writers/ }));
    expect(screen.getByText("Top Earning Authors")).toBeInTheDocument();
    expect(screen.queryByText(/已经有人写过答案/)).not.toBeInTheDocument();
  });
});
