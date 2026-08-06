// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AlbumExperiment, Assessment } from "../domain/types";
import { AlbumComparisonView } from "./AlbumComparisonView";

afterEach(cleanup);

function makeAssessment(overrides: Partial<Assessment> = {}): Assessment {
  return {
    exposure: "balanced",
    noise: "low",
    depthOfField: "shallow",
    motionBlur: "frozen",
    messages: [],
    ...overrides,
  };
}

function makeExperiment(overrides: Partial<AlbumExperiment>): AlbumExperiment {
  return {
    id: "a",
    capturedAt: 0,
    order: 0,
    sceneId: "portrait",
    sceneTitle: "Portrait",
    settings: { iso: 200, aperture: 2.8, shutterSeconds: 1 / 125 },
    totalExposureStops: 0,
    imageBlob: new Blob(["fake"], { type: "image/png" }),
    imageUrl: "blob:mock-a",
    assessment: makeAssessment(),
    ...overrides,
  };
}

describe("AlbumComparisonView", () => {
  it("shows both frames with their scene and settings", () => {
    const first = makeExperiment({ id: "a", imageUrl: "blob:mock-a" });
    const second = makeExperiment({
      id: "b",
      imageUrl: "blob:mock-b",
      settings: { iso: 1600, aperture: 2.8, shutterSeconds: 1 / 125 },
      totalExposureStops: 3,
      assessment: makeAssessment({ exposure: "bright" }),
    });

    render(<AlbumComparisonView first={first} second={second} />);

    expect(screen.getByText(/First: Portrait, ISO 200/)).toBeInTheDocument();
    expect(screen.getByText(/Second: Portrait, ISO 1600/)).toBeInTheDocument();
  });

  it("surfaces the domain comparison sentences", () => {
    const first = makeExperiment({ id: "a", assessment: makeAssessment({ exposure: "dark" }) });
    const second = makeExperiment({
      id: "b",
      settings: { iso: 6400, aperture: 2.8, shutterSeconds: 1 / 125 },
      assessment: makeAssessment({ exposure: "bright" }),
    });

    render(<AlbumComparisonView first={first} second={second} />);

    expect(screen.getByText("The second experiment is brighter.")).toBeInTheDocument();
  });
});
