import { beforeEach, describe, expect, it } from "vitest";
import type { PixelImage } from "../domain/types";
import { clearBlurCache, getBlurPyramid } from "./blurCache";

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

describe("getBlurPyramid", () => {
  beforeEach(() => {
    clearBlurCache();
  });

  it("returns one image per blur level", () => {
    const pyramid = getBlurPyramid("test-scene", checkerboard(8, 8));
    expect(pyramid).toHaveLength(7);
    expect(pyramid[0].width).toBe(8);
  });

  it("returns the exact same array instance on a repeat call for the same scene+resolution", () => {
    const image = checkerboard(8, 8);
    const first = getBlurPyramid("test-scene", image);
    const second = getBlurPyramid("test-scene", image);
    expect(second).toBe(first);
  });

  it("keeps separate pyramids for the same scene at different resolutions", () => {
    const fullRes = getBlurPyramid("test-scene", checkerboard(16, 16));
    const lowRes = getBlurPyramid("test-scene", checkerboard(4, 4));
    expect(fullRes).not.toBe(lowRes);
    expect(fullRes[0].width).toBe(16);
    expect(lowRes[0].width).toBe(4);
  });

  it("keeps separate pyramids for different scenes at the same resolution", () => {
    const portrait = getBlurPyramid("portrait", checkerboard(8, 8));
    const night = getBlurPyramid("night", checkerboard(8, 8));
    expect(portrait).not.toBe(night);
  });

  it("clearBlurCache forces a fresh pyramid to be built", () => {
    const image = checkerboard(8, 8);
    const first = getBlurPyramid("test-scene", image);
    clearBlurCache();
    const second = getBlurPyramid("test-scene", image);
    expect(second).not.toBe(first);
  });
});
