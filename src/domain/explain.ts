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
    return `These settings land close to a balanced exposure for this scene.`;
  }
  if (totalStops > 0) {
    return `This combination is about ${rounded} stops brighter than this scene's baseline — ${exposureLabel(exposure)}.`;
  }
  return `This combination is about ${rounded} stops darker than this scene's baseline — ${exposureLabel(exposure)}.`;
}

function isoMessage(settings: CameraSettings, effectBaseSettings: CameraSettings, noise: Assessment["noise"]): string {
  if (settings.iso === effectBaseSettings.iso) {
    return `${formatIso(settings.iso)} matches this scene's baseline, so it adds no noise on its own.`;
  }
  if (settings.iso > effectBaseSettings.iso) {
    return `Raising ISO to ${formatIso(settings.iso)} brightens the image but adds ${noise} noise, most visible in the shadows.`;
  }
  return `Lowering ISO to ${formatIso(settings.iso)} keeps noise ${noise}, but darkens the image unless another setting compensates.`;
}

function apertureMessage(
  settings: CameraSettings,
  effectBaseSettings: CameraSettings,
  depthOfField: Assessment["depthOfField"],
): string {
  if (settings.aperture === effectBaseSettings.aperture) {
    return `${formatAperture(settings.aperture)} matches this scene's baseline depth of field.`;
  }
  if (settings.aperture < effectBaseSettings.aperture) {
    return `Opening up to ${formatAperture(settings.aperture)} lets in more light and throws the background ${depthOfField} — more of the scene falls out of focus.`;
  }
  return `Closing down to ${formatAperture(settings.aperture)} keeps depth of field ${depthOfField}, but needs more light from ISO or shutter to compensate.`;
}

function shutterMessage(
  settings: CameraSettings,
  effectBaseSettings: CameraSettings,
  motionBlur: Assessment["motionBlur"],
  hasMovingSubject: boolean,
): string {
  if (settings.shutterSeconds === effectBaseSettings.shutterSeconds) {
    return `${formatShutter(settings.shutterSeconds)} matches this scene's baseline shutter speed.`;
  }
  if (settings.shutterSeconds > effectBaseSettings.shutterSeconds) {
    if (!hasMovingSubject) {
      return `Slowing the shutter to ${formatShutter(settings.shutterSeconds)} gathers more light; the simulated camera stays stable, so stationary objects remain sharp.`;
    }
    return `Slowing the shutter to ${formatShutter(settings.shutterSeconds)} lets in more light, but motion blur becomes ${motionBlur} on the moving parts of the scene.`;
  }
  if (!hasMovingSubject) {
    return `A faster shutter of ${formatShutter(settings.shutterSeconds)} lets in less light; stationary objects remain sharp.`;
  }
  return `A faster shutter of ${formatShutter(settings.shutterSeconds)} keeps motion blur ${motionBlur}, but lets in less light overall.`;
}
