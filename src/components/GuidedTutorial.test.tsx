// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PixelImage } from "../domain/types";
import { TUTORIALS } from "../domain/tutorials";
import { GuidedTutorial } from "./GuidedTutorial";

vi.mock("../browser/loadPixelImage", () => ({
  loadPixelImage: vi.fn(async (): Promise<PixelImage> => ({
    width: 4,
    height: 4,
    data: new Uint8ClampedArray(4 * 4 * 4).fill(128),
  })),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GuidedTutorial", () => {
  it("starts with only the lesson's single variable enabled", async () => {
    render(<GuidedTutorial lesson={TUTORIALS[0]} lessonIndex={0} onContinue={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText("Rendering…")).not.toBeInTheDocument());
    expect(screen.getByRole("slider", { name: "ISO" })).toBeEnabled();
    expect(screen.getByRole("slider", { name: "Aperture" })).toBeDisabled();
    expect(screen.getByRole("slider", { name: "Shutter speed" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continue to next lesson →" })).toBeDisabled();
  });

  it("keeps the detailed trade-off in an optional disclosure", async () => {
    const user = userEvent.setup();
    render(<GuidedTutorial lesson={TUTORIALS[0]} lessonIndex={0} onContinue={vi.fn()} />);
    const summary = screen.getByText("Why this matters");
    const details = summary.closest("details");

    expect(details).not.toHaveAttribute("open");
    await user.click(summary);
    expect(details).toHaveAttribute("open");
    expect(screen.getByText(/Higher ISO reveals the scene/)).toBeInTheDocument();
  });

  it("unlocks continue after the available control is used to balance exposure", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const onLessonComplete = vi.fn();
    render(
      <GuidedTutorial
        lesson={TUTORIALS[0]}
        lessonIndex={0}
        onLessonComplete={onLessonComplete}
        onContinue={onContinue}
      />,
    );
    await waitFor(() => expect(screen.queryByText("Rendering…")).not.toBeInTheDocument());

    const increaseIso = screen.getByRole("button", { name: "Increase ISO" });
    for (let step = 0; step < 4; step++) await user.click(increaseIso);

    const continueButton = screen.getByRole("button", { name: "Continue to next lesson →" });
    expect(continueButton).toBeEnabled();
    expect(screen.getByText("Lesson complete!")).toBeInTheDocument();
    expect(onLessonComplete).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Decrease ISO" }));
    expect(screen.getByText("dark")).toBeInTheDocument();
    expect(screen.getByText(/Lesson recorded/)).toBeInTheDocument();
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("keeps a previously completed lesson open for exploration", async () => {
    render(
      <GuidedTutorial
        lesson={TUTORIALS[0]}
        lessonIndex={0}
        isPreviouslyComplete
        onContinue={vi.fn()}
      />,
    );
    await waitFor(() => expect(screen.queryByText("Rendering…")).not.toBeInTheDocument());

    expect(screen.getByText(/Lesson recorded/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to next lesson →" })).toBeEnabled();
  });

  it("navigates directly between completed lessons while locked lessons stay unavailable", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const completed = new Set([TUTORIALS[0].id, TUTORIALS[1].id]);
    const navigable = new Set([...completed, TUTORIALS[2].id]);
    render(
      <GuidedTutorial
        lesson={TUTORIALS[0]}
        lessonIndex={0}
        isPreviouslyComplete
        completedLessonIds={completed}
        navigableLessonIds={navigable}
        onNavigate={onNavigate}
        onContinue={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aperture — completed" }));
    expect(onNavigate).toHaveBeenCalledWith(1);
    expect(screen.getByRole("button", { name: "Shutter speed — available" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "ISO + shutter — locked" })).toBeDisabled();
  });

  it("reveals and applies the lesson's standard answer", async () => {
    const user = userEvent.setup();
    render(<GuidedTutorial lesson={TUTORIALS[0]} lessonIndex={0} onContinue={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText("Rendering…")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Standard answer/ }));
    expect(screen.getByText("ISO 1600, f/4, 1/60s")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply this answer" }));

    expect(screen.getAllByText("ISO 1600").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Continue to next lesson →" })).toBeEnabled();
  });

  it("does not pass a balanced exposure with unacceptable image quality", async () => {
    const user = userEvent.setup();
    const strictMotionLesson = {
      ...TUTORIALS[3],
      qualityTargets: { ...TUTORIALS[3].qualityTargets, motionBlur: ["frozen"] as const },
    };
    render(<GuidedTutorial lesson={strictMotionLesson} lessonIndex={3} onContinue={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText("Rendering…")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Increase ISO" }));
    await user.click(screen.getByRole("button", { name: "Decrease ISO" }));
    const slowerShutter = screen.getByRole("button", { name: "Increase Shutter speed" });
    for (let step = 0; step < 7; step++) await user.click(slowerShutter);

    expect(screen.getByText("balanced")).toBeInTheDocument();
    expect(screen.getByText(/motion blur is too compromised/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to next lesson →" })).toBeDisabled();
  });

  it("uses a different source photograph for every lesson", () => {
    expect(new Set(TUTORIALS.map((lesson) => lesson.sourceImage)).size).toBe(TUTORIALS.length);
  });
});
