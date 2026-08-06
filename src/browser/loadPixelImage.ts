import type { PixelImage } from "../domain/types";

// Decodes an image URL into the plain pixel buffer the processing pipeline
// operates on. This is the one browser-only seam between the pure pipeline
// and real image assets — component tests mock this module instead of
// relying on jsdom to decode real PNGs.
export function loadPixelImage(url: string): Promise<PixelImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("2D canvas context unavailable"));
        return;
      }
      context.drawImage(image, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      resolve({ width, height, data });
    };
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

// Encodes a processed pixel buffer back into a PNG blob for saving to the
// album — the inverse of loadPixelImage, going through the same canvas seam.
export function pixelImageToBlob(image: PixelImage): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("2D canvas context unavailable"));
  const imageData = new ImageData(new Uint8ClampedArray(image.data), image.width, image.height);
  context.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to encode image blob"));
    }, "image/png");
  });
}
