import { describe, expect, it } from "vitest";
import { assessSettings } from "./explain";
import { unacceptableQualityKeys } from "./quality";
import { isValidSettings } from "./settings";
import { TUTORIALS } from "./tutorials";

describe("TUTORIALS standard answers", () => {
  it("provides a valid, balanced answer that meets every lesson quality goal", () => {
    for (const lesson of TUTORIALS) {
      expect(lesson.answerSettings, `${lesson.id} is missing its standard answer`).toBeDefined();
      expect(isValidSettings(lesson.answerSettings!), `${lesson.id} has an invalid standard answer`).toBe(true);
      const assessment = assessSettings({ settings: lesson.answerSettings!, scene: lesson });
      expect(assessment.exposure, `${lesson.id} answer is not balanced`).toBe("balanced");
      expect(unacceptableQualityKeys(assessment, lesson.qualityTargets), `${lesson.id} answer misses a quality goal`).toEqual([]);
    }
  });

  it("keeps the cyclist sharp at the 1/125s standard answer", () => {
    const lesson = TUTORIALS.find((item) => item.id === "tutorial-two-dials")!;
    const assessment = assessSettings({ settings: lesson.answerSettings!, scene: lesson });
    expect(assessment.motionBlur).toBe("frozen");
  });
});
