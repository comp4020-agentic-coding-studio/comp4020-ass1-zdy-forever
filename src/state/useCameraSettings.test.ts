// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CameraSettings } from "../domain/types";
import { useCameraSettings } from "./useCameraSettings";

afterEach(cleanup);

const BASE: CameraSettings = { iso: 400, aperture: 4, shutterSeconds: 1 / 125 };

function fakeKeyEvent(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent;
}

describe("useCameraSettings", () => {
  it("starts at the given base settings", () => {
    const { result } = renderHook(() => useCameraSettings(BASE));
    expect(result.current.settings).toEqual(BASE);
  });

  it("steps a setting up to its next table value", () => {
    const { result } = renderHook(() => useCameraSettings(BASE));
    act(() => result.current.step("iso", 1));
    expect(result.current.settings.iso).toBe(800);
  });

  it("steps a setting down to its previous table value", () => {
    const { result } = renderHook(() => useCameraSettings(BASE));
    act(() => result.current.step("iso", -1));
    expect(result.current.settings.iso).toBe(200);
  });

  it("clamps at the top of the table instead of wrapping", () => {
    // Hoisted outside the render callback: baseSettings must have a stable
    // identity across renders (the hook resets on identity change), so an
    // inline object literal here would re-trigger that reset every render.
    const capped: CameraSettings = { ...BASE, iso: 6400 };
    const { result } = renderHook(() => useCameraSettings(capped));
    act(() => result.current.step("iso", 1));
    expect(result.current.settings.iso).toBe(6400);
  });

  it("set() snaps an arbitrary value onto the nearest allowed one", () => {
    const { result } = renderHook(() => useCameraSettings(BASE));
    act(() => result.current.set("aperture", 3));
    expect(result.current.settings.aperture).toBe(2.8);
  });

  it("reset() restores the base settings after changes", () => {
    const { result } = renderHook(() => useCameraSettings(BASE));
    act(() => result.current.step("iso", 1));
    act(() => result.current.step("shutterSeconds", 1));
    act(() => result.current.reset());
    expect(result.current.settings).toEqual(BASE);
  });

  it("re-initialises when a new base settings object is passed (scene switch)", () => {
    const { result, rerender } = renderHook(({ base }) => useCameraSettings(base), {
      initialProps: { base: BASE },
    });
    act(() => result.current.step("iso", 1));
    expect(result.current.settings.iso).toBe(800);

    const nextScene: CameraSettings = { iso: 1600, aperture: 2.8, shutterSeconds: 1 / 30 };
    rerender({ base: nextScene });
    expect(result.current.settings).toEqual(nextScene);
  });

  describe("handleKeyDown", () => {
    it("steps up on ArrowUp and ArrowRight, preventing default", () => {
      const { result } = renderHook(() => useCameraSettings(BASE));

      const event = fakeKeyEvent("ArrowUp");
      act(() => result.current.handleKeyDown("iso", event));
      expect(result.current.settings.iso).toBe(800);
      expect(event.preventDefault).toHaveBeenCalled();

      const rightEvent = fakeKeyEvent("ArrowRight");
      act(() => result.current.handleKeyDown("aperture", rightEvent));
      expect(result.current.settings.aperture).toBe(5.6);
    });

    it("steps down on ArrowDown and ArrowLeft, preventing default", () => {
      const { result } = renderHook(() => useCameraSettings(BASE));

      const event = fakeKeyEvent("ArrowDown");
      act(() => result.current.handleKeyDown("iso", event));
      expect(result.current.settings.iso).toBe(200);
      expect(event.preventDefault).toHaveBeenCalled();

      const leftEvent = fakeKeyEvent("ArrowLeft");
      act(() => result.current.handleKeyDown("aperture", leftEvent));
      expect(result.current.settings.aperture).toBe(2.8);
    });

    it("ignores unrelated keys", () => {
      const { result } = renderHook(() => useCameraSettings(BASE));
      const event = fakeKeyEvent("Tab");
      act(() => result.current.handleKeyDown("iso", event));
      expect(result.current.settings.iso).toBe(BASE.iso);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
