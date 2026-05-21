import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
	it("renders children", () => {
		render(<Button>Click me</Button>);
		expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
	});

	it("applies default variant classes", () => {
		render(<Button>Test</Button>);
		const btn = screen.getByRole("button");
		expect(btn.className).toContain("bg-stone-800");
	});

	it("applies secondary variant classes", () => {
		render(<Button variant="secondary">Secondary</Button>);
		const btn = screen.getByRole("button");
		expect(btn.className).toContain("bg-stone-100");
	});

	it("applies destructive variant classes", () => {
		render(<Button variant="destructive">Delete</Button>);
		const btn = screen.getByRole("button");
		expect(btn.className).toContain("bg-red-50");
	});

	it("is disabled when disabled prop passed", () => {
		render(<Button disabled>Disabled</Button>);
		const btn = screen.getByRole("button") as HTMLButtonElement;
		expect(btn.disabled).toBe(true);
	});

	it("calls onClick when clicked", async () => {
		const handleClick = mock(() => {});
		render(<Button onClick={handleClick}>Click</Button>);
		await userEvent.click(screen.getByRole("button"));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("does not call onClick when disabled", async () => {
		const handleClick = mock(() => {});
		render(
			<Button disabled onClick={handleClick}>
				Disabled
			</Button>,
		);
		await userEvent.click(screen.getByRole("button"));
		expect(handleClick).not.toHaveBeenCalled();
	});

	it("applies size sm classes", () => {
		render(<Button size="sm">Small</Button>);
		const btn = screen.getByRole("button");
		expect(btn.className).toContain("h-9");
	});

	it("renders as child element with asChild", () => {
		render(
			<Button asChild>
				<a href="/test">Link</a>
			</Button>,
		);
		expect(screen.getByRole("link", { name: "Link" })).toBeDefined();
	});
});
