// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SceneDefinition } from "../domain/types";
import { CHALLENGE_PROGRESS_STORAGE_KEY, useLevelProgress } from "./useLevelProgress";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const BASE_SETTINGS = { iso: 400, aperture: 4, shutterSeconds: 1 / 125 };

function scene(id: string): SceneDefinition {
  return { id, title: id, description: id, sourceImage: `${id}.png`, baseSettings: BASE_SETTINGS };
}

const SCENES = [scene("portrait"), scene("motion"), scene("night"), scene("landscape")];

describe("useLevelProgress", () => {
  it("always unlocks the first scene, even with no progress", () => {
    const { result } = renderHook(() => useLevelProgress(SCENES));
    expect(result.current.isUnlocked("portrait")).toBe(true);
  });

  it("keeps later scenes locked until every predecessor is cleared", () => {
    const { result } = renderHook(() => useLevelProgress(SCENES));
    expect(result.current.isUnlocked("motion")).toBe(false);
    expect(result.current.isUnlocked("night")).toBe(false);
    expect(result.current.isUnlocked("landscape")).toBe(false);
  });

  it("unlocks the next scene once its predecessor is cleared", () => {
    const { result } = renderHook(() => useLevelProgress(SCENES));
    act(() => result.current.markCleared("portrait"));
    expect(result.current.isUnlocked("motion")).toBe(true);
    expect(result.current.isUnlocked("night")).toBe(false);
  });

  it("requires clearing every scene in order to reach a later one", () => {
    const { result } = renderHook(() => useLevelProgress(SCENES));
    act(() => result.current.markCleared("portrait"));
    act(() => result.current.markCleared("motion"));
    expect(result.current.isUnlocked("night")).toBe(true);
    expect(result.current.isUnlocked("landscape")).toBe(false);
  });

  it("is idempotent: marking the same scene cleared twice changes nothing further", () => {
    const { result } = renderHook(() => useLevelProgress(SCENES));
    act(() => result.current.markCleared("portrait"));
    const clearedAfterFirst = result.current.clearedIds;
    act(() => result.current.markCleared("portrait"));
    expect(result.current.clearedIds).toEqual(clearedAfterFirst);
    expect(result.current.clearedIds.size).toBe(1);
  });

  it("never re-locks a scene once cleared, even after later scenes clear too", () => {
    const { result } = renderHook(() => useLevelProgress(SCENES));
    act(() => result.current.markCleared("portrait"));
    act(() => result.current.markCleared("motion"));
    act(() => result.current.markCleared("night"));
    expect(result.current.isUnlocked("portrait")).toBe(true);
    expect(result.current.isUnlocked("motion")).toBe(true);
    expect(result.current.isUnlocked("night")).toBe(true);
    expect(result.current.isUnlocked("landscape")).toBe(true);
  });

  it("restores cleared scenes and unlocked successors after a new visit", () => {
    const firstVisit = renderHook(() => useLevelProgress(SCENES));
    act(() => firstVisit.result.current.markCleared("portrait"));
    firstVisit.unmount();

    const returnVisit = renderHook(() => useLevelProgress(SCENES));
    expect(returnVisit.result.current.clearedIds).toContain("portrait");
    expect(returnVisit.result.current.isUnlocked("motion")).toBe(true);
    expect(window.localStorage.getItem(CHALLENGE_PROGRESS_STORAGE_KEY)).toBe('["portrait"]');
  });

  it("ignores unknown saved scene ids", () => {
    window.localStorage.setItem(CHALLENGE_PROGRESS_STORAGE_KEY, '["portrait","retired-scene"]');
    const { result } = renderHook(() => useLevelProgress(SCENES));
    expect([...result.current.clearedIds]).toEqual(["portrait"]);
  });
});
