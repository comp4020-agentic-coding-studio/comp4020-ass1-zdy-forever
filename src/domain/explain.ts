import { calculateStops, classifyExposure, exposureLabel } from "./exposure";
import { apertureWideningStops, blurStrength, classifyDepthOfField } from "./depthOfField";
import { classifyMotionBlur, shutterSlownessStops, subjectMotionBlurStrength } from "./motion";
import { classifyNoise, noiseStopsAboveBase, noiseStrength } from "./noise";
import { formatAperture, formatIso, formatShutter } from "./settings";
import type { Assessment, CameraSettings, SceneDefinition } from "./types";

export type AssessmentContext = {
  settings: CameraSettings;
  scene: SceneDefinition;
};

// The single place that turns the three raw settings into everything the UI
// shows: the four classified levels and the concrete, deterministic sentences
// explaining *why* — same inputs always produce the same assessment.
export function assessSettings({ settings, scene }: AssessmentContext): Assessment {
  const stops = calculateStops(settings, scene.baseSettings);
  const exposure = classifyExposure(stops.totalStops);
  const effectBaseSettings = scene.effectBaseSettings ?? scene.baseSettings;

  const noiseStrengthValue = noiseStrength(noiseStopsAboveBase(settings.iso, effectBaseSettings.iso));
  const noise = classifyNoise(noiseStrengthValue);

  const wideningStops = apertureWideningStops(settings.aperture, effectBaseSettings.aperture);
  const dofStrength = blurStrength(wideningStops);
  const depthOfField = classifyDepthOfField(dofStrength);

  const slownessStops = shutterSlownessStops(settings.shutterSeconds, effectBaseSettings.shutterSeconds);
  const hasMovingSubject = Boolean(scene.motionMask && scene.motionVector);
  const motionStrength = hasMovingSubject ? subjectMotionBlurStrength(slownessStops) : 0;
  const motionBlur = classifyMotionBlur(motionStrength);

  const messages = [
    exposureMessage(settings, stops.totalStops, exposure),
    isoMessage(settings, effectBaseSettings, noise),
    apertureMessage(settings, effectBaseSettings, depthOfField),
    shutterMessage(settings, effectBaseSettings, motionBlur, hasMovingSubject),
  ];

  return { exposure, noise, depthOfField, motionBlur, messages };
}

function exposureMessage(
  settings: CameraSettings,
  totalStops: number,
  exposure: Assessment["exposure"],
): string {
  const rounded = Math.abs(totalStops).toFixed(1);
  if (exposure === "balanced") {
    return "Exposure is balanced.";
  }
  if (totalStops > 0) {
    return `${rounded} stops brighter — ${exposureLabel(exposure)}.`;
  }
  return `${rounded} stops darker — ${exposureLabel(exposure)}.`;
}

function isoMessage(settings: CameraSettings, effectBaseSettings: CameraSettings, noise: Assessment["noise"]): string {
  if (settings.iso === effectBaseSettings.iso) {
    return `${formatIso(settings.iso)}: baseline noise.`;
  }
  if (settings.iso > effectBaseSettings.iso) {
    return `${formatIso(settings.iso)}: brighter, with ${noise} noise.`;
  }
  return `${formatIso(settings.iso)}: darker, with ${noise} noise.`;
}

function apertureMessage(
  settings: CameraSettings,
  effectBaseSettings: CameraSettings,
  depthOfField: Assessment["depthOfField"],
): string {
  const depthLabel = depthOfField.replaceAll("-", " ");
  if (settings.aperture === effectBaseSettings.aperture) {
    return `${formatAperture(settings.aperture)}: baseline depth of field.`;
  }
  if (settings.aperture < effectBaseSettings.aperture) {
    return `${formatAperture(settings.aperture)}: more light, ${depthLabel} depth of field.`;
  }
  return `${formatAperture(settings.aperture)}: less light, ${depthLabel} depth of field.`;
}

function shutterMessage(
  settings: CameraSettings,
  effectBaseSettings: CameraSettings,
  motionBlur: Assessment["motionBlur"],
  hasMovingSubject: boolean,
): string {
  const motionResult = motionBlur === "frozen" ? "motion frozen" : `${motionBlur} motion blur`;
  if (settings.shutterSeconds === effectBaseSettings.shutterSeconds) {
    return `${formatShutter(settings.shutterSeconds)}: baseline motion rendering.`;
  }
  if (settings.shutterSeconds > effectBaseSettings.shutterSeconds) {
    if (!hasMovingSubject) {
      return `${formatShutter(settings.shutterSeconds)}: more light; stationary scene stays sharp.`;
    }
    return `${formatShutter(settings.shutterSeconds)}: more light, ${motionResult}.`;
  }
  if (!hasMovingSubject) {
    return `${formatShutter(settings.shutterSeconds)}: less light; stationary scene stays sharp.`;
  }
  return `${formatShutter(settings.shutterSeconds)}: less light, ${motionResult}.`;
}
