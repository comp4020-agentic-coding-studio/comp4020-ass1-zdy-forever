import type { PixelImage } from "../domain/types";

// Separable box blur. Two passes (horizontal then vertical) at the same
// radius approximate a Gaussian closely enough for this simulator's
// pyramid-of-discrete-levels approach, and stay simple to reason about and
// unit-test.
export function boxBlur(image: PixelImage, radiusPx: number): PixelImage {
  if (radiusPx <= 0) {
    return { width: image.width, height: image.height, data: Uint8ClampedArray.from(image.data) };
  }
  const horizontal = boxBlurPass(image, radiusPx, "horizontal");
  return boxBlurPass(horizontal, radiusPx, "vertical");
}

function boxBlurPass(image: PixelImage, radius: number, axis: "horizontal" | "vertical"): PixelImage {
  const { width, height, data } = image;
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;

      for (let k = -radius; k <= radius; k++) {
        const sx = axis === "horizontal" ? x + k : x;
        const sy = axis === "vertical" ? y + k : y;
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;

        const offset = (sy * width + sx) * 4;
        r += data[offset];
        g += data[offset + 1];
        b += data[offset + 2];
        a += data[offset + 3];
        count++;
      }

      const offset = (y * width + x) * 4;
      output[offset] = r / count;
      output[offset + 1] = g / count;
      output[offset + 2] = b / count;
      output[offset + 3] = a / count;
    }
  }

  return { width, height, data: output };
}

// Reads a grayscale mask/depth-map image as a single 0..1 value per pixel
// (masks and depth maps are generated as flat grayscale, so plain channel
// averaging is exact for them and a reasonable approximation otherwise).
export function readMaskValue(mask: PixelImage, x: number, y: number): number {
  const clampedX = Math.min(Math.max(x, 0), mask.width - 1);
  const clampedY = Math.min(Math.max(y, 0), mask.height - 1);
  const offset = (clampedY * mask.width + clampedX) * 4;
  const { data } = mask;
  return (data[offset] + data[offset + 1] + data[offset + 2]) / 3 / 255;
}
