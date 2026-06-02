import { describe, it, expect } from "vitest";
import { listLeaderboard, getWriterStats } from "./leaderboard";

describe("leaderboard", () => {
  it("includes every published author (by name), even with no payments, at $0.00+", () => {
    const rows = listLeaderboard();
    const alex = rows.find((r) => r.name === "Alex Fan");
    const lawson = rows.find((r) => r.name === "Lawson Riskman");
    expect(alex).toBeTruthy();
    expect(lawson).toBeTruthy();
    expect(lawson!.articles).toBe("2"); // 姚前案 + 违法用工
    expect(rows[0].earned).toMatch(/^\$\d/);
    expect(rows[0].rank).toBe("01");
  });

  it("ranks by earned desc, capped at 10", () => {
    const rows = listLeaderboard();
    expect(rows.length).toBeLessThanOrEqual(10);
    const nums = rows.map((r) => Number(r.earned.replace(/[$,]/g, "")));
    expect(nums).toEqual([...nums].sort((a, b) => b - a));
  });

  it("reports writer stats", () => {
    const s = getWriterStats();
    expect(s.totalEarned).toMatch(/^\$/);
    expect(s.totalPurchased).toBeGreaterThanOrEqual(0);
    expect(s.authorCount).toBeGreaterThanOrEqual(1);
  });
});
