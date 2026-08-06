import type { PixelImage } from "../domain/types";

// Nearest-neighbour downscale, used to build a cheap low-resolution preview
// frame while the user is actively dragging a control (see
// useProcessedFrame.ts) — processing a quarter-size image is roughly 16x
// cheaper than full-res, which is what keeps a drag responsive.
export function downsample(image: PixelImage, factor: number): PixelImage {
  if (factor <= 1) {
    return { width: image.width, height: image.height, data: Uint8ClampedArray.from(image.data) };
  }

  const width = Math.max(1, Math.round(image.width / factor));
  const height = Math.max(1, Math.round(image.height / factor));
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = Math.min(image.width - 1, Math.floor((x * image.width) / width));
      const sy = Math.min(image.height - 1, Math.floor((y * image.height) / height));
      const srcOffset = (sy * image.width + sx) * 4;
      const dstOffset = (y * width + x) * 4;
      data[dstOffset] = image.data[srcOffset];
      data[dstOffset + 1] = image.data[srcOffset + 1];
      data[dstOffset + 2] = image.data[srcOffset + 2];
      data[dstOffset + 3] = image.data[srcOffset + 3];
    }
  }

  return { width, height, data };
}
