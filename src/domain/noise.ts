import { clamp01 } from "./exposure";
import type { NoiseLevel, PixelImage } from "./types";

// Small, dependency-free deterministic PRNG. Same seed -> same sequence,
// every time, in every environment (Node test, browser, worker) — this is
// what keeps the noise from flickering when settings haven't changed.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Folds any number of strings/numbers into a single 32-bit seed (FNV-1a),
// so a seed can be derived from e.g. `sceneId + iso` without a hashing lib.
export function hashSeed(...parts: (string | number)[]): number {
  let hash = 2166136261;
  for (const part of parts) {
    const str = String(part);
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return hash >>> 0;
}

// How far above the scene's base ISO we are, in stops. Noise only grows
// above base — this deliberately never goes negative.
export function noiseStopsAboveBase(iso: number, baseIso: number): number {
  return Math.max(0, Math.log2(iso / baseIso));
}

// Reaches full strength six stops above base (e.g. ISO 100 -> ISO 6400).
export function noiseStrength(stopsAboveBase: number): number {
  return clamp01(stopsAboveBase / 6);
}

export function classifyNoise(strength: number): NoiseLevel {
  if (strength < 0.15) return "minimal";
  if (strength < 0.35) return "low";
  if (strength < 0.6) return "moderate";
  if (strength < 0.85) return "strong";
  return "severe";
}

export type NoiseOptions = {
  strength: number;
  seed: number;
};

// Applies fine, mostly luminance sensor grain. A triangular distribution
// keeps most pixels close to their original value (unlike harsh uniform TV
// static), chroma variation stays subtle, and highlights remain cleaner than
// shadows. Extreme ISO also loses a small amount of colour saturation.
export function applyNoise(image: PixelImage, options: NoiseOptions): PixelImage {
  const { width, height, data } = image;
  const output = new Uint8ClampedArray(data.length);
  const strength = clamp01(options.strength);

  if (strength <= 0) {
    output.set(data);
    return { width, height, data: output };
  }

  const sensorRandom = mulberry32(options.seed);
  const desaturation = strength > 0.85 ? (strength - 0.85) / 0.15 : 0;
  const midGrey = 128;

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const shadowWeight = 0.3 + (1 - luminance) ** 1.5 * 0.7;
    const amplitude = strength * shadowWeight * 18;

    // Two samples serve both luma and chroma. This is cheaper than generating
    // independent RGB noise and the opposing colour shifts better resemble a
    // sensor's fine chroma grain.
    const sampleA = sensorRandom();
    const sampleB = sensorRandom();
    const lumaNoise = (sampleA + sampleB - 1) * amplitude;
    const redBlueShift = (sampleA - sampleB) * amplitude * 0.18;
    const greenShift = ((sampleA * 0.37 + sampleB * 0.63) - 0.5) * amplitude * 0.08;

    const desaturatedR = r + (midGrey - r) * desaturation * 0.3;
    const desaturatedG = g + (midGrey - g) * desaturation * 0.3;
    const desaturatedB = b + (midGrey - b) * desaturation * 0.3;

    output[offset] = desaturatedR + lumaNoise + redBlueShift;
    output[offset + 1] = desaturatedG + lumaNoise + greenShift;
    output[offset + 2] = desaturatedB + lumaNoise - redBlueShift;
    output[offset + 3] = data[offset + 3];
  }

  return { width, height, data: output };
}
