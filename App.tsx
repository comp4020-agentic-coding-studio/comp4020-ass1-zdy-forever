import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { scrollToPageTop } from "./src/browser/scrollToPageTop";
import { GuidedTutorial } from "./src/components/GuidedTutorial";
import { Opening } from "./src/components/Opening";
import { SimulatorApp } from "./src/components/SimulatorApp";
import { SCENES } from "./src/domain/scenes";
import { TUTORIALS } from "./src/domain/tutorials";
import { loadClearedIds } from "./src/state/useLevelProgress";

const TUTORIAL_STORAGE_KEY = "camera-school-tutorial-complete";
const LESSON_PROGRESS_STORAGE_KEY = "camera-school-completed-lessons";

function hasCompletedTutorials(): boolean {
  try {
    return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function loadCompletedLessonIds(): ReadonlySet<string> {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LESSON_PROGRESS_STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(stored)) return new Set();
    const validIds = new Set(TUTORIALS.map((lesson) => lesson.id));
    return new Set(stored.filter((id): id is string => typeof id === "string" && validIds.has(id)));
  } catch {
    return new Set();
  }
}

function firstIncompleteLessonIndex(completedIds: ReadonlySet<string>): number {
  const index = TUTORIALS.findIndex((lesson) => !completedIds.has(lesson.id));
  return index === -1 ? TUTORIALS.length : index;
}

export function App() {
  const [completedLessonIds, setCompletedLessonIds] = useState<ReadonlySet<string>>(loadCompletedLessonIds);
  const [lessonIndex, setLessonIndex] = useState(() =>
    hasCompletedTutorials() ? TUTORIALS.length : firstIncompleteLessonIndex(loadCompletedLessonIds()),
  );
  const [showIntroduction, setShowIntroduction] = useState(() =>
    !hasCompletedTutorials() && loadCompletedLessonIds().size === 0,
  );
  const [allChallengesComplete, setAllChallengesComplete] = useState(
    () => loadClearedIds(SCENES).size === SCENES.length,
  );
  const tutorialsComplete = lessonIndex >= TUTORIALS.length;
  const challengesUnlocked = completedLessonIds.size === TUTORIALS.length;
  const currentLessonComplete = !tutorialsComplete && completedLessonIds.has(TUTORIALS[lessonIndex].id);
  const canContinueFromHeader = currentLessonComplete && (lessonIndex < TUTORIALS.length - 1 || challengesUnlocked);
  const nextIncompleteIndex = firstIncompleteLessonIndex(completedLessonIds);
  const navigableLessonIds = new Set(completedLessonIds);
  const headerActions = document.getElementById("header-actions");
  if (nextIncompleteIndex < TUTORIALS.length) navigableLessonIds.add(TUTORIALS[nextIncompleteIndex].id);

  useEffect(() => {
    if (showIntroduction) return;
    scrollToPageTop();
  }, [lessonIndex, showIntroduction]);

  useEffect(() => {
    if (tutorialsComplete) return;
    const indexes = showIntroduction ? [0] : [lessonIndex, lessonIndex + 1];
    for (const index of indexes) {
      const lesson = TUTORIALS[index];
      if (!lesson) continue;
      for (const source of [lesson.sourceImage, lesson.depthMap, lesson.subjectMask, lesson.motionMask]) {
        if (!source) continue;
        const preload = new Image();
        preload.decoding = "async";
        preload.src = source;
      }
    }
  }, [lessonIndex, showIntroduction, tutorialsComplete]);

  function recordLessonComplete(lessonId: string) {
    setCompletedLessonIds((previous) => {
      if (previous.has(lessonId)) return previous;
      const next = new Set(previous).add(lessonId);
      try {
        window.localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // In-memory progress still keeps the lesson unlocked for this visit.
      }
      return next;
    });
  }

  function openChallenges() {
    try {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    } catch {
      // Progress persistence is helpful, but never blocks navigation.
    }
    setLessonIndex(TUTORIALS.length);
  }

  function navigateToLesson(index: number) {
    setLessonIndex(index);
  }

  function continueFromHeader() {
    if (lessonIndex >= TUTORIALS.length - 1) {
      openChallenges();
      return;
    }
    navigateToLesson(lessonIndex + 1);
  }

  function reviewTutorials() {
    setLessonIndex(0);
    setShowIntroduction(false);
  }

  return (
    <>
      {headerActions && canContinueFromHeader && createPortal(
        <button className="site-header__shortcut" type="button" onClick={continueFromHeader}>
          {lessonIndex === TUTORIALS.length - 1 && challengesUnlocked
            ? "Challenges →"
            : `Next: ${TUTORIALS[lessonIndex + 1].title} →`}
        </button>,
        headerActions,
      )}
      {showIntroduction && !tutorialsComplete ? (
        <Opening onStart={() => setShowIntroduction(false)} />
      ) : tutorialsComplete ? (
        <section className="challenge-section" aria-labelledby="challenge-heading">
          <div className="challenge-section__header">
            <div>
              <p className="tutorial__eyebrow">{allChallengesComplete ? "All challenges complete" : "Tutorial complete"}</p>
              <h2 id="challenge-heading">{allChallengesComplete ? "You balanced every scene" : "The challenges are unlocked"}</h2>
              <p>{allChallengesComplete
                ? "Revisit any photograph to compare different settings and keep exploring the trade-offs."
                : "Now the camera stops holding your hand. Balance each scene and choose which visual cost you can accept."}</p>
            </div>
            <button type="button" onClick={reviewTutorials}>Review tutorials</button>
          </div>
          <SimulatorApp onAllChallengesCompleteChange={setAllChallengesComplete} />
        </section>
      ) : (
        <GuidedTutorial
          key={TUTORIALS[lessonIndex].id}
          lesson={TUTORIALS[lessonIndex]}
          lessonIndex={lessonIndex}
          isPreviouslyComplete={completedLessonIds.has(TUTORIALS[lessonIndex].id)}
          onLessonComplete={() => recordLessonComplete(TUTORIALS[lessonIndex].id)}
          completedLessonIds={completedLessonIds}
          navigableLessonIds={navigableLessonIds}
          onNavigate={navigateToLesson}
        />
      )}
    </>
  );
}
