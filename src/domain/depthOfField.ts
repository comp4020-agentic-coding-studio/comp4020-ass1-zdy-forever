import { clamp01 } from "./exposure";
import type { DepthOfFieldLevel } from "./types";

// Discrete blur pyramid the processing pipeline precomputes and caches —
// selection below picks an index into this table rather than blurring at an
// arbitrary continuous radius, so results are cacheable per scene.
export const BLUR_LEVELS_PX = [0, 5] as const;

// How many stops wider than the scene's base aperture we are. Positive means
// a wider opening (smaller f-number) than base, i.e. shallower depth of
// field. Mirrors exposure.ts's apertureStops calculation.
export function apertureWideningStops(aperture: number, baseAperture: number): number {
  return Math.log2(baseAperture ** 2 / aperture ** 2);
}

// 0..1 overall background-blur strength, before per-pixel depth is factored
// in. Reaches full strength four stops wider than the scene's base aperture.
export function blurStrength(wideningStops: number): number {
  return clamp01(Math.max(0, wideningStops) / 4);
}

// Source photographs already contain optical depth of field. Rendering the
// full theoretical strength on top of that double-blurs the background, so
// the pixel pipeline adds only the extra blur introduced by the wider setting.
export function incrementalBlurStrength(wideningStops: number): number {
  return blurStrength(wideningStops) * 0.7;
}

// Picks an index into BLUR_LEVELS_PX for a pixel `depthDistance` (0 = at the
// focus plane, 1 = as far as the scene's depth map goes) away from focus,
// scaled by the overall `strength`.
export function selectBlurLevelIndex(depthDistance: number, strength: number): number {
  const maxIndex = BLUR_LEVELS_PX.length - 1;
  const distance = clamp01(depthDistance);
  const index = Math.round(distance * clamp01(strength) * maxIndex);
  return Math.min(Math.max(index, 0), maxIndex);
}

export function selectBlurPx(depthDistance: number, strength: number): number {
  return BLUR_LEVELS_PX[selectBlurLevelIndex(depthDistance, strength)];
}

export function classifyDepthOfField(strength: number): DepthOfFieldLevel {
  if (strength < 0.15) return "very-deep";
  if (strength < 0.35) return "deep";
  if (strength < 0.6) return "moderate";
  if (strength < 0.85) return "shallow";
  return "very-shallow";
}

// Distance (0..1) between a pixel's depth-map value and the scene's focus
// plane, in the same normalised (0 = near, 1 = far) depth-map units.
export function depthDistanceFromFocus(pixelDepth: number, focusDepth: number): number {
  return Math.abs(clamp01(pixelDepth) - clamp01(focusDepth));
}
