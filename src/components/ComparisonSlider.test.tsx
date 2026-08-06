// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PixelImage } from "../domain/types";
import { ComparisonSlider } from "./ComparisonSlider";

afterEach(cleanup);

function makeImage(fill: number): PixelImage {
  return { width: 2, height: 2, data: new Uint8ClampedArray(2 * 2 * 4).fill(fill) };
}

describe("ComparisonSlider", () => {
  it("renders both the original and simulated frames", () => {
    render(
      <ComparisonSlider original={makeImage(10)} simulated={makeImage(200)} isProcessing={false} label="Portrait" />,
    );
    expect(screen.getByRole("img", { name: "Portrait — original" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Portrait — simulated" })).toBeInTheDocument();
  });

  it("starts with the divider centred", () => {
    render(
      <ComparisonSlider original={makeImage(10)} simulated={makeImage(200)} isProcessing={false} label="Portrait" />,
    );
    const handle = screen.getByRole("slider", { name: "Reveal original vs. simulated" });
    expect(handle).toHaveValue("50");
  });

  it("moves the divider when the handle's value changes", () => {
    render(
      <ComparisonSlider original={makeImage(10)} simulated={makeImage(200)} isProcessing={false} label="Portrait" />,
    );
    const handle = screen.getByRole("slider", { name: "Reveal original vs. simulated" });
    fireEvent.change(handle, { target: { value: "80" } });
    expect(handle).toHaveValue("80");
  });

  it("shows the rendering status only on the simulated layer while processing", () => {
    render(<ComparisonSlider original={makeImage(10)} simulated={null} isProcessing label="Portrait" />);
    expect(screen.getByText("Rendering…")).toBeInTheDocument();
  });
});
