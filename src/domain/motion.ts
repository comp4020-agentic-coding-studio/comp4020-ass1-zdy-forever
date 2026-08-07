import { clamp01 } from "./exposure";
import type { MotionBlurLevel } from "./types";

// How many stops slower than the scene's baseline shutter speed we are.
// Positive = slower shutter = more time for a moving subject to smear.
export function shutterSlownessStops(shutterSeconds: number, baseShutterSeconds: number): number {
  return Math.log2(shutterSeconds / baseShutterSeconds);
}

// 0..1 strength of directional blur applied to the motion-masked region.
// Reaches full strength five stops slower than the scene's baseline. This is
// also the semantic strength used by the lesson's quality assessment.
export function subjectMotionBlurStrength(slownessStops: number): number {
  return clamp01(Math.max(0, slownessStops) / 5);
}

// Render strength uses a gentler ease-in than the semantic assessment: an
// ordinary action shutter gets a short, natural smear while truly slow
// shutters can still demonstrate obvious motion blur.
export function motionBlurKernelLength(strength: number, maxLengthPx = 18): number {
  return Math.round(Math.pow(clamp01(strength), 1.5) * maxLengthPx);
}

export function classifyMotionBlur(strength: number): MotionBlurLevel {
  if (strength < 0.15) return "frozen";
  if (strength < 0.35) return "slight";
  if (strength < 0.6) return "visible";
  if (strength < 0.85) return "strong";
  return "extreme";
}
