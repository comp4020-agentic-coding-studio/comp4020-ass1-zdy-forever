// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PixelImage } from "../domain/types";
import { SimulatorApp } from "./SimulatorApp";

vi.mock("../browser/loadPixelImage", () => ({
  loadPixelImage: vi.fn(async (): Promise<PixelImage> => ({
    width: 4,
    height: 4,
    data: new Uint8ClampedArray(4 * 4 * 4).fill(128),
  })),
  pixelImageToBlob: vi.fn(async () => new Blob(["fake"], { type: "image/png" })),
}));

let objectUrlCounter = 0;

beforeEach(() => {
  objectUrlCounter = 0;
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => `blob:mock-${objectUrlCounter++}`),
      revokeObjectURL: vi.fn(),
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function waitForFrame() {
  await waitFor(() => expect(screen.queryByText("Rendering…")).not.toBeInTheDocument());
}

describe("SimulatorApp", () => {
  it("renders all four scenes and the default scene's settings", async () => {
    render(<SimulatorApp />);
    await waitForFrame();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByText("ISO 200")).toBeInTheDocument(); // portrait's base ISO
  });

  it("switching scenes resets the settings to the new scene's baseline", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    await user.click(screen.getByRole("radio", { name: /Landscape/ }));
    await waitForFrame();
    expect(screen.getByText("ISO 100")).toBeInTheDocument(); // landscape's base ISO
  });

  it("stepping a control updates the explanation panel", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();
    expect(screen.getByText(/Raising ISO to ISO 400/)).toBeInTheDocument();
  });

  it("saves the current frame to the album and shows the updated count", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    const saveButton = screen.getByRole("button", { name: /Save to album/ });
    expect(saveButton).toHaveTextContent("(0/6)");
    await user.click(saveButton);

    await waitFor(() => expect(saveButton).toHaveTextContent("(1/6)"));
    expect(screen.getByText("Saved to album.")).toBeInTheDocument();
  });

  it("blocks saving past the 6-slot capacity", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    const saveButton = screen.getByRole("button", { name: /Save to album/ });
    for (let i = 0; i < 6; i++) {
      await user.click(saveButton);
      await waitFor(() => expect(saveButton).toHaveTextContent(`(${i + 1}/6)`));
    }

    expect(saveButton).toBeDisabled();
  });

  it("resets settings back to the scene baseline via the reset button", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();
    expect(screen.getByText("ISO 400")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset to scene defaults" }));
    await waitForFrame();
    expect(screen.getByText("ISO 200")).toBeInTheDocument();
  });

  it("selecting two saved experiments shows the comparison view", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    const saveButton = screen.getByRole("button", { name: /Save to album/ });
    await user.click(saveButton);
    await waitFor(() => expect(saveButton).toHaveTextContent("(1/6)"));

    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await waitForFrame();
    await user.click(saveButton);
    await waitFor(() => expect(saveButton).toHaveTextContent("(2/6)"));

    const thumbnails = screen.getAllByRole("button", { name: /Portrait/ }).filter((button) => button.querySelector("img"));
    await user.click(thumbnails[0]);
    await user.click(thumbnails[1]);

    expect(screen.getByRole("heading", { name: "Comparing two experiments" })).toBeInTheDocument();
  });

  it("removing a saved experiment drops it from the album strip", async () => {
    const user = userEvent.setup();
    render(<SimulatorApp />);
    await waitForFrame();

    const saveButton = screen.getByRole("button", { name: /Save to album/ });
    await user.click(saveButton);
    await waitFor(() => expect(saveButton).toHaveTextContent("(1/6)"));

    await user.click(screen.getByRole("button", { name: /Remove/ }));
    expect(saveButton).toHaveTextContent("(0/6)");
    expect(screen.getByText(/Save a frame from the simulator/)).toBeInTheDocument();
  });
});
