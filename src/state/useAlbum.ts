import { useCallback, useReducer, useRef } from "react";
import type { AlbumExperiment } from "../domain/types";

export const ALBUM_CAPACITY = 6;

export type NewAlbumExperiment = Omit<AlbumExperiment, "id" | "order" | "imageUrl" | "capturedAt">;

type AlbumState = {
  experiments: AlbumExperiment[];
};

type AlbumAction = { type: "add"; experiment: AlbumExperiment } | { type: "remove"; id: string } | { type: "clear" };

function albumReducer(state: AlbumState, action: AlbumAction): AlbumState {
  switch (action.type) {
    case "add":
      return { experiments: [...state.experiments, action.experiment] };
    case "remove":
      return { experiments: state.experiments.filter((experiment) => experiment.id !== action.id) };
    case "clear":
      return { experiments: [] };
  }
}

let nextId = 0;
function createId(): string {
  nextId += 1;
  return `experiment-${nextId}`;
}

export type UseAlbumResult = {
  experiments: AlbumExperiment[];
  isFull: boolean;
  // Returns false (and adds nothing) once the album is at capacity — the
  // caller decides how to tell the user, but this never silently evicts an
  // existing slot to make room for a new one.
  add: (experiment: NewAlbumExperiment) => boolean;
  remove: (id: string) => void;
  clear: () => void;
};

// The 6-slot experiment album. Object URLs are created/revoked here
// (alongside the reducer, not inside it — a reducer must stay pure) so
// every saved image's blob URL is released exactly once, whether it's
// removed individually or the whole album is cleared.
export function useAlbum(): UseAlbumResult {
  const [state, dispatch] = useReducer(albumReducer, { experiments: [] });
  const urlsRef = useRef(new Map<string, string>());
  // Live count, for capacity gating — tracked in a ref rather than derived
  // from `state` inside these closures, so two add() calls in the same
  // tick (before React re-renders) can't both see a stale count and both
  // succeed past capacity.
  const countRef = useRef(0);
  // Monotonic, never decremented — gives each experiment a stable insertion
  // order even after earlier ones are removed.
  const insertionCounterRef = useRef(0);

  const add = useCallback((experiment: NewAlbumExperiment): boolean => {
    if (countRef.current >= ALBUM_CAPACITY) return false;

    countRef.current += 1;
    const order = insertionCounterRef.current;
    insertionCounterRef.current += 1;

    const id = createId();
    const imageUrl = URL.createObjectURL(experiment.imageBlob);
    urlsRef.current.set(id, imageUrl);

    dispatch({
      type: "add",
      experiment: { ...experiment, id, order, imageUrl, capturedAt: Date.now() },
    });
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    const url = urlsRef.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(id);
      countRef.current = Math.max(0, countRef.current - 1);
    }
    dispatch({ type: "remove", id });
  }, []);

  const clear = useCallback(() => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current.clear();
    countRef.current = 0;
    dispatch({ type: "clear" });
  }, []);

  return {
    experiments: state.experiments,
    isFull: state.experiments.length >= ALBUM_CAPACITY,
    add,
    remove,
    clear,
  };
}
