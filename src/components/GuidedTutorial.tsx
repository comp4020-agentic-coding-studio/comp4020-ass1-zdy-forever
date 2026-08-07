import { useEffect, useMemo, useState } from "react";
import { useSceneAssets } from "../browser/useSceneAssets";
import { calculateStops } from "../domain/exposure";
import { assessSettings } from "../domain/explain";
import { qualityIssueLabels, unacceptableQualityKeys } from "../domain/quality";
import { formatSettings, type SettingKey } from "../domain/settings";
import { TUTORIALS, type TutorialDefinition } from "../domain/tutorials";
import type { Assessment } from "../domain/types";
import type { PipelineInput } from "../processing/pipeline";
import { useProcessedFrame } from "../processing/useProcessedFrame";
import { useCameraSettings } from "../state/useCameraSettings";
import { ComparisonSlider } from "./ComparisonSlider";
import { ControlPanel } from "./ControlPanel";
import { AnswerCard } from "./AnswerCard";
import { ExposureTriangleDiagram } from "./ExposureTriangleDiagram";
import { IndicatorBadges } from "./IndicatorBadges";
import { SuccessOverlay } from "./SuccessOverlay";

export type GuidedTutorialProps = {
  lesson: TutorialDefinition;
  lessonIndex: number;
  isPreviouslyComplete?: boolean;
  onLessonComplete?: () => void;
  onContinue: () => void;
  onBack?: () => void;
};

function relevantMessageIndexes(enabledSettings: readonly SettingKey[]): number[] {
  const indexes = [0];
  if (enabledSettings.includes("iso")) indexes.push(1);
  if (enabledSettings.includes("aperture")) indexes.push(2);
  if (enabledSettings.includes("shutterSeconds")) indexes.push(3);
  return indexes;
}

function relevantBadges(enabledSettings: readonly SettingKey[]): readonly (keyof Assessment)[] {
  const keys: (keyof Assessment)[] = ["exposure"];
  if (enabledSettings.includes("iso")) keys.push("noise");
  if (enabledSettings.includes("aperture")) keys.push("depthOfField");
  if (enabledSettings.includes("shutterSeconds")) keys.push("motionBlur");
  return keys;
}

export function GuidedTutorial({
  lesson,
  lessonIndex,
  isPreviouslyComplete = false,
  onLessonComplete,
  onContinue,
  onBack,
}: GuidedTutorialProps) {
  const assets = useSceneAssets(lesson);
  const camera = useCameraSettings(lesson.id, lesson.initialSettings, lesson.initialSettings);
  const [touchedKeys, setTouchedKeys] = useState<ReadonlySet<SettingKey>>(new Set());
  const [isInteracting, setIsInteracting] = useState(false);
  const [completedDuringVisit, setCompletedDuringVisit] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentAssets = assets.status === "ready" && assets.sceneId === lesson.id ? assets.assets : null;
  const pipelineInput = useMemo<PipelineInput | null>(() => {
    if (!currentAssets) return null;
    return {
      source: currentAssets.source,
      depthMap: currentAssets.depthMap,
      subjectMask: currentAssets.subjectMask,
      motionMask: currentAssets.motionMask,
      motionVector: lesson.motionVector,
      focusDepth: lesson.focusDepth,
      handheldThreshold: lesson.handheldThreshold,
      settings: camera.settings,
      baseSettings: lesson.baseSettings,
      effectBaseSettings: lesson.effectBaseSettings,
      sceneId: lesson.id,
    };
  }, [camera.settings, currentAssets, lesson]);

  const processed = useProcessedFrame(pipelineInput, isInteracting);
  const assessment = useMemo(() => assessSettings({ settings: camera.settings, scene: lesson }), [camera.settings, lesson]);
  const stops = useMemo(() => calculateStops(camera.settings, lesson.baseSettings), [camera.settings, lesson.baseSettings]);
  const allControlsTried = lesson.enabledSettings.every((key) => touchedKeys.has(key));
  const qualityIssues = unacceptableQualityKeys(assessment, lesson.qualityTargets);
  const meetsCompletionRequirements =
    assessment.exposure === "balanced" && allControlsTried && qualityIssues.length === 0;
  const lessonComplete = isPreviouslyComplete || completedDuringVisit;
  const messages = relevantMessageIndexes(lesson.enabledSettings).map((index) => assessment.messages[index]);

  useEffect(() => {
    if (!meetsCompletionRequirements || completedDuringVisit || isPreviouslyComplete) return;
    setCompletedDuringVisit(true);
    setShowCelebration(true);
    onLessonComplete?.();
  }, [completedDuringVisit, isPreviouslyComplete, meetsCompletionRequirements, onLessonComplete]);

  function markTouched(key: SettingKey) {
    if (!lesson.enabledSettings.includes(key)) return;
    setTouchedKeys((previous) => (previous.has(key) ? previous : new Set(previous).add(key)));
  }

  return (
    <section className="tutorial" aria-labelledby="tutorial-heading">
      <ol className="tutorial__progress" aria-label="Tutorial progress">
        {TUTORIALS.map((item, index) => (
          <li key={item.id} data-state={index < lessonIndex ? "complete" : index === lessonIndex ? "current" : "locked"}>
            <span>{index < lessonIndex || (index === lessonIndex && lessonComplete) ? "✓" : index + 1}</span>
            {item.title}
          </li>
        ))}
      </ol>

      <header className="tutorial__header">
        <p className="tutorial__eyebrow">{lesson.stepLabel}</p>
        <h2 id="tutorial-heading">{lesson.lessonTitle}</h2>
        <p className="tutorial__purpose">{lesson.purpose}</p>
        <p className="tutorial__tradeoff"><strong>The cost:</strong> {lesson.tradeoff}</p>
        <p className="tutorial__goal"><strong>Your task:</strong> {lesson.goal}</p>
      </header>

      <div className="camera-workbench">
        <div className="camera-workbench__visual">
          <div className="simulator-app__stage">
            {assets.status === "error" && <p role="alert">Couldn&apos;t load this tutorial image: {assets.error.message}</p>}
            <ComparisonSlider
              original={currentAssets?.source ?? null}
              simulated={processed.image ?? currentAssets?.source ?? null}
              isProcessing={assets.status === "loading" || processed.isProcessing}
              label={`${lesson.title} tutorial`}
              settingsSummary={formatSettings(camera.settings)}
            />
            {showCelebration && (
              <SuccessOverlay
                title="Lesson complete!"
                message={lessonIndex === TUTORIALS.length - 1 ? "The challenges are ready." : "The next lesson is ready."}
                onDismiss={() => setShowCelebration(false)}
              />
            )}
            {lessonComplete && !showCelebration && (
              <div className="lesson-complete-chip" role="status">✓ Lesson complete · Keep exploring or continue</div>
            )}
          </div>
          <IndicatorBadges assessment={assessment} visibleKeys={relevantBadges(lesson.enabledSettings)} />
        </div>

        <aside className="camera-workbench__controls" aria-label="Camera controls and exposure triangle">
          <ControlPanel
            settings={camera.settings}
            enabledKeys={lesson.enabledSettings}
            resetLabel="Reset this lesson"
            onStep={(key, direction) => {
              setIsInteracting(false);
              markTouched(key);
              camera.step(key, direction);
            }}
            onSet={(key, value) => {
              markTouched(key);
              camera.set(key, value);
            }}
            onKeyDown={(key, event) => {
              if (event.key.startsWith("Arrow")) markTouched(key);
              camera.handleKeyDown(key, event);
            }}
            onReset={() => {
              setTouchedKeys(new Set());
              camera.reset();
            }}
            onInteractionStart={() => setIsInteracting(true)}
            onInteractionEnd={() => setIsInteracting(false)}
          />
          <div className="camera-workbench__triangle">
            <p className="simulator-app__triangle-caption">Your exposure triangle</p>
            <ExposureTriangleDiagram isoStops={stops.isoStops} apertureStops={stops.apertureStops} shutterStops={stops.shutterStops} />
          </div>
          {lesson.answerSettings && (
            <AnswerCard
              settings={lesson.answerSettings}
              onApply={() => {
                setTouchedKeys(new Set(lesson.enabledSettings));
                camera.set("iso", lesson.answerSettings!.iso);
                camera.set("aperture", lesson.answerSettings!.aperture);
                camera.set("shutterSeconds", lesson.answerSettings!.shutterSeconds);
              }}
            />
          )}
        </aside>
      </div>

      <div className="explanation-panel tutorial__explanation" aria-live="polite">
        <h2>What changed</h2>
        <ul>{messages.map((message) => <li key={message}>{message}</li>)}</ul>
      </div>

      <div className="tutorial__completion" data-complete={lessonComplete || undefined}>
        <p aria-live="polite">
          {lessonComplete
            ? "Lesson recorded. Keep exploring these settings, or continue whenever you are ready."
            : assessment.exposure === "balanced" && qualityIssues.length > 0
              ? `Exposure is balanced, but ${qualityIssueLabels(qualityIssues).join(" and ")} is too compromised. Try a cleaner combination.`
            : assessment.exposure === "balanced"
              ? "Exposure is balanced. Try each available control before continuing."
              : "Keep adjusting the available control(s) until Exposure reads balanced."}
        </p>
        <div className="tutorial__actions">
          {onBack && <button type="button" onClick={onBack}>← Previous lesson</button>}
          <button type="button" onClick={onContinue} disabled={!lessonComplete}>
            {lessonIndex === TUTORIALS.length - 1 ? "Start the challenges →" : "Continue to next lesson →"}
          </button>
        </div>
      </div>
    </section>
  );
}
