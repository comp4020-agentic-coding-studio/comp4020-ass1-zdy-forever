import { formatSettings } from "./settings";
import type { AlbumExperiment, DepthOfFieldLevel, ExposureLevel, MotionBlurLevel, NoiseLevel } from "./types";

export type ComparisonResult = {
  summary: string;
  sentences: string[];
};

const EXPOSURE_ORDER: readonly ExposureLevel[] = ["very-dark", "dark", "balanced", "bright", "clipped"];
const NOISE_ORDER: readonly NoiseLevel[] = ["minimal", "low", "moderate", "strong", "severe"];
const DOF_ORDER: readonly DepthOfFieldLevel[] = ["very-deep", "deep", "moderate", "shallow", "very-shallow"];
const MOTION_ORDER: readonly MotionBlurLevel[] = ["frozen", "slight", "visible", "strong", "extreme"];

function rank<T extends string>(order: readonly T[], level: T): number {
  return order.indexOf(level);
}

// Deterministic, concrete comparison of two saved experiments — no artistic
// scoring, just which side is brighter/noisier/shallower/blurrier, plus a
// callout when two settings combinations land at similar brightness but
// produce visibly different photos.
export function compareExperiments(a: AlbumExperiment, b: AlbumExperiment): ComparisonResult {
  const sentences: string[] = [];

  const settingsDiffer =
    a.settings.iso !== b.settings.iso ||
    a.settings.aperture !== b.settings.aperture ||
    a.settings.shutterSeconds !== b.settings.shutterSeconds;
  if (settingsDiffer) {
    sentences.push(`First experiment: ${formatSettings(a.settings)}. Second experiment: ${formatSettings(b.settings)}.`);
  }

  const exposureDelta = rank(EXPOSURE_ORDER, a.assessment.exposure) - rank(EXPOSURE_ORDER, b.assessment.exposure);
  if (exposureDelta !== 0) {
    sentences.push(`The ${exposureDelta > 0 ? "first" : "second"} experiment is brighter.`);
  } else {
    sentences.push(`Both experiments land at a similar overall exposure.`);
  }

  const noiseDelta = rank(NOISE_ORDER, a.assessment.noise) - rank(NOISE_ORDER, b.assessment.noise);
  if (noiseDelta !== 0) {
    sentences.push(`The ${noiseDelta > 0 ? "first" : "second"} experiment shows more noise.`);
  }

  const dofDelta = rank(DOF_ORDER, a.assessment.depthOfField) - rank(DOF_ORDER, b.assessment.depthOfField);
  if (dofDelta !== 0) {
    sentences.push(`The ${dofDelta > 0 ? "first" : "second"} experiment has a shallower depth of field.`);
  }

  const motionDelta = rank(MOTION_ORDER, a.assessment.motionBlur) - rank(MOTION_ORDER, b.assessment.motionBlur);
  if (motionDelta !== 0) {
    sentences.push(`The ${motionDelta > 0 ? "first" : "second"} experiment shows more motion blur.`);
  }

  const similarBrightness = Math.abs(a.totalExposureStops - b.totalExposureStops) < 0.25;
  if (similarBrightness && exposureDelta === 0 && (dofDelta !== 0 || motionDelta !== 0 || noiseDelta !== 0)) {
    sentences.push("Similar brightness, different photo — the settings trade off differently even though exposure is close.");
  }

  return { summary: sentences.join(" "), sentences };
}
