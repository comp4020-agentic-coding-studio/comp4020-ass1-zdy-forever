import { describe, expect, it } from "vitest";
import type { PixelImage } from "../domain/types";
import { boxBlur, readMaskValue } from "./blur";

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

function variance(image: PixelImage): number {
  const { data } = image;
  const values: number[] = [];
  for (let i = 0; i < data.length; i += 4) values.push(data[i]);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

describe("boxBlur", () => {
  it("returns an unchanged copy at radius 0", () => {
    const image = checkerboard(8, 8);
    const blurred = boxBlur(image, 0);
    expect(Array.from(blurred.data)).toEqual(Array.from(image.data));
    expect(blurred.data).not.toBe(image.data);
  });

  it("reduces variance as radius grows", () => {
    const image = checkerboard(16, 16);
    const light = boxBlur(image, 1);
    const heavy = boxBlur(image, 6);
    expect(variance(heavy)).toBeLessThan(variance(light));
    expect(variance(light)).toBeLessThan(variance(image));
  });

  it("preserves the alpha channel", () => {
    const image = checkerboard(8, 8);
    const blurred = boxBlur(image, 2);
    for (let i = 3; i < blurred.data.length; i += 4) {
      expect(blurred.data[i]).toBe(255);
    }
  });

  it("keeps every channel within the valid [0, 255] range", () => {
    const image = checkerboard(12, 12);
    const blurred = boxBlur(image, 4);
    for (const value of blurred.data) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(255);
    }
  });
});

describe("readMaskValue", () => {
  it("reads a flat gray mask as its normalised value", () => {
    const data = new Uint8ClampedArray(4 * 4 * 4);
    data.fill(128);
    const mask: PixelImage = { width: 2, height: 2, data };
    expect(readMaskValue(mask, 0, 0)).toBeCloseTo(128 / 255, 5);
  });

  it("clamps out-of-bounds coordinates to the nearest edge pixel", () => {
    const data = new Uint8ClampedArray(2 * 2 * 4);
    data.fill(64);
    const mask: PixelImage = { width: 2, height: 2, data };
    expect(readMaskValue(mask, 99, -5)).toBeCloseTo(64 / 255, 5);
  });
});
