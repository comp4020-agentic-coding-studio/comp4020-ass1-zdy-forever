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
// allowed value table), and reset. `initialSettings` is what a fresh mount
// or a scene switch lands on (deliberately the table floor, not the
// scene's own baseline — see `MINIMUM_SETTINGS`); `resetSettings` is what
// the Reset button targets (the scene's actual baseline). Re-initialises to
// `initialSettings` whenever `sceneId` changes, since `initialSettings`
// itself is the same constant across every scene and wouldn't otherwise
// signal a scene switch by its own identity.
export function useCameraSettings(
  sceneId: string,
  initialSettings: CameraSettings,
  resetSettings: CameraSettings,
): UseCameraSettingsResult {
  const [settings, setSettings] = useState<CameraSettings>(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
    // Deliberately keyed on sceneId alone — see the function comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  const step = useCallback((key: SettingKey, direction: 1 | -1) => {
    setSettings((current) => ({ ...current, [key]: stepSetting(key, current[key], direction) }));
  }, []);

  const set = useCallback((key: SettingKey, value: number) => {
    setSettings((current) => ({ ...current, [key]: nearestAllowedValue(key, value) }));
  }, []);

  const reset = useCallback(() => {
    setSettings(resetSettings);
  }, [resetSettings]);

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
