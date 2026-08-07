import { useEffect, useMemo, useState } from "react";
import { pixelImageToBlob } from "../browser/loadPixelImage";
import { useSceneAssets } from "../browser/useSceneAssets";
import { calculateStops } from "../domain/exposure";
import { assessSettings } from "../domain/explain";
import { qualityIssueLabels, unacceptableQualityKeys } from "../domain/quality";
import { DEFAULT_SCENE_ID, SCENES, getScene } from "../domain/scenes";
import { formatSettings, MINIMUM_SETTINGS } from "../domain/settings";
import type { PipelineInput } from "../processing/pipeline";
import { useProcessedFrame } from "../processing/useProcessedFrame";
import { ALBUM_CAPACITY, useAlbum } from "../state/useAlbum";
import { useCameraSettings } from "../state/useCameraSettings";
import { useLevelProgress } from "../state/useLevelProgress";
import { AlbumComparisonView } from "./AlbumComparisonView";
import { AlbumStrip } from "./AlbumStrip";
import { ComparisonSlider } from "./ComparisonSlider";
import { ControlPanel } from "./ControlPanel";
import { ExplanationPanel } from "./ExplanationPanel";
import { ExposureTriangleDiagram } from "./ExposureTriangleDiagram";
import { IndicatorBadges } from "./IndicatorBadges";
import { SceneSelector } from "./SceneSelector";
import { SuccessOverlay } from "./SuccessOverlay";

export function SimulatorApp() {
  const [sceneId, setSceneId] = useState(DEFAULT_SCENE_ID);
  const scene = getScene(sceneId) ?? SCENES[0];
  const assets = useSceneAssets(scene);
  const camera = useCameraSettings(scene.id, MINIMUM_SETTINGS, scene.baseSettings);
  const levelProgress = useLevelProgress(SCENES);
  const [isInteracting, setIsInteracting] = useState(false);
  const album = useAlbum();
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // On the render right after a scene switch, `assets` can still report
  // "ready" for the *previous* scene (its own effect hasn't committed yet) —
  // checking sceneId too, not just status, is what stops that stale-scene
  // source from ever being tagged with the new scene's id and fed through
  // the depth-of-field cache under the wrong key.
  const currentAssets = assets.status === "ready" && assets.sceneId === scene.id ? assets.assets : null;

  const pipelineInput = useMemo<PipelineInput | null>(() => {
    if (!currentAssets) return null;
    return {
      source: currentAssets.source,
      depthMap: currentAssets.depthMap,
      subjectMask: currentAssets.subjectMask,
      motionMask: currentAssets.motionMask,
      motionVector: scene.motionVector,
      focusDepth: scene.focusDepth,
      handheldThreshold: scene.handheldThreshold,
      settings: camera.settings,
      baseSettings: scene.baseSettings,
      sceneId: scene.id,
    };
  }, [currentAssets, scene, camera.settings]);

  const processed = useProcessedFrame(pipelineInput, isInteracting);
  const assessment = useMemo(() => assessSettings({ settings: camera.settings, scene }), [camera.settings, scene]);
  const stops = useMemo(() => calculateStops(camera.settings, scene.baseSettings), [camera.settings, scene]);
  const qualityIssues = unacceptableQualityKeys(assessment, scene.qualityTargets);
  const sceneCleared = assessment.exposure === "balanced" && qualityIssues.length === 0;

  // A level clears the instant its settings land on a balanced exposure —
  // this reads off the assessment (pure settings math), not the processed
  // frame, so it doesn't wait on the async pipeline or a save.
  useEffect(() => {
    if (sceneCleared) levelProgress.markCleared(scene.id);
  }, [levelProgress.markCleared, scene.id, sceneCleared]);

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

  function toggleSelect(id: string) {
    setSelectedIds((previous) => {
      if (previous.includes(id)) return previous.filter((selectedId) => selectedId !== id);
      // Only ever compares the two most recently picked experiments — picking
      // a third swaps out the oldest selection rather than growing unbounded.
      return previous.length < 2 ? [...previous, id] : [previous[1], id];
    });
  }

  function handleRemove(id: string) {
    album.remove(id);
    setSelectedIds((previous) => previous.filter((selectedId) => selectedId !== id));
  }

  function handleClear() {
    album.clear();
    setSelectedIds([]);
  }

  const [firstSelected, secondSelected] = selectedIds
    .map((id) => album.experiments.find((experiment) => experiment.id === id))
    .filter((experiment): experiment is NonNullable<typeof experiment> => experiment !== undefined);

  return (
    <div className="simulator-app">
      <SceneSelector
        scenes={SCENES}
        selectedId={scene.id}
        onSelect={setSceneId}
        isUnlocked={levelProgress.isUnlocked}
        clearedIds={levelProgress.clearedIds}
      />

      <div className="camera-workbench">
        <div className="camera-workbench__visual">
          <div className="simulator-app__stage">
            {assets.status === "error" && <p role="alert">Couldn't load this scene's images: {assets.error.message}</p>}
            <ComparisonSlider
              original={currentAssets?.source ?? null}
              simulated={processed.image ?? currentAssets?.source ?? null}
              isProcessing={assets.status === "loading" || processed.isProcessing}
              label={scene.title}
              settingsSummary={formatSettings(camera.settings)}
            />
            {sceneCleared && (
              <SuccessOverlay title="Scene cleared!" message="Balanced exposure — the next challenge is unlocked." />
            )}
          </div>
          <IndicatorBadges assessment={assessment} />
          <p className="quality-guidance" data-ready={sceneCleared || undefined} aria-live="polite">
            {sceneCleared
              ? "Exposure and image quality both meet this scene's goal."
              : assessment.exposure === "balanced" && qualityIssues.length > 0
                ? `Exposure is balanced, but improve ${qualityIssueLabels(qualityIssues).join(" and ")} to clear the scene.`
                : "Balance the exposure without sacrificing the image quality this scene needs."}
          </p>
        </div>

        <aside className="camera-workbench__controls" aria-label="Camera controls and exposure triangle">
          <ControlPanel
            settings={camera.settings}
            onStep={(key, direction) => {
              setIsInteracting(false);
              camera.step(key, direction);
            }}
            onSet={(key, value) => {
              camera.set(key, value);
            }}
            onKeyDown={camera.handleKeyDown}
            onReset={camera.reset}
            onInteractionStart={() => setIsInteracting(true)}
            onInteractionEnd={() => setIsInteracting(false)}
          />
          <div className="camera-workbench__triangle">
            <p className="simulator-app__triangle-caption">Your exposure triangle</p>
            <ExposureTriangleDiagram isoStops={stops.isoStops} apertureStops={stops.apertureStops} shutterStops={stops.shutterStops} />
          </div>
        </aside>
      </div>

      <ExplanationPanel assessment={assessment} />

      <div className="simulator-app__album-controls">
        <button type="button" onClick={handleSave} disabled={!processed.image || album.isFull || isSaving}>
          {isSaving ? "Saving…" : `Save to album (${album.experiments.length}/${ALBUM_CAPACITY})`}
        </button>
        {saveStatus && <p aria-live="polite">{saveStatus}</p>}
      </div>

      <AlbumStrip
        experiments={album.experiments}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onRemove={handleRemove}
        onClear={handleClear}
      />

      {firstSelected && secondSelected && <AlbumComparisonView first={firstSelected} second={secondSelected} />}
    </div>
  );
}
