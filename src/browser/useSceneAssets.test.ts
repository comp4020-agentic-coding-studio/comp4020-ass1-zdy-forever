// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PixelImage, SceneDefinition } from "../domain/types";
import { loadPixelImage } from "./loadPixelImage";
import { useSceneAssets } from "./useSceneAssets";

vi.mock("./loadPixelImage", () => ({
  loadPixelImage: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function fakeImage(fill: number): PixelImage {
  return { width: 2, height: 2, data: new Uint8ClampedArray(16).fill(fill) };
}

const SCENE_A: SceneDefinition = {
  id: "a",
  title: "Scene A",
  description: "d",
  sourceImage: "/a/source.png",
  depthMap: "/a/depth-map.png",
  baseSettings: { iso: 100, aperture: 4, shutterSeconds: 1 / 125 },
};

const SCENE_B: SceneDefinition = {
  id: "b",
  title: "Scene B",
  description: "d",
  sourceImage: "/b/source.png",
  baseSettings: { iso: 200, aperture: 2.8, shutterSeconds: 1 / 60 },
};

describe("useSceneAssets", () => {
  it("starts loading, then resolves the source and declared masks", async () => {
    vi.mocked(loadPixelImage).mockImplementation(async (url) => fakeImage(url.includes("depth") ? 10 : 20));

    const { result } = renderHook(() => useSceneAssets(SCENE_A));
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("ready"));
    if (result.current.status !== "ready") throw new Error("unreachable");
    expect(result.current.assets.source.data[0]).toBe(20);
    expect(result.current.assets.depthMap?.data[0]).toBe(10);
    expect(result.current.assets.subjectMask).toBeUndefined();
    expect(loadPixelImage).toHaveBeenCalledWith("/a/source.png");
    expect(loadPixelImage).toHaveBeenCalledWith("/a/depth-map.png");
  });

  it("re-loads when the scene changes", async () => {
    vi.mocked(loadPixelImage).mockResolvedValue(fakeImage(1));
    const { result, rerender } = renderHook(({ scene }) => useSceneAssets(scene), { initialProps: { scene: SCENE_A } });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => {
      rerender({ scene: SCENE_B });
    });
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(loadPixelImage).toHaveBeenCalledWith("/b/source.png");
  });

  it("surfaces an error status when loading fails", async () => {
    vi.mocked(loadPixelImage).mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useSceneAssets(SCENE_A));
    await waitFor(() => expect(result.current.status).toBe("error"));
    if (result.current.status !== "error") throw new Error("unreachable");
    expect(result.current.error.message).toBe("network down");
  });
});
