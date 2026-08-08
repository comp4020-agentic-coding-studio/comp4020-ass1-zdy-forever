import { useCallback, useState } from "react";
import type { SceneDefinition } from "../domain/types";

export const CHALLENGE_PROGRESS_STORAGE_KEY = "camera-school-cleared-challenges";

export type UseLevelProgressResult = {
  clearedIds: ReadonlySet<string>;
  isUnlocked: (sceneId: string) => boolean;
  markCleared: (sceneId: string) => void;
};

function loadClearedIds(scenes: readonly SceneDefinition[]): ReadonlySet<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const stored = JSON.parse(window.localStorage.getItem(CHALLENGE_PROGRESS_STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(stored)) return new Set();
    const validIds = new Set(scenes.map((scene) => scene.id));
    return new Set(stored.filter((id): id is string => typeof id === "string" && validIds.has(id)));
  } catch {
    return new Set();
  }
}

// Sequential level unlock: the first scene is always open, and scene `i`
// unlocks once scene `i - 1` has been cleared at least once. Clearing is a
// one-way flag for the session — never re-locked — so a cleared scene stays
// revisitable exactly like every scene before it.
export function useLevelProgress(scenes: readonly SceneDefinition[]): UseLevelProgressResult {
  const [clearedIds, setClearedIds] = useState<ReadonlySet<string>>(() => loadClearedIds(scenes));

  const markCleared = useCallback((sceneId: string) => {
    setClearedIds((previous) => {
      if (previous.has(sceneId)) return previous;
      const next = new Set(previous).add(sceneId);
      try {
        window.localStorage.setItem(CHALLENGE_PROGRESS_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // In-memory progress still works when storage is unavailable.
      }
      return next;
    });
  }, []);

  const isUnlocked = useCallback(
    (sceneId: string): boolean => {
      const index = scenes.findIndex((scene) => scene.id === sceneId);
      if (index <= 0) return true;
      return clearedIds.has(scenes[index - 1].id);
    },
    [scenes, clearedIds],
  );

  return { clearedIds, isUnlocked, markCleared };
}
