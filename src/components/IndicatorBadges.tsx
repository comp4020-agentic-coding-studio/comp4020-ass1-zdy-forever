import type { Assessment } from "../domain/types";

export type IndicatorBadgesProps = {
  assessment: Assessment;
  visibleKeys?: readonly (keyof Assessment)[];
};

const BADGES: ReadonlyArray<{ key: keyof Assessment; label: string }> = [
  { key: "exposure", label: "Exposure" },
  { key: "noise", label: "Noise" },
  { key: "depthOfField", label: "Depth of field" },
  { key: "motionBlur", label: "Motion blur" },
];

export function IndicatorBadges({ assessment, visibleKeys }: IndicatorBadgesProps) {
  const badges = visibleKeys ? BADGES.filter(({ key }) => visibleKeys.includes(key)) : BADGES;
  return (
    <ul className="indicator-badges">
      {badges.map(({ key, label }) => (
        <li key={key} className="indicator-badges__item" data-level={assessment[key]}>
          <span className="indicator-badges__label">{label}</span>
          <span className="indicator-badges__value">{assessment[key]}</span>
        </li>
      ))}
    </ul>
  );
}
