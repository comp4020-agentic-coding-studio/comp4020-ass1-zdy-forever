// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TUTORIALS } from "../domain/tutorials";
import { TutorialConceptAnimation } from "./TutorialConceptAnimation";

afterEach(cleanup);

describe("TutorialConceptAnimation", () => {
  it("provides a distinct accessible explanation for every lesson", () => {
    const labels = TUTORIALS.map((lesson) => {
      const { unmount } = render(<TutorialConceptAnimation lessonId={lesson.id} />);
      const label = screen.getByRole("img").getAttribute("aria-label");
      expect(screen.queryByText("Current setting")).not.toBeInTheDocument();
      unmount();
      return label;
    });
    expect(new Set(labels).size).toBe(TUTORIALS.length);
  });
});
