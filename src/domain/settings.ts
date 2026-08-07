import type { CameraSettings } from "./types";

export const ISO_VALUES = [100, 200, 400, 800, 1600, 3200, 6400] as const;
export const APERTURE_VALUES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16] as const;
export const SHUTTER_VALUES = [
  1 / 2000,
  1 / 1000,
  1 / 500,
  1 / 250,
  1 / 125,
  1 / 60,
  1 / 30,
  1 / 15,
  1 / 4,
  1,
] as const;

export type SettingKey = "iso" | "aperture" | "shutterSeconds";

// Every scene starts here, not at its own baseline — a fresh scene's
// baseline is by definition zero stops from itself, which would count as a
// "balanced" exposure with no input from the player. Starting at the floor
// of every table forces an actual adjustment before a level can clear.
export const MINIMUM_SETTINGS: CameraSettings = {
  iso: ISO_VALUES[0],
  aperture: APERTURE_VALUES[0],
  shutterSeconds: SHUTTER_VALUES[0],
};

const VALUE_TABLES: Record<SettingKey, readonly number[]> = {
  iso: ISO_VALUES,
  aperture: APERTURE_VALUES,
  shutterSeconds: SHUTTER_VALUES,
};

// The nearest allowed value to a raw number — used to snap external/derived
// values (e.g. a scene's base settings) onto the stepped scale.
export function nearestAllowedValue(key: SettingKey, raw: number): number {
  const table = VALUE_TABLES[key];
  return table.reduce((closest, candidate) =>
    Math.abs(candidate - raw) < Math.abs(closest - raw) ? candidate : closest,
  );
}

export function isValidSettingValue(key: SettingKey, value: number): boolean {
  return VALUE_TABLES[key].includes(value as never);
}

export function isValidSettings(settings: CameraSettings): boolean {
  return (
    isValidSettingValue("iso", settings.iso) &&
    isValidSettingValue("aperture", settings.aperture) &&
    isValidSettingValue("shutterSeconds", settings.shutterSeconds)
  );
}

// Steps one setting to its next allowed value in `direction`, clamped at the
// ends of the table. Used for both the on-screen stepper controls and
// arrow-key keyboard input, so both go through the same stepped scale.
export function stepSetting(key: SettingKey, current: number, direction: 1 | -1): number {
  const table = VALUE_TABLES[key];
  const index = table.indexOf(current as never);
  const currentIndex = index === -1 ? closestIndex(table, current) : index;
  const nextIndex = Math.min(Math.max(currentIndex + direction, 0), table.length - 1);
  return table[nextIndex];
}

function closestIndex(table: readonly number[], raw: number): number {
  let best = 0;
  let bestDistance = Infinity;
  table.forEach((candidate, i) => {
    const distance = Math.abs(candidate - raw);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  });
  return best;
}

export function formatIso(iso: number): string {
  return `ISO ${iso}`;
}

export function formatAperture(aperture: number): string {
  return `f/${aperture}`;
}

export function formatShutter(shutterSeconds: number): string {
  if (shutterSeconds >= 1) return `${shutterSeconds}s`;
  const denominator = Math.round(1 / shutterSeconds);
  return `1/${denominator}s`;
}

export function formatSettings(settings: CameraSettings): string {
  return `${formatIso(settings.iso)}, ${formatAperture(settings.aperture)}, ${formatShutter(settings.shutterSeconds)}`;
}
