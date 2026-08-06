import { useEffect, useState } from "react";
import type { PixelImage, SceneDefinition } from "../domain/types";
import { loadPixelImage } from "./loadPixelImage";

export type SceneAssets = {
  source: PixelImage;
  depthMap?: PixelImage;
  subjectMask?: PixelImage;
  motionMask?: PixelImage;
};

export type UseSceneAssetsResult =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; assets: SceneAssets };

// Loads a scene's source image plus whichever optional masks it declares.
// Keyed on scene.id (not scene identity) so a re-render with the same scene
// doesn't refetch, but switching scenes always does.
export function useSceneAssets(scene: SceneDefinition): UseSceneAssetsResult {
  const [result, setResult] = useState<UseSceneAssetsResult>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setResult({ status: "loading" });

    async function load() {
      try {
        const [source, depthMap, subjectMask, motionMask] = await Promise.all([
          loadPixelImage(scene.sourceImage),
          scene.depthMap ? loadPixelImage(scene.depthMap) : Promise.resolve(undefined),
          scene.subjectMask ? loadPixelImage(scene.subjectMask) : Promise.resolve(undefined),
          scene.motionMask ? loadPixelImage(scene.motionMask) : Promise.resolve(undefined),
        ]);
        if (cancelled) return;
        setResult({ status: "ready", assets: { source, depthMap, subjectMask, motionMask } });
      } catch (error) {
        if (cancelled) return;
        setResult({ status: "error", error: error instanceof Error ? error : new Error(String(error)) });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  return result;
}
