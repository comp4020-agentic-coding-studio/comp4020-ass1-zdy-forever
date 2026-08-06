import { useEffect, useRef } from "react";
import type { PixelImage } from "../domain/types";

export type ProcessedCanvasProps = {
  image: PixelImage | null;
  isProcessing: boolean;
  label: string;
};

export function ProcessedCanvas({ image, isProcessing, label }: ProcessedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  }, [image]);

  return (
    <div className="processed-canvas" data-processing={isProcessing || undefined}>
      <canvas ref={canvasRef} role="img" aria-label={label} />
      {isProcessing && (
        <p className="processed-canvas__status" aria-live="polite">
          Rendering…
        </p>
      )}
    </div>
  );
}
