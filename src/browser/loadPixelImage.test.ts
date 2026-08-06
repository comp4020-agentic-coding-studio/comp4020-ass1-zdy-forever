// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPixelImage, pixelImageToBlob } from "./loadPixelImage";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stubCanvasContext(behaviour: {
  getImageData?: (sw: number, sh: number) => ImageData;
  putImageData?: (data: ImageData, x: number, y: number) => void;
}) {
  const context = {
    drawImage: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, sw: number, sh: number) =>
      behaviour.getImageData ? behaviour.getImageData(sw, sh) : new ImageData(sw, sh),
    ),
    putImageData: vi.fn(behaviour.putImageData ?? (() => {})),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  return context;
}

// jsdom's real `Image` ignores subclassing (its constructor always produces a
// plain HTMLImageElement regardless of new.target), so it can't be extended
// to control onload/onerror timing. A fully standalone fake stands in for it
// instead — loadPixelImage only ever touches onload/onerror/src/natural*.
class FakeImage {
  onload: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  private _shouldFail = false;

  set src(_value: string) {
    queueMicrotask(() => {
      if (this._shouldFail) this.onerror?.(new Event("error"));
      else this.onload?.(new Event("load"));
    });
  }

  static failing(): typeof FakeImage {
    return class extends FakeImage {
      constructor() {
        super();
        this._shouldFail = true;
      }
    };
  }
}

describe("loadPixelImage", () => {
  it("resolves a PixelImage matching the loaded image's decoded dimensions", async () => {
    stubCanvasContext({
      getImageData: (sw, sh) => new ImageData(new Uint8ClampedArray(sw * sh * 4).fill(200), sw, sh),
    });
    class SizedFakeImage extends FakeImage {
      naturalWidth = 4;
      naturalHeight = 3;
    }
    vi.stubGlobal("Image", SizedFakeImage);

    const image = await loadPixelImage("/scenes/portrait/source.png");
    expect(image.width).toBe(4);
    expect(image.height).toBe(3);
    expect(image.data).toHaveLength(4 * 3 * 4);
  });

  it("rejects when the image fails to load", async () => {
    vi.stubGlobal("Image", FakeImage.failing());
    await expect(loadPixelImage("/missing.png")).rejects.toThrow("Failed to load image");
  });

  it("rejects when a 2D context is unavailable", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    vi.stubGlobal("Image", FakeImage);
    await expect(loadPixelImage("/scenes/portrait/source.png")).rejects.toThrow("2D canvas context unavailable");
  });
});

describe("pixelImageToBlob", () => {
  it("draws the pixel buffer onto a canvas and resolves a blob", async () => {
    const context = stubCanvasContext({});
    const fakeBlob = new Blob(["fake"], { type: "image/png" });
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(fakeBlob));

    const blob = await pixelImageToBlob({ width: 2, height: 2, data: new Uint8ClampedArray(16).fill(50) });

    expect(context.putImageData).toHaveBeenCalled();
    expect(blob).toBe(fakeBlob);
  });

  it("rejects when a 2D context is unavailable", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    await expect(pixelImageToBlob({ width: 1, height: 1, data: new Uint8ClampedArray(4) })).rejects.toThrow(
      "2D canvas context unavailable",
    );
  });

  it("rejects when encoding fails", async () => {
    stubCanvasContext({});
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(null));

    await expect(pixelImageToBlob({ width: 1, height: 1, data: new Uint8ClampedArray(4) })).rejects.toThrow(
      "Failed to encode image blob",
    );
  });
});
