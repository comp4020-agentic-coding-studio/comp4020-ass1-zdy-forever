// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnswerCard } from "./AnswerCard";

afterEach(cleanup);

describe("AnswerCard", () => {
  it("keeps the answer hidden until requested and can apply it", () => {
    const onApply = vi.fn();
    render(<AnswerCard settings={{ iso: 400, aperture: 4, shutterSeconds: 1 / 125 }} onApply={onApply} />);

    expect(screen.queryByText("ISO 400, f/4, 1/125s")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Standard answer/ }));
    expect(screen.getByText("ISO 400, f/4, 1/125s")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Apply this answer" }));
    expect(onApply).toHaveBeenCalledOnce();
  });
});
