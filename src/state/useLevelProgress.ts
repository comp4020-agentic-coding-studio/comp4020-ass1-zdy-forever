import { useCallback, useState } from "react";
import type { SceneDefinition } from "../domain/types";

export type UseLevelProgressResult = {
  clearedIds: ReadonlySet<string>;
  isUnlocked: (sceneId: string) => boolean;
  markCleared: (sceneId: string) => void;
};

// Sequential level unlock: the first scene is always open, and scene `i`
// unlocks once scene `i - 1` has been cleared at least once. Clearing is a
// one-way flag for the session — never re-locked — so a cleared scene stays
// revisitable exactly like every scene before it.
export function useLevelProgress(scenes: readonly SceneDefinition[]): UseLevelProgressResult {
  const [clearedIds, setClearedIds] = useState<ReadonlySet<string>>(new Set());

  const markCleared = useCallback((sceneId: string) => {
    setClearedIds((previous) => (previous.has(sceneId) ? previous : new Set(previous).add(sceneId)));
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
