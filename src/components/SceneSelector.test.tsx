// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SceneDefinition } from "../domain/types";
import { SceneSelector } from "./SceneSelector";

afterEach(cleanup);

const SCENES: SceneDefinition[] = [
  {
    id: "a",
    title: "Scene A",
    description: "First scene",
    sourceImage: "/a.png",
    baseSettings: { iso: 100, aperture: 4, shutterSeconds: 1 / 125 },
  },
  {
    id: "b",
    title: "Scene B",
    description: "Second scene",
    sourceImage: "/b.png",
    baseSettings: { iso: 200, aperture: 2.8, shutterSeconds: 1 / 60 },
  },
];

describe("SceneSelector", () => {
  it("renders one option per scene with the selected one checked", () => {
    render(<SceneSelector scenes={SCENES} selectedId="a" onSelect={vi.fn()} />);
    const options = screen.getAllByRole("radio");
    expect(options).toHaveLength(2);
    expect(screen.getByRole("radio", { name: /Scene A/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /Scene B/ })).toHaveAttribute("aria-checked", "false");
  });

  it("calls onSelect with the clicked scene's id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SceneSelector scenes={SCENES} selectedId="a" onSelect={onSelect} />);
    await user.click(screen.getByRole("radio", { name: /Scene B/ }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
});
