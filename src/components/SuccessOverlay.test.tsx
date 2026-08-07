// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SuccessOverlay } from "./SuccessOverlay";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("SuccessOverlay", () => {
  it("animates out and dismisses after three seconds", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<SuccessOverlay title="Scene cleared!" message="Keep exploring." onDismiss={onDismiss} />);

    expect(screen.getByRole("status")).toHaveAttribute("data-state", "visible");
    act(() => vi.advanceTimersByTime(2600));
    expect(screen.getByRole("status")).toHaveAttribute("data-state", "leaving");

    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
