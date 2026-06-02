import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WritersPanel } from "./WritersPanel";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const LEADERBOARD = [
  { rank: "01", name: "Alex Fan", desc: "LXDAO · RWA", articles: "1", earned: "$0.30" },
];
const WRITER_STATS = { totalPurchased: 5, totalEarned: "$0.30", authorCount: 1 };

describe("WritersPanel", () => {
  it("renders the leaderboard", () => {
    render(<WritersPanel leaderboard={LEADERBOARD} writerStats={WRITER_STATS} />);
    expect(screen.getByText("Top Earning Authors")).toBeInTheDocument();
  });

  it("navigates to /publish?source= with the typed source on Import", async () => {
    const user = userEvent.setup();
    render(<WritersPanel leaderboard={LEADERBOARD} writerStats={WRITER_STATS} />);
    await user.type(screen.getByRole("textbox"), "cryptolaw_cn");
    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(push).toHaveBeenCalledWith("/publish?source=cryptolaw_cn");
  });
});
