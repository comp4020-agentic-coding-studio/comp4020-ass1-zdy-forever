import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSceneAssets } from "../browser/useSceneAssets";
import { scrollToPageTop } from "../browser/scrollToPageTop";
import { calculateStops } from "../domain/exposure";
import { assessSettings } from "../domain/explain";
import { qualityIssueLabels, unacceptableQualityKeys } from "../domain/quality";
import { DEFAULT_SCENE_ID, SCENES, getScene } from "../domain/scenes";
import { formatSettings, MINIMUM_SETTINGS } from "../domain/settings";
import type { PipelineInput } from "../processing/pipeline";
import { useProcessedFrame } from "../processing/useProcessedFrame";
import { useCameraSettings } from "../state/useCameraSettings";
import { useLevelProgress } from "../state/useLevelProgress";
import { AnswerCard } from "./AnswerCard";
import { ComparisonSlider } from "./ComparisonSlider";
import { ControlPanel } from "./ControlPanel";
import { ExplanationPanel } from "./ExplanationPanel";
import { ExposureTriangleDiagram } from "./ExposureTriangleDiagram";
import { IndicatorBadges } from "./IndicatorBadges";
import { SceneSelector } from "./SceneSelector";
import { SuccessOverlay } from "./SuccessOverlay";

export type SimulatorAppProps = {
  onAllChallengesCompleteChange?: (complete: boolean) => void;
  onClaimAward?: () => void;
};

export function SimulatorApp({ onAllChallengesCompleteChange, onClaimAward }: SimulatorAppProps = {}) {
  const [sceneId, setSceneId] = useState(DEFAULT_SCENE_ID);
  const scene = getScene(sceneId) ?? SCENES[0];
  const assets = useSceneAssets(scene);
  const camera = useCameraSettings(scene.id, MINIMUM_SETTINGS, scene.baseSettings);
  const levelProgress = useLevelProgress(SCENES);
  const [isInteracting, setIsInteracting] = useState(false);

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
  const sceneIndex = SCENES.findIndex((item) => item.id === scene.id);
  const isLastScene = scene.id === SCENES.at(-1)?.id;
  const allChallengesComplete = levelProgress.clearedIds.size === SCENES.length;
  const currentSceneComplete = sceneCleared || levelProgress.clearedIds.has(scene.id);
  const nextScene = SCENES[sceneIndex + 1];
  const headerActions = document.getElementById("header-actions");

  useEffect(() => {
    scrollToPageTop();
  }, [scene.id]);

  useEffect(() => {
    onAllChallengesCompleteChange?.(allChallengesComplete);
  }, [allChallengesComplete, onAllChallengesCompleteChange]);

  // A level clears the instant its settings land on a balanced exposure —
  // this reads off the assessment (pure settings math), not the processed
  // frame, so it doesn't wait on the async pipeline or a save.
  useEffect(() => {
    if (sceneCleared) levelProgress.markCleared(scene.id);
  }, [levelProgress.markCleared, scene.id, sceneCleared]);

  return (
    <div className="simulator-app">
      {headerActions && currentSceneComplete && (nextScene || onClaimAward) && createPortal(
        <button
          className="site-header__shortcut"
          type="button"
          onClick={() => nextScene ? setSceneId(nextScene.id) : onClaimAward?.()}
        >
          {nextScene ? `Next: ${nextScene.title} →` : "Get award →"}
        </button>,
        headerActions,
      )}
      <SceneSelector
        scenes={SCENES}
        selectedId={scene.id}
        onSelect={setSceneId}
        isUnlocked={levelProgress.isUnlocked}
        clearedIds={levelProgress.clearedIds}
      />
      {allChallengesComplete && (
        <div className="challenge-complete-summary" role="status">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>All challenges complete</strong>
            <small>You can revisit any scene and keep exploring its settings.</small>
          </div>
        </div>
      )}

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
              <SuccessOverlay
                title={isLastScene ? "All challenges complete!" : "Scene cleared!"}
                message={isLastScene
                  ? "You balanced every scene and protected what mattered."
                  : "Balanced exposure — the next challenge is unlocked."}
              />
            )}
          </div>
          <IndicatorBadges assessment={assessment} />
          <p className="quality-guidance" data-ready={sceneCleared || undefined} aria-live="polite">
            {sceneCleared
              ? isLastScene
                ? "Every challenge is complete. Keep exploring any scene or setting."
                : "Exposure and image quality both meet this scene's goal."
              : assessment.exposure === "balanced" && qualityIssues.length > 0
                ? `Exposure is balanced, but improve ${qualityIssueLabels(qualityIssues).join(" and ")} to clear the scene.`
                : "Balance the exposure without sacrificing the image quality this scene needs."}
          </p>
          <ExplanationPanel assessment={assessment} />
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
          {scene.answerSettings && (
            <AnswerCard
              settings={scene.answerSettings}
              onApply={() => {
                camera.set("iso", scene.answerSettings!.iso);
                camera.set("aperture", scene.answerSettings!.aperture);
                camera.set("shutterSeconds", scene.answerSettings!.shutterSeconds);
              }}
            />
          )}
        </aside>
      </div>

    </div>
  );
}
