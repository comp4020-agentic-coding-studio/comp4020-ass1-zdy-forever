// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PixelImage } from "../domain/types";
import { ProcessedCanvas } from "./ProcessedCanvas";

afterEach(cleanup);

function makeImage(width: number, height: number): PixelImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4).fill(128) };
}

describe("ProcessedCanvas", () => {
  it("sizes the canvas to the image and draws its pixels", () => {
    const image = makeImage(4, 3);
    render(<ProcessedCanvas image={image} isProcessing={false} label="Test frame" />);
    const canvas = screen.getByRole("img", { name: "Test frame" }) as HTMLCanvasElement;
    expect(canvas.width).toBe(4);
    expect(canvas.height).toBe(3);
  });

  it("shows a rendering status while processing", () => {
    render(<ProcessedCanvas image={null} isProcessing label="Test frame" />);
    expect(screen.getByText("Rendering…")).toBeInTheDocument();
  });

  it("shows no rendering status once settled", () => {
    render(<ProcessedCanvas image={makeImage(2, 2)} isProcessing={false} label="Test frame" />);
    expect(screen.queryByText("Rendering…")).not.toBeInTheDocument();
  });

  it("resizes the canvas when a differently-sized image arrives", () => {
    const { rerender } = render(<ProcessedCanvas image={makeImage(4, 3)} isProcessing={false} label="Test frame" />);
    rerender(<ProcessedCanvas image={makeImage(8, 6)} isProcessing={false} label="Test frame" />);
    const canvas = screen.getByRole("img", { name: "Test frame" }) as HTMLCanvasElement;
    expect(canvas.width).toBe(8);
    expect(canvas.height).toBe(6);
  });
});
