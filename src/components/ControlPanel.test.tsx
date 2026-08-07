// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CameraSettings } from "../domain/types";
import { ControlPanel } from "./ControlPanel";

afterEach(cleanup);

const SETTINGS: CameraSettings = { iso: 400, aperture: 4, shutterSeconds: 1 / 125 };

describe("ControlPanel", () => {
  it("shows the formatted value for each control", () => {
    render(<ControlPanel settings={SETTINGS} onStep={vi.fn()} onSet={vi.fn()} onKeyDown={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText("ISO 400")).toBeInTheDocument();
    expect(screen.getByText("f/4")).toBeInTheDocument();
    expect(screen.getByText("1/125s")).toBeInTheDocument();
  });

  it("steps ISO up when its increase button is clicked", async () => {
    const user = userEvent.setup();
    const onStep = vi.fn();
    render(<ControlPanel settings={SETTINGS} onStep={onStep} onSet={vi.fn()} onKeyDown={vi.fn()} onReset={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    expect(onStep).toHaveBeenCalledWith("iso", 1);
  });

  it("steps aperture down when its decrease button is clicked", async () => {
    const user = userEvent.setup();
    const onStep = vi.fn();
    render(<ControlPanel settings={SETTINGS} onStep={onStep} onSet={vi.fn()} onKeyDown={vi.fn()} onReset={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Decrease Aperture" }));
    expect(onStep).toHaveBeenCalledWith("aperture", -1);
  });

  it("disables the decrease button at the bottom of a table", () => {
    render(
      <ControlPanel
        settings={{ ...SETTINGS, iso: 100 }}
        onStep={vi.fn()}
        onSet={vi.fn()}
        onKeyDown={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Decrease ISO" })).toBeDisabled();
  });

  it("disables the increase button at the top of a table", () => {
    render(
      <ControlPanel
        settings={{ ...SETTINGS, iso: 6400 }}
        onStep={vi.fn()}
        onSet={vi.fn()}
        onKeyDown={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Increase ISO" })).toBeDisabled();
  });

  it("calls onSet with the value at the slider's new index when dragged", () => {
    const onSet = vi.fn();
    render(<ControlPanel settings={SETTINGS} onStep={vi.fn()} onSet={onSet} onKeyDown={vi.fn()} onReset={vi.fn()} />);
    const isoSlider = screen.getByDisplayValue("2"); // index of 400 in ISO_VALUES
    fireEvent.change(isoSlider, { target: { value: "3" } });
    expect(onSet).toHaveBeenCalledWith("iso", 800);
  });

  it("uses the preview while dragging and requests the full frame when the drag ends", () => {
    const onInteractionStart = vi.fn();
    const onInteractionEnd = vi.fn();
    render(
      <ControlPanel
        settings={SETTINGS}
        onStep={vi.fn()}
        onSet={vi.fn()}
        onKeyDown={vi.fn()}
        onReset={vi.fn()}
        onInteractionStart={onInteractionStart}
        onInteractionEnd={onInteractionEnd}
      />,
    );
    const isoSlider = screen.getByDisplayValue("2");
    fireEvent.pointerDown(isoSlider);
    fireEvent.pointerUp(isoSlider);
    expect(onInteractionStart).toHaveBeenCalledOnce();
    expect(onInteractionEnd).toHaveBeenCalledOnce();
  });

  it("calls onKeyDown when a key is pressed on a slider", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<ControlPanel settings={SETTINGS} onStep={vi.fn()} onSet={vi.fn()} onKeyDown={onKeyDown} onReset={vi.fn()} />);
    const isoSlider = screen.getByDisplayValue("2");
    isoSlider.focus();
    await user.keyboard("{ArrowUp}");
    expect(onKeyDown).toHaveBeenCalledWith("iso", expect.anything());
  });

  it("calls onReset when the reset button is clicked", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ControlPanel settings={SETTINGS} onStep={vi.fn()} onSet={vi.fn()} onKeyDown={vi.fn()} onReset={onReset} />);
    await user.click(screen.getByRole("button", { name: "Reset to scene defaults" }));
    expect(onReset).toHaveBeenCalled();
  });
});
