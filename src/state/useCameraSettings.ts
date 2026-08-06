import { useCallback, useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { nearestAllowedValue, stepSetting, type SettingKey } from "../domain/settings";
import type { CameraSettings } from "../domain/types";

export type UseCameraSettingsResult = {
  settings: CameraSettings;
  step: (key: SettingKey, direction: 1 | -1) => void;
  set: (key: SettingKey, value: number) => void;
  reset: () => void;
  // Bind to a control's onKeyDown so arrow keys step it the same way the
  // on-screen +/- buttons do — one policy, shared by mouse and keyboard.
  handleKeyDown: (key: SettingKey, event: KeyboardEvent) => void;
};

// Manages one scene's live camera settings: stepping (used by both button
// controls and arrow keys), direct set (sliders/selects, snapped onto the
// allowed value table), and reset back to the scene's base settings.
// Re-initialises whenever `baseSettings`'s identity changes (i.e. the
// active scene changed).
export function useCameraSettings(baseSettings: CameraSettings): UseCameraSettingsResult {
  const [settings, setSettings] = useState<CameraSettings>(baseSettings);

  useEffect(() => {
    setSettings(baseSettings);
  }, [baseSettings]);

  const step = useCallback((key: SettingKey, direction: 1 | -1) => {
    setSettings((current) => ({ ...current, [key]: stepSetting(key, current[key], direction) }));
  }, []);

  const set = useCallback((key: SettingKey, value: number) => {
    setSettings((current) => ({ ...current, [key]: nearestAllowedValue(key, value) }));
  }, []);

  const reset = useCallback(() => {
    setSettings(baseSettings);
  }, [baseSettings]);

  const handleKeyDown = useCallback(
    (key: SettingKey, event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "ArrowRight") {
        event.preventDefault();
        step(key, 1);
      } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
        event.preventDefault();
        step(key, -1);
      }
    },
    [step],
  );

  return { settings, step, set, reset, handleKeyDown };
}
