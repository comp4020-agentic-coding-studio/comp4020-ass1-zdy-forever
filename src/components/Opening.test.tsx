// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Opening } from "./Opening";

afterEach(cleanup);

describe("Opening", () => {
  it("introduces the exposure trade-off", () => {
    render(<Opening onStart={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Learn how a camera turns light into a photograph" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Exposure means brightness" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Three controls share the job" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "There is no free setting" })).toBeInTheDocument();
  });

  it("does not repeat the guided learning sequence in the opening", () => {
    render(<Opening onStart={vi.fn()} />);
    expect(screen.queryByText(/one dial → two dials → all three → challenges/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/challenges unlock/i)).not.toBeInTheDocument();
  });

  it("starts the hands-on lesson only after the introduction", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<Opening onStart={onStart} />);
    await user.click(screen.getByRole("button", { name: "Start with ISO →" }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
