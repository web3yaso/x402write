import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopEarningAuthors } from "./TopEarningAuthors";

const ROWS = [
  { rank: "01", name: "Alex Fan", desc: "LXDAO · RWA", articles: "1", earned: "$0.30" },
  { rank: "02", name: "Lawson Riskman", desc: "Web3风险官 · 刑事", articles: "2", earned: "$0.00" },
];

describe("TopEarningAuthors", () => {
  it("renders the passed rows with name + earned", () => {
    render(<TopEarningAuthors rows={ROWS} />);
    expect(screen.getByText("Alex Fan")).toBeInTheDocument();
    expect(screen.getByText("$0.30")).toBeInTheDocument();
    expect(screen.getByText("Lawson Riskman")).toBeInTheDocument();
    expect(screen.getAllByText(/^\$[\d,]+\.\d{2}$/)).toHaveLength(2);
  });
});
