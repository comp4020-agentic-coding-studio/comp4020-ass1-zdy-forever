import { useState } from "react";
import { formatSettings } from "../domain/settings";
import type { CameraSettings } from "../domain/types";

export type AnswerCardProps = {
  settings: CameraSettings;
  onApply: () => void;
};

export function AnswerCard({ settings, onApply }: AnswerCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <section className="answer-card" data-revealed={isRevealed || undefined} aria-label="Standard answer">
      <button
        type="button"
        className="answer-card__reveal"
        aria-expanded={isRevealed}
        onClick={() => setIsRevealed((current) => !current)}
      >
        <span><span aria-hidden="true">◎</span> Standard answer</span>
        <span aria-hidden="true">{isRevealed ? "−" : "+"}</span>
      </button>
      {isRevealed && (
        <div className="answer-card__details">
          <p>One clean solution</p>
          <output>{formatSettings(settings)}</output>
          <small>Other balanced combinations may also pass.</small>
          <button type="button" onClick={onApply}>Apply this answer</button>
        </div>
      )}
    </section>
  );
}
