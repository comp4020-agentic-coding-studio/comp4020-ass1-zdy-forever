import { describe, expect, it } from "vitest";
import {
  applyNoise,
  classifyNoise,
  hashSeed,
  mulberry32,
  noiseStopsAboveBase,
  noiseStrength,
} from "./noise";
import type { PixelImage } from "./types";

function solidImage(width: number, height: number, value: number): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = value;
    data[i * 4 + 1] = value;
    data[i * 4 + 2] = value;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

function variance(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("stays within [0, 1)", () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const value = rand();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("hashSeed", () => {
  it("is deterministic for the same inputs", () => {
    expect(hashSeed("portrait", 1600)).toBe(hashSeed("portrait", 1600));
  });

  it("differs for different inputs", () => {
    expect(hashSeed("portrait", 1600)).not.toBe(hashSeed("portrait", 3200));
    expect(hashSeed("portrait", 1600)).not.toBe(hashSeed("night", 1600));
  });
});

describe("noiseStopsAboveBase / noiseStrength", () => {
  it("is zero at or below base ISO", () => {
    expect(noiseStopsAboveBase(100, 100)).toBe(0);
    expect(noiseStopsAboveBase(50, 100)).toBe(0);
  });

  it("reaches full strength six stops above base", () => {
    expect(noiseStrength(noiseStopsAboveBase(6400, 100))).toBeCloseTo(1, 5);
  });

  it("increases monotonically with ISO", () => {
    const low = noiseStrength(noiseStopsAboveBase(400, 100));
    const high = noiseStrength(noiseStopsAboveBase(3200, 100));
    expect(high).toBeGreaterThan(low);
  });
});

describe("classifyNoise", () => {
  it("classifies the five bands", () => {
    expect(classifyNoise(0)).toBe("minimal");
    expect(classifyNoise(0.2)).toBe("low");
    expect(classifyNoise(0.4)).toBe("moderate");
    expect(classifyNoise(0.7)).toBe("strong");
    expect(classifyNoise(0.95)).toBe("severe");
  });
});

describe("applyNoise", () => {
  it("leaves the image untouched at zero strength", () => {
    const image = solidImage(4, 4, 128);
    const result = applyNoise(image, { strength: 0, seed: 1 });
    expect(Array.from(result.data)).toEqual(Array.from(image.data));
  });

  it("is stable for the same seed (no flicker when settings unchanged)", () => {
    const image = solidImage(8, 8, 100);
    const a = applyNoise(image, { strength: 0.5, seed: 123 });
    const b = applyNoise(image, { strength: 0.5, seed: 123 });
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it("produces different output for a different seed", () => {
    const image = solidImage(8, 8, 100);
    const a = applyNoise(image, { strength: 0.5, seed: 1 });
    const b = applyNoise(image, { strength: 0.5, seed: 2 });
    expect(Array.from(a.data)).not.toEqual(Array.from(b.data));
  });

  it("increases variance as strength increases", () => {
    const image = solidImage(16, 16, 100);
    const low = applyNoise(image, { strength: 0.2, seed: 5 });
    const high = applyNoise(image, { strength: 0.9, seed: 5 });
    const lowVariance = variance(Array.from(low.data).filter((_, i) => i % 4 === 0));
    const highVariance = variance(Array.from(high.data).filter((_, i) => i % 4 === 0));
    expect(highVariance).toBeGreaterThan(lowVariance);
  });

  it("adds more noise to shadows than to highlights at the same strength", () => {
    const shadow = solidImage(16, 16, 20);
    const highlight = solidImage(16, 16, 235);
    const shadowResult = applyNoise(shadow, { strength: 0.8, seed: 9 });
    const highlightResult = applyNoise(highlight, { strength: 0.8, seed: 9 });
    const shadowVariance = variance(Array.from(shadowResult.data).filter((_, i) => i % 4 === 0));
    const highlightVariance = variance(Array.from(highlightResult.data).filter((_, i) => i % 4 === 0));
    expect(shadowVariance).toBeGreaterThan(highlightVariance);
  });

  it("keeps every channel within the valid [0, 255] range", () => {
    const image = solidImage(16, 16, 250);
    const result = applyNoise(image, { strength: 1, seed: 3 });
    for (const value of result.data) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(255);
    }
  });

  it("preserves the alpha channel unchanged", () => {
    const image = solidImage(4, 4, 100);
    const result = applyNoise(image, { strength: 0.9, seed: 3 });
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i + 3]).toBe(255);
    }
  });

  it("processes a full 720×480 frame without blocking for a second", () => {
    const image = solidImage(720, 480, 80);
    const startedAt = performance.now();
    applyNoise(image, { strength: 0.8, seed: 42 });
    expect(performance.now() - startedAt).toBeLessThan(1000);
  });
});
