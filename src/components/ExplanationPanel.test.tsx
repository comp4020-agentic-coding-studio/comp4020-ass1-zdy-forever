// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Assessment } from "../domain/types";
import { ExplanationPanel } from "./ExplanationPanel";

afterEach(cleanup);

const ASSESSMENT: Assessment = {
  exposure: "balanced",
  noise: "low",
  depthOfField: "shallow",
  motionBlur: "slight",
  messages: ["First explanation.", "Second explanation."],
};

describe("ExplanationPanel", () => {
  it("renders every message from the assessment", () => {
    render(<ExplanationPanel assessment={ASSESSMENT} />);
    expect(screen.getByText("First explanation.")).toBeInTheDocument();
    expect(screen.getByText("Second explanation.")).toBeInTheDocument();
  });

  it("is a live region so screen readers announce updates", () => {
    render(<ExplanationPanel assessment={ASSESSMENT} />);
    expect(screen.getByText("First explanation.").closest("[aria-live]")).toBeInTheDocument();
  });
});
