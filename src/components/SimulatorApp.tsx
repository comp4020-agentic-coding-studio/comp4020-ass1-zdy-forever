import { useMemo, useState } from "react";
import { pixelImageToBlob } from "../browser/loadPixelImage";
import { useSceneAssets } from "../browser/useSceneAssets";
import { calculateStops } from "../domain/exposure";
import { assessSettings } from "../domain/explain";
import { DEFAULT_SCENE_ID, SCENES, getScene } from "../domain/scenes";
import type { PipelineInput } from "../processing/pipeline";
import { useProcessedFrame } from "../processing/useProcessedFrame";
import { ALBUM_CAPACITY, useAlbum } from "../state/useAlbum";
import { useCameraSettings } from "../state/useCameraSettings";
import { ControlPanel } from "./ControlPanel";
import { ExplanationPanel } from "./ExplanationPanel";
import { IndicatorBadges } from "./IndicatorBadges";
import { ProcessedCanvas } from "./ProcessedCanvas";
import { SceneSelector } from "./SceneSelector";

export function SimulatorApp() {
  const [sceneId, setSceneId] = useState(DEFAULT_SCENE_ID);
  const scene = getScene(sceneId) ?? SCENES[0];
  const assets = useSceneAssets(scene);
  const camera = useCameraSettings(scene.baseSettings);
  const [isInteracting, setIsInteracting] = useState(false);
  const album = useAlbum();
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pipelineInput = useMemo<PipelineInput | null>(() => {
    if (assets.status !== "ready") return null;
    return {
      source: assets.assets.source,
      depthMap: assets.assets.depthMap,
      subjectMask: assets.assets.subjectMask,
      motionMask: assets.assets.motionMask,
      motionVector: scene.motionVector,
      focusDepth: scene.focusDepth,
      handheldThreshold: scene.handheldThreshold,
      settings: camera.settings,
      baseSettings: scene.baseSettings,
      sceneId: scene.id,
    };
  }, [assets, scene, camera.settings]);

  const processed = useProcessedFrame(pipelineInput, isInteracting);
  const assessment = useMemo(() => assessSettings({ settings: camera.settings, scene }), [camera.settings, scene]);

  async function handleSave() {
    if (!processed.image) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const imageBlob = await pixelImageToBlob(processed.image);
      const totalExposureStops = calculateStops(camera.settings, scene.baseSettings).totalStops;
      const saved = album.add({
        sceneId: scene.id,
        sceneTitle: scene.title,
        settings: camera.settings,
        totalExposureStops,
        imageBlob,
        assessment,
      });
      setSaveStatus(saved ? "Saved to album." : `Album is full (${ALBUM_CAPACITY} max) — remove one to save another.`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="simulator-app">
      <SceneSelector scenes={SCENES} selectedId={scene.id} onSelect={setSceneId} />

      <div className="simulator-app__stage">
        {assets.status === "error" && <p role="alert">Couldn't load this scene's images: {assets.error.message}</p>}
        <ProcessedCanvas
          image={processed.image ?? (assets.status === "ready" ? assets.assets.source : null)}
          isProcessing={assets.status === "loading" || processed.isProcessing}
          label={`${scene.title}, simulated`}
        />
      </div>

      <ControlPanel
        settings={camera.settings}
        onStep={(key, direction) => {
          setIsInteracting(false);
          camera.step(key, direction);
        }}
        onSet={(key, value) => {
          setIsInteracting(true);
          camera.set(key, value);
        }}
        onKeyDown={camera.handleKeyDown}
        onReset={camera.reset}
      />

      <IndicatorBadges assessment={assessment} />
      <ExplanationPanel assessment={assessment} />

      <div className="simulator-app__album-controls">
        <button type="button" onClick={handleSave} disabled={!processed.image || album.isFull || isSaving}>
          {isSaving ? "Saving…" : `Save to album (${album.experiments.length}/${ALBUM_CAPACITY})`}
        </button>
        {saveStatus && <p aria-live="polite">{saveStatus}</p>}
      </div>
    </div>
  );
}
