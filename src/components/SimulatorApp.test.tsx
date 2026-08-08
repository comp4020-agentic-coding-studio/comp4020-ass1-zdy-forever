// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PixelImage } from "../domain/types";
import { CHALLENGE_PROGRESS_STORAGE_KEY } from "../state/useLevelProgress";
import { SimulatorApp } from "./SimulatorApp";

vi.mock("../browser/loadPixelImage", () => ({
  loadPixelImage: vi.fn(async (): Promise<PixelImage> => ({
    width: 4,
    height: 4,
    data: new Uint8ClampedArray(4 * 4 * 4).fill(128),
  })),
}));

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  window.localStorage.clear();
});

async function waitForFrame() {
  await waitFor(() => expect(screen.queryByText("Rendering…")).not.toBeInTheDocument());
}

describe("SimulatorApp", () => {
  it("renders all four scenes and starts every scene unbalanced at the shared minimum", async () => {
    render(<SimulatorApp />);
    await waitForFrame();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByText("ISO 100")).toBeInTheDocument(); // table floor, not portrait's base ISO 200
  });

  it("switching to a newly-unlocked scene resets settings to the shared minimum, not that scene's own baseline", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    // Two ISO increases from the minimum (100 -> 200 -> 400) lands portrait's
    // exposure within the balanced band, which clears it and unlocks Motion.
    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();
    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();

    await user.click(screen.getByRole("radio", { name: /^Moving subject/ }));
    await waitForFrame();
    expect(screen.getByText("ISO 100")).toBeInTheDocument(); // shared minimum, not motion's own base ISO 400
  });

  it("stepping a control updates the explanation panel", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();
    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();
    expect(screen.getByText(/ISO 400: brighter/)).toBeInTheDocument();
  });

  it("keeps the explanation panel beneath the challenge photograph", async () => {
    render(<SimulatorApp />);
    await waitForFrame();

    const panel = screen.getByRole("heading", { name: "What's happening" }).closest(".explanation-panel");
    expect(panel?.parentElement).toHaveClass("camera-workbench__visual");
  });

  it("shows an immediate celebration over the photograph when a scene is balanced", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();
    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();

    expect(screen.getByText("Scene cleared!")).toBeInTheDocument();
  });

  it("reveals and applies a scene's standard answer", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    await user.click(screen.getByRole("button", { name: /Standard answer/ }));
    expect(screen.getByText("ISO 100, f/1.4, 1/500s")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply this answer" }));
    await waitForFrame();

    expect(screen.getAllByText("1/500s").length).toBeGreaterThan(0);
    expect(screen.getByText("Scene cleared!")).toBeInTheDocument();
  });

  it("resets settings back to the scene baseline via the reset button", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();
    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();
    expect(screen.getByText("ISO 400")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset to scene defaults" }));
    await waitForFrame();
    expect(screen.getByText("ISO 200")).toBeInTheDocument(); // portrait's actual baseline, not the shared minimum
  });

  it("celebrates and preserves completion of the final challenge", async () => {
    window.localStorage.setItem(
      CHALLENGE_PROGRESS_STORAGE_KEY,
      JSON.stringify(["portrait", "motion", "night"]),
    );
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    await user.click(screen.getByRole("radio", { name: /^Landscape/ }));
    await waitForFrame();
    await user.click(screen.getByRole("button", { name: /Standard answer/ }));
    await user.click(screen.getByRole("button", { name: "Apply this answer" }));
    await waitForFrame();

    expect(screen.getByText("All challenges complete!")).toBeInTheDocument();
    expect(screen.getByText("All challenges complete")).toBeInTheDocument();
    expect(window.localStorage.getItem(CHALLENGE_PROGRESS_STORAGE_KEY)).toContain("landscape");
  });

});
