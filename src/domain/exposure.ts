import type { CameraSettings, ExposureLevel } from "./types";

export type StopsBreakdown = {
  isoStops: number;
  apertureStops: number;
  shutterStops: number;
  totalStops: number;
};

// Exposure relative to the scene's base settings, in stops (log2 of the
// light-gathering ratio each control contributes).
export function calculateStops(settings: CameraSettings, baseSettings: CameraSettings): StopsBreakdown {
  const isoStops = Math.log2(settings.iso / baseSettings.iso);
  const apertureStops = Math.log2(baseSettings.aperture ** 2 / settings.aperture ** 2);
  const shutterStops = Math.log2(settings.shutterSeconds / baseSettings.shutterSeconds);
  const totalStops = isoStops + apertureStops + shutterStops;
  return { isoStops, apertureStops, shutterStops, totalStops };
}

export function srgbToLinear(channel: number): number {
  const c = channel / 255;
  const linear = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return linear;
}

export function linearToSrgb(linear: number): number {
  const clamped = Math.min(Math.max(linear, 0), 1);
  const srgb = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(clamp01(srgb) * 255);
}

export function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

// Scales a linear-light value by the exposure change, then rolls off
// highlights (Reinhard-style) so a bright scene compresses toward white
// instead of hard-clipping the moment it crosses 1.0 — real sensors and
// film both have a highlight shoulder, not a wall.
export function applyExposureToLinear(linear: number, totalStops: number): number {
  const scaled = linear * 2 ** totalStops;
  const toneMapped = scaled / (1 + scaled);
  return clamp01(toneMapped);
}

export function classifyExposure(totalStops: number): ExposureLevel {
  if (totalStops <= -3) return "very-dark";
  if (totalStops <= -1) return "dark";
  if (totalStops < 1) return "balanced";
  if (totalStops < 3) return "bright";
  return "clipped";
}

const EXPOSURE_LABELS: Record<ExposureLevel, string> = {
  "very-dark": "strongly underexposed",
  dark: "slightly underexposed",
  balanced: "balanced",
  bright: "slightly overexposed",
  clipped: "highlights clipping",
};

export function exposureLabel(level: ExposureLevel): string {
  return EXPOSURE_LABELS[level];
}
