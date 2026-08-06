import { describe, expect, it } from "vitest";
import { compareExperiments } from "./compare";
import type { AlbumExperiment, Assessment } from "./types";

function assessment(overrides: Partial<Assessment> = {}): Assessment {
  return {
    exposure: "balanced",
    noise: "minimal",
    depthOfField: "moderate",
    motionBlur: "frozen",
    messages: ["a", "b", "c", "d"],
    ...overrides,
  };
}

function experiment(overrides: Partial<AlbumExperiment> = {}): AlbumExperiment {
  return {
    id: "exp-1",
    capturedAt: 0,
    order: 0,
    sceneId: "portrait",
    sceneTitle: "Portrait",
    settings: { iso: 100, aperture: 4, shutterSeconds: 1 / 125 },
    totalExposureStops: 0,
    imageBlob: new Blob(),
    imageUrl: "blob:fixture",
    assessment: assessment(),
    ...overrides,
  };
}

describe("compareExperiments", () => {
  it("notes similar exposure when both experiments balance the same way", () => {
    const a = experiment();
    const b = experiment({ id: "exp-2" });
    const result = compareExperiments(a, b);
    expect(result.sentences).toContain("Both experiments land at a similar overall exposure.");
  });

  it("names the brighter experiment when exposure differs", () => {
    const a = experiment({ assessment: assessment({ exposure: "bright" }) });
    const b = experiment({ id: "exp-2", assessment: assessment({ exposure: "dark" }) });
    const result = compareExperiments(a, b);
    expect(result.sentences.some((s) => s.includes("first") && s.includes("brighter"))).toBe(true);
  });

  it("flags the noisier experiment", () => {
    const a = experiment({ assessment: assessment({ noise: "severe" }) });
    const b = experiment({ id: "exp-2", assessment: assessment({ noise: "minimal" }) });
    const result = compareExperiments(a, b);
    expect(result.sentences.some((s) => s.includes("first") && s.includes("noise"))).toBe(true);
  });

  it("flags the shallower depth of field", () => {
    const a = experiment({ assessment: assessment({ depthOfField: "very-shallow" }) });
    const b = experiment({ id: "exp-2", assessment: assessment({ depthOfField: "very-deep" }) });
    const result = compareExperiments(a, b);
    expect(result.sentences.some((s) => s.includes("first") && s.includes("depth of field"))).toBe(true);
  });

  it("flags the blurrier experiment", () => {
    const a = experiment({ assessment: assessment({ motionBlur: "extreme" }) });
    const b = experiment({ id: "exp-2", assessment: assessment({ motionBlur: "frozen" }) });
    const result = compareExperiments(a, b);
    expect(result.sentences.some((s) => s.includes("second") === false && s.includes("motion blur"))).toBe(true);
  });

  it("calls out similar brightness with a different photo when exposure matches but DoF or motion differ", () => {
    const a = experiment({
      settings: { iso: 100, aperture: 1.4, shutterSeconds: 1 / 500 },
      totalExposureStops: 0,
      assessment: assessment({ depthOfField: "very-shallow" }),
    });
    const b = experiment({
      id: "exp-2",
      settings: { iso: 400, aperture: 8, shutterSeconds: 1 / 30 },
      totalExposureStops: 0.1,
      assessment: assessment({ depthOfField: "very-deep" }),
    });
    const result = compareExperiments(a, b);
    expect(result.summary).toContain("Similar brightness, different photo");
  });

  it("names concrete settings values when they differ", () => {
    const a = experiment({ settings: { iso: 100, aperture: 4, shutterSeconds: 1 / 125 } });
    const b = experiment({ id: "exp-2", settings: { iso: 3200, aperture: 4, shutterSeconds: 1 / 125 } });
    const result = compareExperiments(a, b);
    expect(result.summary).toContain("3200");
  });

  it("is deterministic for identical inputs", () => {
    const a = experiment();
    const b = experiment({ id: "exp-2", assessment: assessment({ exposure: "bright" }) });
    expect(compareExperiments(a, b)).toEqual(compareExperiments(a, b));
  });
});
