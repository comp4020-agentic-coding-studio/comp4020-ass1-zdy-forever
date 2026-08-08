// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AwardScreen } from "./AwardScreen";

afterEach(cleanup);

describe("AwardScreen", () => {
  it("celebrates completion and names the learned controls", () => {
    render(<AwardScreen onReviewChallenges={vi.fn()} onReviewTutorials={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /Congratulations/ })).toBeInTheDocument();
    expect(screen.getByText("ISO · Aperture · Shutter speed")).toBeInTheDocument();
  });

  it("keeps both review paths available", async () => {
    const onReviewChallenges = vi.fn();
    const onReviewTutorials = vi.fn();
    const user = userEvent.setup();
    render(<AwardScreen onReviewChallenges={onReviewChallenges} onReviewTutorials={onReviewTutorials} />);

    await user.click(screen.getByRole("button", { name: "Review challenges" }));
    await user.click(screen.getByRole("button", { name: "Review tutorials" }));
    expect(onReviewChallenges).toHaveBeenCalledOnce();
    expect(onReviewTutorials).toHaveBeenCalledOnce();
  });
});
