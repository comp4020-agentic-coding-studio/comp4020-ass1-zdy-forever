// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Assessment, CameraSettings } from "../domain/types";
import { ALBUM_CAPACITY, type NewAlbumExperiment, useAlbum } from "./useAlbum";

const SETTINGS: CameraSettings = { iso: 400, aperture: 4, shutterSeconds: 1 / 125 };

const ASSESSMENT: Assessment = {
  exposure: "balanced",
  noise: "low",
  depthOfField: "moderate",
  motionBlur: "slight",
  messages: [],
};

function makeExperiment(overrides: Partial<NewAlbumExperiment> = {}): NewAlbumExperiment {
  return {
    sceneId: "portrait",
    sceneTitle: "Portrait",
    settings: SETTINGS,
    totalExposureStops: 0,
    imageBlob: new Blob(["fake-image-bytes"], { type: "image/png" }),
    assessment: ASSESSMENT,
    ...overrides,
  };
}

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
  vi.unstubAllGlobals();
});

describe("useAlbum", () => {
  it("starts empty and not full", () => {
    const { result } = renderHook(() => useAlbum());
    expect(result.current.experiments).toEqual([]);
    expect(result.current.isFull).toBe(false);
  });

  it("add() appends an experiment and returns true", () => {
    const { result } = renderHook(() => useAlbum());
    let added = false;
    act(() => {
      added = result.current.add(makeExperiment());
    });
    expect(added).toBe(true);
    expect(result.current.experiments).toHaveLength(1);
    expect(result.current.experiments[0].sceneId).toBe("portrait");
  });

  it("creates an object URL from the blob for imageUrl", () => {
    const { result } = renderHook(() => useAlbum());
    act(() => {
      result.current.add(makeExperiment());
    });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(result.current.experiments[0].imageUrl).toBe("blob:mock-0");
  });

  it("assigns each experiment a unique id", () => {
    const { result } = renderHook(() => useAlbum());
    act(() => {
      result.current.add(makeExperiment());
      result.current.add(makeExperiment());
    });
    const ids = result.current.experiments.map((experiment) => experiment.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("fills up to capacity and becomes full", () => {
    const { result } = renderHook(() => useAlbum());
    act(() => {
      for (let i = 0; i < ALBUM_CAPACITY; i++) {
        result.current.add(makeExperiment());
      }
    });
    expect(result.current.experiments).toHaveLength(ALBUM_CAPACITY);
    expect(result.current.isFull).toBe(true);
  });

  it("blocks a 7th add with no silent overwrite", () => {
    const { result } = renderHook(() => useAlbum());
    act(() => {
      for (let i = 0; i < ALBUM_CAPACITY; i++) {
        result.current.add(makeExperiment());
      }
    });
    const firstBatch = result.current.experiments;

    let seventhAdded = true;
    act(() => {
      seventhAdded = result.current.add(makeExperiment({ sceneId: "night" }));
    });

    expect(seventhAdded).toBe(false);
    expect(result.current.experiments).toHaveLength(ALBUM_CAPACITY);
    expect(result.current.experiments).toEqual(firstBatch);
  });

  it("remove() deletes the matching experiment and revokes its object URL", () => {
    const { result } = renderHook(() => useAlbum());
    act(() => {
      result.current.add(makeExperiment());
      result.current.add(makeExperiment());
    });
    const [first, second] = result.current.experiments;

    act(() => {
      result.current.remove(first.id);
    });

    expect(result.current.experiments).toEqual([second]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(first.imageUrl);
  });

  it("remove() frees a slot so a subsequent add() succeeds again", () => {
    const { result } = renderHook(() => useAlbum());
    act(() => {
      for (let i = 0; i < ALBUM_CAPACITY; i++) {
        result.current.add(makeExperiment());
      }
    });
    expect(result.current.isFull).toBe(true);

    act(() => {
      result.current.remove(result.current.experiments[0].id);
    });
    expect(result.current.isFull).toBe(false);

    let added = false;
    act(() => {
      added = result.current.add(makeExperiment());
    });
    expect(added).toBe(true);
    expect(result.current.experiments).toHaveLength(ALBUM_CAPACITY);
  });

  it("clear() revokes every object URL and empties the album", () => {
    const { result } = renderHook(() => useAlbum());
    act(() => {
      result.current.add(makeExperiment());
      result.current.add(makeExperiment());
    });
    const urls = result.current.experiments.map((experiment) => experiment.imageUrl);

    act(() => {
      result.current.clear();
    });

    expect(result.current.experiments).toEqual([]);
    expect(result.current.isFull).toBe(false);
    for (const url of urls) {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
    }
  });

  it("keeps increasing order numbers even after a removal", () => {
    const { result } = renderHook(() => useAlbum());
    act(() => {
      result.current.add(makeExperiment());
      result.current.add(makeExperiment());
    });
    act(() => {
      result.current.remove(result.current.experiments[0].id);
    });
    act(() => {
      result.current.add(makeExperiment());
    });

    const orders = result.current.experiments.map((experiment) => experiment.order);
    expect(orders[0]).toBeLessThan(orders[1]);
  });
});
