import type { KeyboardEvent } from "react";
import { APERTURE_VALUES, ISO_VALUES, SHUTTER_VALUES, formatAperture, formatIso, formatShutter } from "../domain/settings";
import type { SettingKey } from "../domain/settings";
import type { CameraSettings } from "../domain/types";

export type ControlPanelProps = {
  settings: CameraSettings;
  onStep: (key: SettingKey, direction: 1 | -1) => void;
  onSet: (key: SettingKey, value: number) => void;
  onKeyDown: (key: SettingKey, event: KeyboardEvent) => void;
  onReset: () => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  enabledKeys?: readonly SettingKey[];
  resetLabel?: string;
};

type ControlSpec = {
  key: SettingKey;
  label: string;
  values: readonly number[];
  format: (value: number) => string;
};

const CONTROLS: readonly ControlSpec[] = [
  { key: "iso", label: "ISO", values: ISO_VALUES, format: formatIso },
  { key: "aperture", label: "Aperture", values: APERTURE_VALUES, format: formatAperture },
  { key: "shutterSeconds", label: "Shutter speed", values: SHUTTER_VALUES, format: formatShutter },
];

export function ControlPanel({
  settings,
  onStep,
  onSet,
  onKeyDown,
  onReset,
  onInteractionStart,
  onInteractionEnd,
  enabledKeys,
  resetLabel = "Reset to scene defaults",
}: ControlPanelProps) {
  return (
    <fieldset className="control-panel">
      <legend>Camera settings</legend>
      {CONTROLS.map((control) => {
        const currentIndex = control.values.indexOf(settings[control.key]);
        const inputId = `control-${control.key}`;
        const enabled = !enabledKeys || enabledKeys.includes(control.key);
        return (
          <div className="control-panel__row" data-locked={!enabled || undefined} key={control.key}>
            <label htmlFor={inputId}>{control.label}</label>
            <button
              type="button"
              aria-label={`Decrease ${control.label}`}
              onClick={() => onStep(control.key, -1)}
              disabled={!enabled || currentIndex <= 0}
            >
              −
            </button>
            <input
              id={inputId}
              type="range"
              min={0}
              max={control.values.length - 1}
              step={1}
              value={currentIndex}
              disabled={!enabled}
              onChange={(event) => onSet(control.key, control.values[Number(event.target.value)])}
              onKeyDown={(event) => onKeyDown(control.key, event)}
              onPointerDown={onInteractionStart}
              onPointerUp={onInteractionEnd}
              onPointerCancel={onInteractionEnd}
              onBlur={onInteractionEnd}
              aria-valuetext={control.format(settings[control.key])}
            />
            <button
              type="button"
              aria-label={`Increase ${control.label}`}
              onClick={() => onStep(control.key, 1)}
              disabled={!enabled || currentIndex >= control.values.length - 1}
            >
              +
            </button>
            <output htmlFor={inputId}>{control.format(settings[control.key])}</output>
            {!enabled && <small className="control-panel__fixed">Fixed for this lesson</small>}
          </div>
        );
      })}
      <button type="button" onClick={onReset}>
        {resetLabel}
      </button>
    </fieldset>
  );
}
