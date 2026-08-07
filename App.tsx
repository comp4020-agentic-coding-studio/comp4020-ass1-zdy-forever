import { useEffect, useState } from "react";
import { GuidedTutorial } from "./src/components/GuidedTutorial";
import { Opening } from "./src/components/Opening";
import { SimulatorApp } from "./src/components/SimulatorApp";
import { TUTORIALS } from "./src/domain/tutorials";

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
  const tutorialsComplete = lessonIndex >= TUTORIALS.length;

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

  function continueTutorial() {
    setLessonIndex((current) => {
      const next = Math.min(current + 1, TUTORIALS.length);
      if (next === TUTORIALS.length) {
        try {
          window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
        } catch {
          // Progress persistence is helpful, but never blocks the lesson flow.
        }
      }
      return next;
    });
  }

  function reviewTutorials() {
    try {
      window.localStorage.removeItem(TUTORIAL_STORAGE_KEY);
      window.localStorage.removeItem(LESSON_PROGRESS_STORAGE_KEY);
    } catch {
      // The in-memory state still allows review when storage is unavailable.
    }
    setLessonIndex(0);
    setCompletedLessonIds(new Set());
    setShowIntroduction(true);
  }

  return (
    <>
      {showIntroduction && !tutorialsComplete ? (
        <Opening onStart={() => setShowIntroduction(false)} />
      ) : tutorialsComplete ? (
        <section className="challenge-section" aria-labelledby="challenge-heading">
          <div className="challenge-section__header">
            <div>
              <p className="tutorial__eyebrow">Tutorial complete</p>
              <h2 id="challenge-heading">The challenges are unlocked</h2>
              <p>Now the camera stops holding your hand. Balance each scene and choose which visual cost you can accept.</p>
            </div>
            <button type="button" onClick={reviewTutorials}>Review tutorials</button>
          </div>
          <SimulatorApp />
        </section>
      ) : (
        <GuidedTutorial
          key={TUTORIALS[lessonIndex].id}
          lesson={TUTORIALS[lessonIndex]}
          lessonIndex={lessonIndex}
          isPreviouslyComplete={completedLessonIds.has(TUTORIALS[lessonIndex].id)}
          onLessonComplete={() => recordLessonComplete(TUTORIALS[lessonIndex].id)}
          onContinue={continueTutorial}
          onBack={lessonIndex > 0 ? () => setLessonIndex((current) => current - 1) : undefined}
        />
      )}
    </>
  );
}
