import { applyExposureToLinear, calculateStops, clamp01, linearToSrgb, srgbToLinear } from "../domain/exposure";
import { apertureWideningStops, blurStrength, BLUR_LEVELS_PX, depthDistanceFromFocus } from "../domain/depthOfField";
import { applyNoise, hashSeed, noiseStopsAboveBase, noiseStrength } from "../domain/noise";
import { handheldShakeStrength, motionBlurKernelLength, shutterSlownessStops, subjectMotionBlurStrength } from "../domain/motion";
import type { CameraSettings } from "../domain/types";
import type { PixelImage } from "../domain/types";
import { boxBlur, readMaskValue } from "./blur";
import { getBlurPyramid } from "./blurCache";

function copyImage(image: PixelImage): PixelImage {
  return { width: image.width, height: image.height, data: Uint8ClampedArray.from(image.data) };
}

// Per-pixel sRGB -> linear -> exposure/tone-map -> sRGB, using the same stops
// math and tone curve the domain layer already exposes and tests.
export function applyExposureStage(image: PixelImage, totalStops: number): PixelImage {
  const { width, height, data } = image;
  const output = new Uint8ClampedArray(data.length);

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    for (let channel = 0; channel < 3; channel++) {
      const linear = srgbToLinear(data[offset + channel]);
      const exposed = applyExposureToLinear(linear, totalStops);
      output[offset + channel] = linearToSrgb(exposed);
    }
    output[offset + 3] = data[offset + 3];
  }

  return { width, height, data: output };
}

export type DepthOfFieldInput = {
  depthMap?: PixelImage;
  subjectMask?: PixelImage;
  focusDepth: number;
  wideningStops: number;
  // Precomputed blur-level pyramid (see blurCache.ts). Building it is the
  // expensive part of this stage; callers that already have one (keyed by
  // scene + resolution, since it only depends on the raw source image, not
  // on camera settings) should pass it in rather than let it be rebuilt
  // here on every call.
  pyramid?: PixelImage[];
};

// Blends between a precomputed blur pyramid based on each pixel's distance
// from the focus plane. Prefers a real depth map when the scene has one;
// falls back to a binary subject mask (subject stays sharp, everything else
// blurs) when that's all the scene provides.
export function applyDepthOfFieldStage(image: PixelImage, input: DepthOfFieldInput): PixelImage {
  const strength = blurStrength(input.wideningStops);
  if (strength <= 0 || (!input.depthMap && !input.subjectMask)) {
    return copyImage(image);
  }

  const pyramid = input.pyramid ?? BLUR_LEVELS_PX.map((radius) => boxBlur(image, radius));
  const maxIndex = BLUR_LEVELS_PX.length - 1;
  const { width, height, data } = image;
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const depthDistance = input.depthMap
        ? depthDistanceFromFocus(readMaskValue(input.depthMap, x, y), input.focusDepth)
        : 1 - readMaskValue(input.subjectMask as PixelImage, x, y);

      const levelPosition = clamp01(depthDistance) * strength * maxIndex;
      const lowerIndex = Math.floor(levelPosition);
      const upperIndex = Math.min(lowerIndex + 1, maxIndex);
      const t = levelPosition - lowerIndex;

      const offset = (y * width + x) * 4;
      for (let channel = 0; channel < 4; channel++) {
        const lower = pyramid[lowerIndex].data[offset + channel];
        const upper = pyramid[upperIndex].data[offset + channel];
        output[offset + channel] = lower + (upper - lower) * t;
      }
    }
  }

  return { width, height, data: output };
}

export type MotionBlurInput = {
  motionMask?: PixelImage;
  motionVector?: { x: number; y: number };
  kernelLengthPx: number;
  handheldShakeStrength: number;
};

function normalizeVector(vector: { x: number; y: number }): { x: number; y: number } {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

// Directional blur sampled along the scene's motion vector, blended in by
// the motion mask's value per pixel — a mask value of 0 leaves that pixel
// byte-for-byte unchanged, which is what keeps the static background static.
function applyDirectionalMotionBlur(
  image: PixelImage,
  mask: PixelImage,
  vector: { x: number; y: number },
  kernelLengthPx: number,
): PixelImage {
  const { width, height, data } = image;
  const output = new Uint8ClampedArray(data.length);
  const direction = normalizeVector(vector);
  const halfKernel = Math.max(1, Math.round(kernelLengthPx / 2));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const maskValue = readMaskValue(mask, x, y);

      if (maskValue <= 0) {
        output[offset] = data[offset];
        output[offset + 1] = data[offset + 1];
        output[offset + 2] = data[offset + 2];
        output[offset + 3] = data[offset + 3];
        continue;
      }

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;

      for (let k = -halfKernel; k <= halfKernel; k++) {
        const sx = Math.round(x + direction.x * k);
        const sy = Math.round(y + direction.y * k);
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;

        const sampleOffset = (sy * width + sx) * 4;
        r += data[sampleOffset];
        g += data[sampleOffset + 1];
        b += data[sampleOffset + 2];
        a += data[sampleOffset + 3];
        count++;
      }

      const blurredR = count ? r / count : data[offset];
      const blurredG = count ? g / count : data[offset + 1];
      const blurredB = count ? b / count : data[offset + 2];
      const blurredA = count ? a / count : data[offset + 3];

      output[offset] = data[offset] + (blurredR - data[offset]) * maskValue;
      output[offset + 1] = data[offset + 1] + (blurredG - data[offset + 1]) * maskValue;
      output[offset + 2] = data[offset + 2] + (blurredB - data[offset + 2]) * maskValue;
      output[offset + 3] = data[offset + 3] + (blurredA - data[offset + 3]) * maskValue;
    }
  }

  return { width, height, data: output };
}

// Directional motion-mask blur, plus a subtle whole-frame handheld-shake
// blur once the shutter drops below the scene's safe handheld speed.
export function applyMotionBlurStage(image: PixelImage, input: MotionBlurInput): PixelImage {
  let result = image;

  if (input.motionMask && input.motionVector && input.kernelLengthPx > 0) {
    result = applyDirectionalMotionBlur(result, input.motionMask, input.motionVector, input.kernelLengthPx);
  }

  const shakeRadius = Math.round(clamp01(input.handheldShakeStrength) * 4);
  if (shakeRadius > 0) {
    result = boxBlur(result, shakeRadius);
  }

  return result;
}

export type PipelineInput = {
  source: PixelImage;
  depthMap?: PixelImage;
  subjectMask?: PixelImage;
  motionMask?: PixelImage;
  motionVector?: { x: number; y: number };
  focusDepth?: number;
  handheldThreshold?: number;
  settings: CameraSettings;
  baseSettings: CameraSettings;
  effectBaseSettings?: CameraSettings;
  sceneId: string;
};

// Runs the full depth-of-field -> exposure -> noise -> motion-blur pipeline
// against one source frame. Every stage is a pure function over PixelImage,
// so this same function runs unchanged on the main thread or inside a
// worker, and is exercised directly by pipeline.test.ts with tiny synthetic
// fixtures.
//
// Depth of field runs first, against the raw source, so it can use a blur
// pyramid cached per scene+resolution (blurCache.ts) — the pyramid depends
// only on the source pixels, never on camera settings, so this lets every
// slider drag reuse it instead of re-blurring the whole frame each time.
export function runPipeline(input: PipelineInput): PixelImage {
  let image = input.source;
  const effectBaseSettings = input.effectBaseSettings ?? input.baseSettings;

  if (input.depthMap || input.subjectMask) {
    const wideningStops = apertureWideningStops(input.settings.aperture, effectBaseSettings.aperture);
    const pyramid = getBlurPyramid(input.sceneId, input.source);
    image = applyDepthOfFieldStage(input.source, {
      depthMap: input.depthMap,
      subjectMask: input.subjectMask,
      focusDepth: input.focusDepth ?? 0.5,
      wideningStops,
      pyramid,
    });
  }

  const stops = calculateStops(input.settings, input.baseSettings);
  image = applyExposureStage(image, stops.totalStops);

  const noiseAmount = noiseStrength(noiseStopsAboveBase(input.settings.iso, effectBaseSettings.iso));
  if (noiseAmount > 0) {
    const seed = hashSeed(input.sceneId, input.settings.iso);
    image = applyNoise(image, { strength: noiseAmount, seed });
  }

  const slownessStops = shutterSlownessStops(input.settings.shutterSeconds, effectBaseSettings.shutterSeconds);
  const motionStrength = subjectMotionBlurStrength(slownessStops);
  const kernelLengthPx = motionBlurKernelLength(motionStrength);
  const shakeStrength = input.handheldThreshold
    ? handheldShakeStrength(input.settings.shutterSeconds, input.handheldThreshold)
    : 0;

  image = applyMotionBlurStage(image, {
    motionMask: input.motionMask,
    motionVector: input.motionVector,
    kernelLengthPx,
    handheldShakeStrength: shakeStrength,
  });

  return image;
}
