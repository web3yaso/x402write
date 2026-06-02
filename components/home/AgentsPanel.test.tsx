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

  it("defaults to Cobo and switches the setup prompt when another provider is picked", async () => {
    const user = userEvent.setup();
    render(<AgentsPanel />);
    // Cobo Agentic Wallet is the default / required provider.
    expect(screen.getByRole("button", { name: "Cobo" })).toHaveClass("active");
    expect(screen.getByText(/cobo-agentic-wallet/)).toBeInTheDocument();

    // Picking AgentCash updates both the active pill and the setup prompt.
    await user.click(screen.getByRole("button", { name: "AgentCash" }));
    expect(screen.getByRole("button", { name: "AgentCash" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: "Cobo" })).not.toHaveClass("active");
    expect(screen.getByText(/agentcash\.io\/SKILL\.md/)).toBeInTheDocument();
  });
});
