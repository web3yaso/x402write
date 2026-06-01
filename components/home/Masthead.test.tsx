import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Masthead } from "./Masthead";

vi.mock("@/components/shared/WalletConnect", () => ({
  WalletConnect: () => <button>Connect MetaMask</button>,
}));

describe("Masthead", () => {
  it("renders the x402write brand and wallet button", () => {
    render(<Masthead />);
    expect(screen.getByRole("link", { name: /x402write/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect MetaMask" })).toBeInTheDocument();
  });

  it("opens the menu on hamburger click", async () => {
    const user = userEvent.setup();
    render(<Masthead />);
    await user.click(screen.getByRole("button", { name: "菜单" }));
    expect(screen.getByText("发布报告")).toBeVisible();
  });
});
