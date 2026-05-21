import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeDefined();
  });

  it("applies default variant", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.getAttribute("data-variant")).toBe("default");
  });

  it("applies destructive variant", () => {
    render(<Badge variant="destructive">Error</Badge>);
    const badge = screen.getByText("Error");
    expect(badge.getAttribute("data-variant")).toBe("destructive");
  });

  it("applies outline variant", () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badge = screen.getByText("Outline");
    expect(badge.className).toContain("border-border");
  });

  it("forwards className", () => {
    render(<Badge className="custom-class">Test</Badge>);
    const badge = screen.getByText("Test");
    expect(badge.className).toContain("custom-class");
  });

  it("renders as child with asChild", () => {
    render(
      <Badge asChild>
        <a href="/status">Status</a>
      </Badge>
    );
    expect(screen.getByRole("link", { name: "Status" })).toBeDefined();
  });
});
