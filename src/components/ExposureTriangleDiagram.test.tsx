// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExposureTriangleDiagram } from "./ExposureTriangleDiagram";

afterEach(cleanup);

describe("ExposureTriangleDiagram", () => {
  it("labels all three vertices", () => {
    render(<ExposureTriangleDiagram />);
    expect(screen.getByText("ISO")).toBeInTheDocument();
    expect(screen.getByText("Aperture")).toBeInTheDocument();
    expect(screen.getByText("Shutter")).toBeInTheDocument();
  });

  it("is exposed as a labelled image for assistive tech", () => {
    render(<ExposureTriangleDiagram />);
    expect(screen.getByRole("img", { name: /Exposure triangle/ })).toBeInTheDocument();
  });

  it("sits at the centroid with no stops applied", () => {
    const { container } = render(<ExposureTriangleDiagram />);
    const marker = container.querySelector(".exposure-triangle-diagram__marker");
    expect(marker).toHaveAttribute("cx", "100");
    expect(marker).toHaveAttribute("cy", "96");
  });

  it("moves the marker toward a vertex as that control's stops rise", () => {
    const { container } = render(<ExposureTriangleDiagram isoStops={3} apertureStops={0} shutterStops={0} />);
    const marker = container.querySelector(".exposure-triangle-diagram__marker");
    // ISO's vertex sits above centre (smaller y) — full-weighted ISO stops should pull the marker upward.
    expect(Number(marker?.getAttribute("cy"))).toBeLessThan(96);
  });
});
