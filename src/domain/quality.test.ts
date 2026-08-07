import { describe, expect, it } from "vitest";
import { qualityIssueLabels, unacceptableQualityKeys } from "./quality";
import type { Assessment, QualityTargets } from "./types";

const assessment: Assessment = {
  exposure: "balanced",
  noise: "strong",
  depthOfField: "moderate",
  motionBlur: "extreme",
  messages: [],
};

const targets: QualityTargets = {
  noise: ["minimal", "low", "moderate"],
  motionBlur: ["frozen", "slight", "visible"],
};

describe("quality targets", () => {
  it("reports visual costs that exceed a scene's accepted range", () => {
    const issues = unacceptableQualityKeys(assessment, targets);
    expect(issues).toEqual(["noise", "motionBlur"]);
    expect(qualityIssueLabels(issues)).toEqual(["noise", "motion blur"]);
  });

  it("accepts quality levels inside the target range", () => {
    expect(unacceptableQualityKeys({ ...assessment, noise: "low", motionBlur: "slight" }, targets)).toEqual([]);
  });
});
