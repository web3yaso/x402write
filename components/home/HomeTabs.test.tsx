import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeTabs } from "./HomeTabs";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const LEADERBOARD = [
  { rank: "01", name: "Alex Fan", desc: "LXDAO · RWA", articles: "1", earned: "$0.30" },
];
const WRITER_STATS = { totalPurchased: 5, totalEarned: "$0.30", authorCount: 1 };

describe("HomeTabs", () => {
  it("shows the Readers panel by default", () => {
    render(<HomeTabs readerArticles={[]} leaderboard={LEADERBOARD} writerStats={WRITER_STATS} />);
    expect(screen.getByText(/已经有人写过答案/)).toBeInTheDocument();
  });

  it("switches to Writers panel on pill click", async () => {
    const user = userEvent.setup();
    render(<HomeTabs readerArticles={[]} leaderboard={LEADERBOARD} writerStats={WRITER_STATS} />);
    await user.click(screen.getByRole("tab", { name: /For Writers/ }));
    expect(screen.getByText("Top Earning Authors")).toBeInTheDocument();
    expect(screen.queryByText(/已经有人写过答案/)).not.toBeInTheDocument();
  });
});
