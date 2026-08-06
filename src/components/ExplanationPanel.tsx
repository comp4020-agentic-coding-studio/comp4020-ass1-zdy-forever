import type { Assessment } from "../domain/types";

export type ExplanationPanelProps = {
  assessment: Assessment;
};

export function ExplanationPanel({ assessment }: ExplanationPanelProps) {
  return (
    <div className="explanation-panel" aria-live="polite">
      <h2>What's happening</h2>
      <ul>
        {assessment.messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
