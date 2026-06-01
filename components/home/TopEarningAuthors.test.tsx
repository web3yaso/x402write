import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopEarningAuthors } from "./TopEarningAuthors";

describe("TopEarningAuthors", () => {
  it("renders all 10 author rows with rank, name and earnings", () => {
    render(<TopEarningAuthors />);
    expect(screen.getByText("币圈合规观察")).toBeInTheDocument();
    expect(screen.getByText("$8,420.30")).toBeInTheDocument();
    expect(screen.getByText("RWA Watch CN")).toBeInTheDocument();
    expect(screen.getAllByText(/^\$[\d,]+\.\d{2}$/)).toHaveLength(10);
  });
});
