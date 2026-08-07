export type SuccessOverlayProps = {
  title: string;
  message: string;
};

export function SuccessOverlay({ title, message }: SuccessOverlayProps) {
  return (
    <div className="success-overlay" role="status" aria-live="polite">
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
