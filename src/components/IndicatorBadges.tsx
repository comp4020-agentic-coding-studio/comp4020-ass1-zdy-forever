import type { Assessment } from "../domain/types";

export type IndicatorBadgesProps = {
  assessment: Assessment;
};

const BADGES: ReadonlyArray<{ key: keyof Assessment; label: string }> = [
  { key: "exposure", label: "Exposure" },
  { key: "noise", label: "Noise" },
  { key: "depthOfField", label: "Depth of field" },
  { key: "motionBlur", label: "Motion blur" },
];

export function IndicatorBadges({ assessment }: IndicatorBadgesProps) {
  return (
    <ul className="indicator-badges">
      {BADGES.map(({ key, label }) => (
        <li key={key} className="indicator-badges__item" data-level={assessment[key]}>
          <span className="indicator-badges__label">{label}</span>
          <span className="indicator-badges__value">{assessment[key]}</span>
        </li>
      ))}
    </ul>
  );
}
