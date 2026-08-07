import { describe, expect, it } from "vitest";
import { isValidSettings } from "./settings";
import { assessSettings } from "./explain";
import { unacceptableQualityKeys } from "./quality";
import { DEFAULT_SCENE_ID, SCENES, getScene } from "./scenes";

describe("SCENES", () => {
  it("has exactly four scenes", () => {
    expect(SCENES).toHaveLength(4);
  });

  it("has unique ids", () => {
    const ids = SCENES.map((scene) => scene.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers portrait, motion, night, and landscape", () => {
    const ids = SCENES.map((scene) => scene.id).sort();
    expect(ids).toEqual(["landscape", "motion", "night", "portrait"]);
  });

  it("gives every scene a base settings combination on the allowed value tables", () => {
    for (const scene of SCENES) {
      expect(isValidSettings(scene.baseSettings), `${scene.id} has an invalid base setting`).toBe(true);
    }
  });

  it("gives every scene a valid standard answer that clears its goals", () => {
    for (const scene of SCENES) {
      expect(scene.answerSettings, `${scene.id} is missing its standard answer`).toBeDefined();
      expect(isValidSettings(scene.answerSettings!), `${scene.id} has an invalid standard answer`).toBe(true);
      const assessment = assessSettings({ settings: scene.answerSettings!, scene });
      expect(assessment.exposure, `${scene.id} answer is not balanced`).toBe("balanced");
      expect(unacceptableQualityKeys(assessment, scene.qualityTargets), `${scene.id} answer misses a quality goal`).toEqual([]);
    }
  });

  it("keeps any focusDepth within [0, 1]", () => {
    for (const scene of SCENES) {
      if (scene.focusDepth !== undefined) {
        expect(scene.focusDepth).toBeGreaterThanOrEqual(0);
        expect(scene.focusDepth).toBeLessThanOrEqual(1);
      }
    }
  });

  it("gives every scene a non-empty title and description", () => {
    for (const scene of SCENES) {
      expect(scene.title.length).toBeGreaterThan(0);
      expect(scene.description.length).toBeGreaterThan(0);
    }
  });
});

describe("getScene", () => {
  it("finds a scene by id", () => {
    expect(getScene("portrait")?.id).toBe("portrait");
  });

  it("returns undefined for an unknown id", () => {
    expect(getScene("nonexistent")).toBeUndefined();
  });
});

describe("DEFAULT_SCENE_ID", () => {
  it("points at a real scene", () => {
    expect(getScene(DEFAULT_SCENE_ID)).toBeDefined();
  });
});
