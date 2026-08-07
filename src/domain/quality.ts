import type { Assessment, QualityTargets } from "./types";

export type QualityKey = "noise" | "depthOfField" | "motionBlur";

const QUALITY_LABELS: Record<QualityKey, string> = {
  noise: "noise",
  depthOfField: "depth of field",
  motionBlur: "motion blur",
};

export function unacceptableQualityKeys(
  assessment: Assessment,
  targets: QualityTargets | undefined,
): QualityKey[] {
  if (!targets) return [];
  return (Object.keys(QUALITY_LABELS) as QualityKey[]).filter((key) => {
    const accepted = targets[key];
    return accepted !== undefined && !accepted.includes(assessment[key] as never);
  });
}

export function qualityIssueLabels(keys: readonly QualityKey[]): string[] {
  return keys.map((key) => QUALITY_LABELS[key]);
}
