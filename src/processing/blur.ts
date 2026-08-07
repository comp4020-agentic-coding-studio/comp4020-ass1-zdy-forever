import type { PixelImage } from "../domain/types";

// Separable box blur. Each pass uses a rolling window: moving one pixel
// removes the sample that left the window and adds the new sample that
// entered it. That makes the cost O(width * height), independent of the
// radius. The previous nested-kernel implementation repeated up to 53
// samples per pixel at radius 26 and made the first frame take seconds.
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

  const lineCount = axis === "horizontal" ? height : width;
  const lineLength = axis === "horizontal" ? width : height;

  for (let line = 0; line < lineCount; line++) {
    let red = 0;
    let green = 0;
    let blue = 0;
    let alpha = 0;
    let count = 0;

    const offsetAt = (position: number) =>
      axis === "horizontal" ? (line * width + position) * 4 : (position * width + line) * 4;

    // The first pixel's window is clipped at the image edge.
    for (let position = 0; position <= Math.min(radius, lineLength - 1); position++) {
      const offset = offsetAt(position);
      red += data[offset];
      green += data[offset + 1];
      blue += data[offset + 2];
      alpha += data[offset + 3];
      count++;
    }

    for (let position = 0; position < lineLength; position++) {
      const outputOffset = offsetAt(position);
      output[outputOffset] = red / count;
      output[outputOffset + 1] = green / count;
      output[outputOffset + 2] = blue / count;
      output[outputOffset + 3] = alpha / count;

      const leaving = position - radius;
      if (leaving >= 0) {
        const offset = offsetAt(leaving);
        red -= data[offset];
        green -= data[offset + 1];
        blue -= data[offset + 2];
        alpha -= data[offset + 3];
        count--;
      }

      const entering = position + radius + 1;
      if (entering < lineLength) {
        const offset = offsetAt(entering);
        red += data[offset];
        green += data[offset + 1];
        blue += data[offset + 2];
        alpha += data[offset + 3];
        count++;
      }
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
