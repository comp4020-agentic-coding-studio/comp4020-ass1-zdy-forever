import { useEffect, useRef, useState } from "react";

export type SuccessOverlayProps = {
  title: string;
  message: string;
  durationMs?: number;
  onDismiss?: () => void;
};

type OverlayPhase = "visible" | "leaving" | "hidden";

const EXIT_DURATION_MS = 400;

export function SuccessOverlay({ title, message, durationMs = 3000, onDismiss }: SuccessOverlayProps) {
  const [phase, setPhase] = useState<OverlayPhase>("visible");
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const exitTimer = window.setTimeout(
      () => setPhase("leaving"),
      Math.max(0, durationMs - EXIT_DURATION_MS),
    );
    const hideTimer = window.setTimeout(() => {
      setPhase("hidden");
      onDismissRef.current?.();
    }, durationMs);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [durationMs]);

  if (phase === "hidden") return null;

  return (
    <div className="success-overlay" data-state={phase} role="status" aria-live="polite">
      <div className="success-overlay__confetti" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
      <div className="success-overlay__message">
        <span aria-hidden="true">✓</span>
        <strong>{title}</strong>
        <small>{message}</small>
      </div>
    </div>
  );
}
