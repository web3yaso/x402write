import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DPrompt } from "./DPrompt";

describe("DPrompt", () => {
  it("renders the label and body text", () => {
    render(<DPrompt label="Setup Prompt" body="hello world" />);
    expect(screen.getByText("Setup Prompt")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("copies the body to clipboard and shows 'copied' on click", async () => {
    const user = userEvent.setup();
    render(<DPrompt label="Setup Prompt" body="copy me" />);
    const btn = screen.getByRole("button", { name: /copy/i });

    // Override navigator.clipboard AFTER userEvent.setup() so our mock wins
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    await user.click(btn);
    expect(writeTextMock).toHaveBeenCalledWith("copy me");
    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
  });
});
