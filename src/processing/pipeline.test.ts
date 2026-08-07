import { describe, expect, it } from "vitest";
import type { CameraSettings, PixelImage } from "../domain/types";
import { applyDepthOfFieldStage, applyExposureStage, applyMotionBlurStage, runPipeline } from "./pipeline";

function solidImage(width: number, height: number, r: number, g: number, b: number): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  }
  return { width, height, data };
}

function checkerboard(width: number, height: number): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const value = (x + y) % 2 === 0 ? 255 : 0;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  return { width, height, data };
}

function verticalStripes(width: number, height: number, stripeWidth: number): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const value = Math.floor(x / stripeWidth) % 2 === 0 ? 255 : 0;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  return { width, height, data };
}

// Grayscale mask/depth-map fixture: `value(x, y)` returns 0..1, replicated
// across all three colour channels the way the real generated masks are.
function grayscaleMask(width: number, height: number, value: (x: number, y: number) => number): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const v = Math.round(255 * Math.min(Math.max(value(x, y), 0), 1));
      data[offset] = v;
      data[offset + 1] = v;
      data[offset + 2] = v;
      data[offset + 3] = 255;
    }
  }
  return { width, height, data };
}

function meanLuminance(image: PixelImage): number {
  const { data } = image;
  let total = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += (data[i] + data[i + 1] + data[i + 2]) / 3;
    count++;
  }
  return total / count;
}

function variance(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

function redChannelValues(image: PixelImage): number[] {
  const values: number[] = [];
  for (let i = 0; i < image.data.length; i += 4) values.push(image.data[i]);
  return values;
}

function countClippedPixels(image: PixelImage): number {
  let count = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    if (image.data[i] === 255 && image.data[i + 1] === 255 && image.data[i + 2] === 255) count++;
  }
  return count;
}

const BASE_SETTINGS: CameraSettings = { iso: 200, aperture: 4, shutterSeconds: 1 / 125 };

describe("applyExposureStage", () => {
  it("raises mean luminance for positive stops", () => {
    const image = solidImage(8, 8, 100, 100, 100);
    const brighter = applyExposureStage(image, 2);
    expect(meanLuminance(brighter)).toBeGreaterThan(meanLuminance(image));
  });

  it("lowers mean luminance for negative stops", () => {
    const image = solidImage(8, 8, 150, 150, 150);
    const darker = applyExposureStage(image, -2);
    expect(meanLuminance(darker)).toBeLessThan(meanLuminance(image));
  });

  it("raises the clipped-pixel count under extreme overexposure", () => {
    const image = checkerboard(16, 16);
    const baseline = applyExposureStage(image, 0);
    const blownOut = applyExposureStage(image, 15);
    expect(countClippedPixels(blownOut)).toBeGreaterThan(countClippedPixels(baseline));
  });

  it("keeps every output channel within [0, 255]", () => {
    const image = checkerboard(8, 8);
    const extreme = applyExposureStage(image, 10);
    for (const value of extreme.data) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(255);
    }
  });
});

describe("runPipeline — noise", () => {
  it("raises pixel variance as ISO climbs above the scene's base ISO", () => {
    const source = solidImage(24, 24, 120, 120, 120);
    const lowIso = runPipeline({
      source,
      settings: { ...BASE_SETTINGS, iso: 200 },
      baseSettings: BASE_SETTINGS,
      sceneId: "portrait",
    });
    const highIso = runPipeline({
      source,
      settings: { ...BASE_SETTINGS, iso: 6400 },
      baseSettings: BASE_SETTINGS,
      sceneId: "portrait",
    });

    expect(variance(redChannelValues(highIso))).toBeGreaterThan(variance(redChannelValues(lowIso)));
  });

  it("reproduces identical output for identical settings (no flicker)", () => {
    const source = solidImage(16, 16, 90, 90, 90);
    const input = {
      source,
      settings: { ...BASE_SETTINGS, iso: 3200 },
      baseSettings: BASE_SETTINGS,
      sceneId: "night",
    };

    const first = runPipeline(input);
    const second = runPipeline(input);
    expect(Array.from(second.data)).toEqual(Array.from(first.data));
  });

  it("leaves the image unchanged at base ISO (no noise applied)", () => {
    const source = solidImage(8, 8, 128, 128, 128);
    const result = runPipeline({
      source,
      settings: BASE_SETTINGS,
      baseSettings: BASE_SETTINGS,
      sceneId: "portrait",
    });
    expect(variance(redChannelValues(result))).toBe(0);
  });
});

describe("applyDepthOfFieldStage", () => {
  it("does nothing when the aperture matches the scene's base (no widening)", () => {
    const image = checkerboard(16, 16);
    const depthMap = grayscaleMask(16, 16, (x) => (x < 8 ? 0 : 1));
    const result = applyDepthOfFieldStage(image, { depthMap, focusDepth: 0, wideningStops: 0 });
    expect(Array.from(result.data)).toEqual(Array.from(image.data));
  });

  it("blurs regions farther from the focus plane more than regions at it", () => {
    const image = checkerboard(16, 16);
    const depthMap = grayscaleMask(16, 16, (x) => (x < 8 ? 0 : 1));
    const result = applyDepthOfFieldStage(image, { depthMap, focusDepth: 0, wideningStops: 4 });

    const leftHalf: number[] = [];
    const rightHalf: number[] = [];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const offset = (y * 16 + x) * 4;
        (x < 8 ? leftHalf : rightHalf).push(result.data[offset]);
      }
    }

    expect(variance(rightHalf)).toBeLessThan(variance(leftHalf));
  });

  it("blurs more strongly with a wider (more widening-stops) aperture", () => {
    const image = checkerboard(16, 16);
    const depthMap = grayscaleMask(16, 16, () => 1);
    const narrow = applyDepthOfFieldStage(image, { depthMap, focusDepth: 0, wideningStops: 1 });
    const wide = applyDepthOfFieldStage(image, { depthMap, focusDepth: 0, wideningStops: 4 });

    expect(variance(redChannelValues(wide))).toBeLessThan(variance(redChannelValues(narrow)));
  });

  it("keeps the subject sharp and blurs the background when only a subject mask exists", () => {
    const image = checkerboard(16, 16);
    const subjectMask = grayscaleMask(16, 16, (x) => (x < 8 ? 1 : 0));
    const result = applyDepthOfFieldStage(image, { subjectMask, focusDepth: 0, wideningStops: 4 });

    const subjectPixels: number[] = [];
    const backgroundPixels: number[] = [];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const offset = (y * 16 + x) * 4;
        (x < 8 ? subjectPixels : backgroundPixels).push(result.data[offset]);
      }
    }

    expect(variance(backgroundPixels)).toBeLessThan(variance(subjectPixels));
  });

  it("keeps every output channel within [0, 255]", () => {
    const image = checkerboard(12, 12);
    const depthMap = grayscaleMask(12, 12, (x, y) => (x + y) / 24);
    const result = applyDepthOfFieldStage(image, { depthMap, focusDepth: 0, wideningStops: 4 });
    for (const value of result.data) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(255);
    }
  });
});

describe("applyMotionBlurStage", () => {
  it("leaves masked-out (stationary) pixels byte-for-byte unchanged", () => {
    const image = verticalStripes(16, 8, 2);
    const motionMask = grayscaleMask(16, 8, (x) => (x < 8 ? 0 : 1));
    const result = applyMotionBlurStage(image, {
      motionMask,
      motionVector: { x: 1, y: 0 },
      kernelLengthPx: 12,
    });

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const offset = (y * 16 + x) * 4;
        expect(result.data[offset]).toBe(image.data[offset]);
        expect(result.data[offset + 1]).toBe(image.data[offset + 1]);
        expect(result.data[offset + 2]).toBe(image.data[offset + 2]);
      }
    }
  });

  it("applies a longer kernel (slower shutter) as stronger blur than a short one", () => {
    const image = verticalStripes(24, 8, 2);
    const motionMask = grayscaleMask(24, 8, () => 1);

    const fastShutter = applyMotionBlurStage(image, {
      motionMask,
      motionVector: { x: 1, y: 0 },
      kernelLengthPx: 2,
    });
    const slowShutter = applyMotionBlurStage(image, {
      motionMask,
      motionVector: { x: 1, y: 0 },
      kernelLengthPx: 20,
    });

    expect(variance(redChannelValues(slowShutter))).toBeLessThan(variance(redChannelValues(fastShutter)));
  });

  it("keeps every output channel within [0, 255]", () => {
    const image = verticalStripes(16, 16, 2);
    const motionMask = grayscaleMask(16, 16, () => 1);
    const result = applyMotionBlurStage(image, {
      motionMask,
      motionVector: { x: 1, y: 0 },
      kernelLengthPx: 30,
    });
    for (const value of result.data) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(255);
    }
  });
});

describe("runPipeline — full stack", () => {
  it("keeps every output channel within [0, 255] under extreme settings", () => {
    const source = checkerboard(20, 20);
    const depthMap = grayscaleMask(20, 20, (x, y) => (x + y) / 40);
    const result = runPipeline({
      source,
      depthMap,
      focusDepth: 0.2,
      settings: { iso: 6400, aperture: 1.4, shutterSeconds: 2 },
      baseSettings: BASE_SETTINGS,
      sceneId: "night",
    });

    for (const value of result.data) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(255);
    }
  });

  it("produces a different image for different settings", () => {
    const source = checkerboard(16, 16);
    const a = runPipeline({
      source,
      settings: BASE_SETTINGS,
      baseSettings: BASE_SETTINGS,
      sceneId: "portrait",
    });
    const b = runPipeline({
      source,
      settings: { iso: 3200, aperture: 1.8, shutterSeconds: 1 / 15 },
      baseSettings: BASE_SETTINGS,
      sceneId: "portrait",
    });

    expect(Array.from(b.data)).not.toEqual(Array.from(a.data));
  });
});
