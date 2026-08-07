import { describe, expect, it } from "vitest";
import { assessSettings } from "./explain";
import type { SceneDefinition } from "./types";

const scene: SceneDefinition = {
  id: "test-scene",
  title: "Test scene",
  description: "A fixture scene for domain tests.",
  sourceImage: "/scenes/test/source.png",
  baseSettings: { iso: 100, aperture: 4, shutterSeconds: 1 / 125 },
  focusDepth: 0.3,
};

describe("assessSettings", () => {
  it("reports a balanced exposure at the scene's base settings", () => {
    const assessment = assessSettings({ settings: scene.baseSettings, scene });
    expect(assessment.exposure).toBe("balanced");
    expect(assessment.noise).toBe("minimal");
    expect(assessment.depthOfField).toBe("very-deep");
    expect(assessment.motionBlur).toBe("frozen");
  });

  it("raises noise and brightens exposure when ISO increases", () => {
    const assessment = assessSettings({
      settings: { ...scene.baseSettings, iso: 3200 },
      scene,
    });
    expect(assessment.exposure).not.toBe("very-dark");
    expect(["moderate", "strong", "severe"]).toContain(assessment.noise);
  });

  it("shallows depth of field when aperture opens up", () => {
    const assessment = assessSettings({
      settings: { ...scene.baseSettings, aperture: 1.4 },
      scene,
    });
    expect(["shallow", "very-shallow"]).toContain(assessment.depthOfField);
  });

  it("increases motion blur when shutter slows down", () => {
    const movingScene = { ...scene, motionMask: "/motion.svg", motionVector: { x: 1, y: 0 } };
    const assessment = assessSettings({
      settings: { ...scene.baseSettings, shutterSeconds: 1 },
      scene: movingScene,
    });
    expect(["visible", "strong", "extreme"]).toContain(assessment.motionBlur);
  });

  it("keeps stationary scenes free of motion blur at slow shutter speeds", () => {
    const assessment = assessSettings({ settings: { ...scene.baseSettings, shutterSeconds: 1 }, scene });
    expect(assessment.motionBlur).toBe("frozen");
    expect(assessment.messages).toContainEqual(expect.stringContaining("stationary objects remain sharp"));
  });

  it("produces exactly four concrete, non-empty explanation messages", () => {
    const assessment = assessSettings({ settings: scene.baseSettings, scene });
    expect(assessment.messages).toHaveLength(4);
    for (const message of assessment.messages) {
      expect(message.length).toBeGreaterThan(10);
    }
  });

  it("produces different messages for different settings on the same scene", () => {
    const a = assessSettings({ settings: scene.baseSettings, scene });
    const b = assessSettings({ settings: { ...scene.baseSettings, iso: 6400 }, scene });
    expect(a.messages).not.toEqual(b.messages);
  });

  it("is deterministic for identical inputs", () => {
    const settings = { ...scene.baseSettings, aperture: 2.8, shutterSeconds: 1 / 30 };
    const a = assessSettings({ settings, scene });
    const b = assessSettings({ settings, scene });
    expect(a).toEqual(b);
  });

  it("names the concrete setting value in each message rather than vague filler", () => {
    const assessment = assessSettings({
      settings: { ...scene.baseSettings, iso: 3200 },
      scene,
    });
    expect(assessment.messages.some((m) => m.includes("3200"))).toBe(true);
  });
});
