import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterStrip } from "./NewsletterStrip";

describe("NewsletterStrip", () => {
  it("dismisses on close click", async () => {
    const user = userEvent.setup();
    render(<NewsletterStrip />);
    expect(screen.getByText(/Newsletter:/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close" }));
    expect(screen.queryByText(/Newsletter:/)).not.toBeInTheDocument();
  });
});
