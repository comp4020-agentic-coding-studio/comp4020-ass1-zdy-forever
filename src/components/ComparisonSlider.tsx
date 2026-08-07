import { useRef, useState } from "react";
import type { PixelImage } from "../domain/types";
import { ProcessedCanvas } from "./ProcessedCanvas";

export type ComparisonSliderProps = {
  original: PixelImage | null;
  simulated: PixelImage | null;
  isProcessing: boolean;
  label: string;
  settingsSummary?: string;
};

// Drag (mouse, touch, or the range input's arrow keys) to reveal how much of
// the original scene sits under the simulated frame. The divider position is
// a plain percentage, independent of the two images' pixel dimensions.
export function ComparisonSlider({ original, simulated, isProcessing, label, settingsSummary }: ComparisonSliderProps) {
  const [splitPercent, setSplitPercent] = useState(50);
  const [isComparing, setIsComparing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function setFromClientX(clientX: number) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.min(100, Math.max(0, ratio)));
  }

  return (
    <div
      className="comparison-slider"
      data-comparing={isComparing || undefined}
      ref={containerRef}
      onDoubleClick={() => {
        setSplitPercent(50);
        setIsComparing(false);
      }}
    >
      <div className="comparison-slider__layer comparison-slider__layer--original">
        <ProcessedCanvas image={original} isProcessing={false} label={`${label} — original`} />
      </div>
      <div
        className="comparison-slider__layer comparison-slider__layer--simulated"
        style={{ clipPath: `inset(0 0 0 ${splitPercent}%)` }}
      >
        <ProcessedCanvas image={simulated} isProcessing={isProcessing} label={`${label} — simulated`} />
      </div>
      <span className="comparison-slider__label comparison-slider__label--original" aria-hidden="true">Original</span>
      <span className="comparison-slider__label comparison-slider__label--simulated" aria-hidden="true">Simulated</span>
      <div className="comparison-slider__divider" style={{ left: `${splitPercent}%` }} aria-hidden="true">
        <span className="comparison-slider__grip"><span>‹</span><span>›</span></span>
      </div>
      {settingsSummary && (
        <output className="comparison-slider__settings" aria-live="polite">{settingsSummary}</output>
      )}
      <span id="comparison-slider-instructions" className="visually-hidden">
        Use the arrow keys or drag to compare. Double-click to centre the divider.
      </span>
      <input
        type="range"
        className="comparison-slider__handle"
        min={0}
        max={100}
        value={splitPercent}
        aria-label="Reveal original vs. simulated"
        aria-describedby="comparison-slider-instructions"
        aria-valuetext={`${Math.round(splitPercent)}% original, ${Math.round(100 - splitPercent)}% simulated`}
        onChange={(event) => setSplitPercent(Number(event.target.value))}
        onPointerDown={(event) => {
          setIsComparing(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          setFromClientX(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return;
          setFromClientX(event.clientX);
        }}
        onPointerUp={() => setIsComparing(false)}
        onPointerCancel={() => setIsComparing(false)}
      />
    </div>
  );
}
