import { clamp01 } from "./exposure";
import type { MotionBlurLevel } from "./types";

// How many stops slower than the scene's baseline shutter speed we are.
// Positive = slower shutter = more time for a moving subject to smear.
export function shutterSlownessStops(shutterSeconds: number, baseShutterSeconds: number): number {
  return Math.log2(shutterSeconds / baseShutterSeconds);
}

// 0..1 strength of directional blur applied to the motion-masked region.
// Reaches full strength five stops slower than the scene's baseline.
export function subjectMotionBlurStrength(slownessStops: number): number {
  return clamp01(Math.max(0, slownessStops) / 5);
}

// Subtle whole-frame shake only appears once the shutter drops below the
// scene's handheld-safe threshold (expressed the same way a photographer
// states it — "1/60s and slower starts to show shake").
export function handheldShakeStrength(shutterSeconds: number, handheldThreshold: number): number {
  const thresholdSeconds = 1 / handheldThreshold;
  if (shutterSeconds <= thresholdSeconds) return 0;
  const stopsBelowThreshold = Math.log2(shutterSeconds / thresholdSeconds);
  return clamp01(stopsBelowThreshold / 3);
}

// Directional-blur kernel length in pixels, scaling with strength up to a
// capped maximum so the effect never runs away at extreme shutter speeds.
export function motionBlurKernelLength(strength: number, maxLengthPx = 32): number {
  return Math.round(clamp01(strength) * maxLengthPx);
}

export function classifyMotionBlur(strength: number): MotionBlurLevel {
  if (strength < 0.15) return "frozen";
  if (strength < 0.35) return "slight";
  if (strength < 0.6) return "visible";
  if (strength < 0.85) return "strong";
  return "extreme";
}
