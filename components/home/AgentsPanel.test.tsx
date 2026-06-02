import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentsPanel } from "./AgentsPanel";

describe("AgentsPanel", () => {
  it("renders the preview banner, the real paid endpoint, and copy prompts", () => {
    render(<AgentsPanel />);
    expect(screen.getByText(/live preview on Base Sepolia/i)).toBeInTheDocument();
    // The real, working paid-read endpoint (not the old fictional surface).
    expect(screen.getByText("/api/v1/articles/{slug}")).toBeInTheDocument();
    // Two setup prompts + the 200-response shape, each copyable.
    expect(screen.getAllByRole("button", { name: /copy/i })).toHaveLength(3);
  });

  it("toggles the active provider pill", async () => {
    const user = userEvent.setup();
    render(<AgentsPanel />);
    const coinbase = screen.getByRole("button", { name: "Coinbase" });
    await user.click(coinbase);
    expect(coinbase).toHaveClass("active");
    expect(screen.getByRole("button", { name: "AgentCash" })).not.toHaveClass("active");
  });
});
