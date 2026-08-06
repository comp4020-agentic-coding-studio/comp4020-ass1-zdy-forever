import { BLUR_LEVELS_PX } from "../domain/depthOfField";
import type { PixelImage } from "../domain/types";
import { boxBlur } from "./blur";

const cache = new Map<string, PixelImage[]>();

// Keyed by scene + resolution rather than just scene: a low-res preview
// used while dragging a slider (see useProcessedFrame.ts) and the full-res
// settled frame are genuinely different pyramids, and must not share a
// cache entry.
function cacheKey(sceneId: string, image: PixelImage): string {
  return `${sceneId}:${image.width}x${image.height}`;
}

// Building the blur pyramid (several full-frame box-blur passes) is the
// expensive part of the depth-of-field stage. It depends only on a scene's
// raw source pixels, never on camera settings, so it's computed once per
// scene+resolution and reused across every subsequent settings change.
export function getBlurPyramid(sceneId: string, image: PixelImage): PixelImage[] {
  const key = cacheKey(sceneId, image);
  const cached = cache.get(key);
  if (cached) return cached;

  const pyramid = BLUR_LEVELS_PX.map((radius) => boxBlur(image, radius));
  cache.set(key, pyramid);
  return pyramid;
}

export function clearBlurCache(): void {
  cache.clear();
}
