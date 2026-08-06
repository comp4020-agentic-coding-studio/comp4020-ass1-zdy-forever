// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AlbumExperiment, Assessment } from "../domain/types";
import { AlbumStrip } from "./AlbumStrip";

afterEach(cleanup);

const ASSESSMENT: Assessment = {
  exposure: "balanced",
  noise: "low",
  depthOfField: "shallow",
  motionBlur: "frozen",
  messages: [],
};

function makeExperiment(id: string, order: number): AlbumExperiment {
  return {
    id,
    capturedAt: order,
    order,
    sceneId: "portrait",
    sceneTitle: "Portrait",
    settings: { iso: 200, aperture: 2.8, shutterSeconds: 1 / 125 },
    totalExposureStops: 0,
    imageBlob: new Blob(["fake"], { type: "image/png" }),
    imageUrl: `blob:mock-${id}`,
    assessment: ASSESSMENT,
  };
}

describe("AlbumStrip", () => {
  it("shows an empty-state message with no saved experiments", () => {
    render(<AlbumStrip experiments={[]} selectedIds={[]} onToggleSelect={vi.fn()} onRemove={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByText(/Save a frame from the simulator/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear album" })).toBeDisabled();
  });

  it("lists saved experiments with their settings", () => {
    render(
      <AlbumStrip
        experiments={[makeExperiment("a", 0), makeExperiment("b", 1)]}
        selectedIds={[]}
        onToggleSelect={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getAllByText("ISO 200, f/2.8, 1/125s")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Clear album" })).toBeEnabled();
  });

  it("toggles selection when a thumbnail is clicked", async () => {
    const user = userEvent.setup();
    const onToggleSelect = vi.fn();
    render(
      <AlbumStrip
        experiments={[makeExperiment("a", 0)]}
        selectedIds={[]}
        onToggleSelect={onToggleSelect}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("img", { name: /Portrait/ }));
    expect(onToggleSelect).toHaveBeenCalledWith("a");
  });

  it("marks a selected thumbnail as pressed", () => {
    render(
      <AlbumStrip
        experiments={[makeExperiment("a", 0)]}
        selectedIds={["a"]}
        onToggleSelect={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /Portrait/, pressed: true })).toBeInTheDocument();
  });

  it("removes an experiment via its remove button", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <AlbumStrip
        experiments={[makeExperiment("a", 0)]}
        selectedIds={[]}
        onToggleSelect={vi.fn()}
        onRemove={onRemove}
        onClear={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Remove/ }));
    expect(onRemove).toHaveBeenCalledWith("a");
  });

  it("clears the album via the clear button", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <AlbumStrip
        experiments={[makeExperiment("a", 0)]}
        selectedIds={[]}
        onToggleSelect={vi.fn()}
        onRemove={vi.fn()}
        onClear={onClear}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear album" }));
    expect(onClear).toHaveBeenCalled();
  });
});
