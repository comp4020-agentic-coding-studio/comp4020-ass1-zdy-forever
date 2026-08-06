// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Assessment } from "../domain/types";
import { IndicatorBadges } from "./IndicatorBadges";

afterEach(cleanup);

const ASSESSMENT: Assessment = {
  exposure: "balanced",
  noise: "low",
  depthOfField: "shallow",
  motionBlur: "slight",
  messages: [],
};

describe("IndicatorBadges", () => {
  it("renders a badge for each of the four dimensions with its level", () => {
    render(<IndicatorBadges assessment={ASSESSMENT} />);
    expect(screen.getByText("Exposure")).toBeInTheDocument();
    expect(screen.getByText("balanced")).toBeInTheDocument();
    expect(screen.getByText("Noise")).toBeInTheDocument();
    expect(screen.getByText("low")).toBeInTheDocument();
    expect(screen.getByText("Depth of field")).toBeInTheDocument();
    expect(screen.getByText("shallow")).toBeInTheDocument();
    expect(screen.getByText("Motion blur")).toBeInTheDocument();
    expect(screen.getByText("slight")).toBeInTheDocument();
  });

  it("updates when the assessment changes", () => {
    const { rerender } = render(<IndicatorBadges assessment={ASSESSMENT} />);
    rerender(<IndicatorBadges assessment={{ ...ASSESSMENT, exposure: "clipped" }} />);
    expect(screen.getByText("clipped")).toBeInTheDocument();
    expect(screen.queryByText("balanced")).not.toBeInTheDocument();
  });
});
