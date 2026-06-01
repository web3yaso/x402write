import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopEarningAuthors } from "./TopEarningAuthors";

describe("TopEarningAuthors", () => {
  it("renders the single seed-author row with rank, name and earnings", () => {
    render(<TopEarningAuthors />);
    expect(screen.getByText("Alex Fan")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getAllByText(/^\$[\d,]+\.\d{2}$/)).toHaveLength(1);
  });
});
