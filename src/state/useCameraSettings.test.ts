// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CameraSettings } from "../domain/types";
import { useCameraSettings } from "./useCameraSettings";

afterEach(cleanup);

const INITIAL: CameraSettings = { iso: 400, aperture: 4, shutterSeconds: 1 / 125 };
const RESET_TARGET: CameraSettings = { iso: 200, aperture: 2.8, shutterSeconds: 1 / 250 };

function fakeKeyEvent(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent;
}

describe("useCameraSettings", () => {
  it("starts at the given initial settings", () => {
    const { result } = renderHook(() => useCameraSettings("scene-a", INITIAL, RESET_TARGET));
    expect(result.current.settings).toEqual(INITIAL);
  });

  it("steps a setting up to its next table value", () => {
    const { result } = renderHook(() => useCameraSettings("scene-a", INITIAL, RESET_TARGET));
    act(() => result.current.step("iso", 1));
    expect(result.current.settings.iso).toBe(800);
  });

  it("steps a setting down to its previous table value", () => {
    const { result } = renderHook(() => useCameraSettings("scene-a", INITIAL, RESET_TARGET));
    act(() => result.current.step("iso", -1));
    expect(result.current.settings.iso).toBe(200);
  });

  it("clamps at the top of the table instead of wrapping", () => {
    // Hoisted outside the render callback: initialSettings must have a
    // stable identity across renders (only sceneId changes trigger a
    // reset), so an inline object literal here would be harmless but the
    // convention matters once sceneId is what actually drives re-init.
    const capped: CameraSettings = { ...INITIAL, iso: 6400 };
    const { result } = renderHook(() => useCameraSettings("scene-a", capped, RESET_TARGET));
    act(() => result.current.step("iso", 1));
    expect(result.current.settings.iso).toBe(6400);
  });

  it("set() snaps an arbitrary value onto the nearest allowed one", () => {
    const { result } = renderHook(() => useCameraSettings("scene-a", INITIAL, RESET_TARGET));
    act(() => result.current.set("aperture", 3));
    expect(result.current.settings.aperture).toBe(2.8);
  });

  it("reset() restores the reset settings, not the initial settings, after changes", () => {
    const { result } = renderHook(() => useCameraSettings("scene-a", INITIAL, RESET_TARGET));
    act(() => result.current.step("iso", 1));
    act(() => result.current.step("shutterSeconds", 1));
    act(() => result.current.reset());
    expect(result.current.settings).toEqual(RESET_TARGET);
  });

  it("re-initialises to the initial settings when sceneId changes (scene switch)", () => {
    const { result, rerender } = renderHook(
      ({ sceneId, initial, resetTarget }) => useCameraSettings(sceneId, initial, resetTarget),
      { initialProps: { sceneId: "scene-a", initial: INITIAL, resetTarget: RESET_TARGET } },
    );
    act(() => result.current.step("iso", 1));
    expect(result.current.settings.iso).toBe(800);

    rerender({ sceneId: "scene-b", initial: INITIAL, resetTarget: RESET_TARGET });
    expect(result.current.settings).toEqual(INITIAL);
  });

  it("does not re-initialise when sceneId stays the same", () => {
    const { result, rerender } = renderHook(
      ({ sceneId, initial, resetTarget }) => useCameraSettings(sceneId, initial, resetTarget),
      { initialProps: { sceneId: "scene-a", initial: INITIAL, resetTarget: RESET_TARGET } },
    );
    act(() => result.current.step("iso", 1));
    expect(result.current.settings.iso).toBe(800);

    rerender({ sceneId: "scene-a", initial: INITIAL, resetTarget: RESET_TARGET });
    expect(result.current.settings.iso).toBe(800);
  });

  describe("handleKeyDown", () => {
    it("steps up on ArrowUp and ArrowRight, preventing default", () => {
      const { result } = renderHook(() => useCameraSettings("scene-a", INITIAL, RESET_TARGET));

      const event = fakeKeyEvent("ArrowUp");
      act(() => result.current.handleKeyDown("iso", event));
      expect(result.current.settings.iso).toBe(800);
      expect(event.preventDefault).toHaveBeenCalled();

      const rightEvent = fakeKeyEvent("ArrowRight");
      act(() => result.current.handleKeyDown("aperture", rightEvent));
      expect(result.current.settings.aperture).toBe(5.6);
    });

    it("steps down on ArrowDown and ArrowLeft, preventing default", () => {
      const { result } = renderHook(() => useCameraSettings("scene-a", INITIAL, RESET_TARGET));

      const event = fakeKeyEvent("ArrowDown");
      act(() => result.current.handleKeyDown("iso", event));
      expect(result.current.settings.iso).toBe(200);
      expect(event.preventDefault).toHaveBeenCalled();

      const leftEvent = fakeKeyEvent("ArrowLeft");
      act(() => result.current.handleKeyDown("aperture", leftEvent));
      expect(result.current.settings.aperture).toBe(2.8);
    });

    it("ignores unrelated keys", () => {
      const { result } = renderHook(() => useCameraSettings("scene-a", INITIAL, RESET_TARGET));
      const event = fakeKeyEvent("Tab");
      act(() => result.current.handleKeyDown("iso", event));
      expect(result.current.settings.iso).toBe(INITIAL.iso);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
