// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SCENES } from "../domain/scenes";
import { Opening } from "./Opening";

afterEach(cleanup);

describe("Opening", () => {
  it("introduces the exposure trade-off and the diagram", () => {
    render(<Opening />);
    expect(screen.getByRole("heading", { name: "Light is a budget, not a switch" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Exposure triangle/ })).toBeInTheDocument();
  });

  it("lists all four scenes as concrete framing", () => {
    render(<Opening />);
    for (const scene of SCENES) {
      expect(screen.getByText(scene.title)).toBeInTheDocument();
    }
  });
});
