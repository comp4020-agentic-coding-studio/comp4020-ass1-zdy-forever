import { describe, expect, it } from "vitest";
import type { PixelImage } from "../domain/types";
import { downsample } from "./downsample";

function fromRedValues(width: number, height: number, values: number[]): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < values.length; i++) {
    data[i * 4] = values[i];
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

describe("downsample", () => {
  it("returns an unchanged copy at factor <= 1", () => {
    const image = fromRedValues(2, 2, [1, 2, 3, 4]);
    const result = downsample(image, 1);
    expect(Array.from(result.data)).toEqual(Array.from(image.data));
    expect(result.data).not.toBe(image.data);
  });

  it("halves both dimensions at factor 2", () => {
    // prettier-ignore
    const image = fromRedValues(4, 4, [
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 10, 11, 12,
      13, 14, 15, 16,
    ]);
    const result = downsample(image, 2);
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
  });

  it("samples a representative pixel from each source block", () => {
    const image = fromRedValues(4, 1, [10, 20, 30, 40]);
    const result = downsample(image, 2);
    expect(result.width).toBe(2);
    expect(Array.from(result.data.filter((_, i) => i % 4 === 0))).toEqual([10, 30]);
  });

  it("never produces a zero-sized image", () => {
    const image = fromRedValues(1, 1, [255]);
    const result = downsample(image, 8);
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });

  it("preserves the alpha channel", () => {
    const image = fromRedValues(4, 4, Array.from({ length: 16 }, () => 100));
    const result = downsample(image, 2);
    for (let i = 3; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(255);
    }
  });
});
