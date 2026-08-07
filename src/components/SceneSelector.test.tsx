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

const THREE_SCENES: SceneDefinition[] = [
  ...SCENES,
  {
    id: "c",
    title: "Scene C",
    description: "Third scene",
    sourceImage: "/c.png",
    baseSettings: { iso: 400, aperture: 5.6, shutterSeconds: 1 / 250 },
  },
];

const unlockAll = () => true;
const NO_CLEARED = new Set<string>();

describe("SceneSelector", () => {
  it("renders one option per scene with the selected one checked", () => {
    const { container } = render(<SceneSelector scenes={SCENES} selectedId="a" onSelect={vi.fn()} isUnlocked={unlockAll} clearedIds={NO_CLEARED} />);
    const options = screen.getAllByRole("radio");
    expect(options).toHaveLength(2);
    expect(screen.getByRole("radio", { name: /Scene A/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /Scene B/ })).toHaveAttribute("aria-checked", "false");
    expect(container.querySelectorAll(".scene-selector__media img")).toHaveLength(2);
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("calls onSelect with the clicked scene's id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SceneSelector scenes={SCENES} selectedId="a" onSelect={onSelect} isUnlocked={unlockAll} clearedIds={NO_CLEARED} />);
    await user.click(screen.getByRole("radio", { name: /Scene B/ }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("only tabs to the checked option, per the ARIA radiogroup pattern", () => {
    render(<SceneSelector scenes={SCENES} selectedId="a" onSelect={vi.fn()} isUnlocked={unlockAll} clearedIds={NO_CLEARED} />);
    expect(screen.getByRole("radio", { name: /Scene A/ })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: /Scene B/ })).toHaveAttribute("tabindex", "-1");
  });

  it("selects and moves focus to the next option on ArrowRight, wrapping at the end", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SceneSelector scenes={SCENES} selectedId="b" onSelect={onSelect} isUnlocked={unlockAll} clearedIds={NO_CLEARED} />);
    screen.getByRole("radio", { name: /Scene B/ }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onSelect).toHaveBeenCalledWith("a");
    expect(screen.getByRole("radio", { name: /Scene A/ })).toHaveFocus();
  });

  it("selects the previous option on ArrowLeft, wrapping at the start", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SceneSelector scenes={SCENES} selectedId="a" onSelect={onSelect} isUnlocked={unlockAll} clearedIds={NO_CLEARED} />);
    screen.getByRole("radio", { name: /Scene A/ }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(onSelect).toHaveBeenCalledWith("b");
    expect(screen.getByRole("radio", { name: /Scene B/ })).toHaveFocus();
  });

  it("disables a locked option and never fires onSelect when it's clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const isUnlocked = (id: string) => id !== "b";
    render(<SceneSelector scenes={SCENES} selectedId="a" onSelect={onSelect} isUnlocked={isUnlocked} clearedIds={NO_CLEARED} />);
    const locked = screen.getByRole("radio", { name: /Scene B/ });
    expect(locked).toBeDisabled();
    await user.click(locked);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a lock hint naming the scene that must be cleared first", () => {
    const isUnlocked = (id: string) => id !== "b";
    render(<SceneSelector scenes={SCENES} selectedId="a" onSelect={vi.fn()} isUnlocked={isUnlocked} clearedIds={NO_CLEARED} />);
    expect(screen.getByText(/Locked — clear Scene A first/)).toBeInTheDocument();
  });

  it("shows a cleared badge for cleared scenes without locking them", () => {
    render(
      <SceneSelector
        scenes={SCENES}
        selectedId="a"
        onSelect={vi.fn()}
        isUnlocked={unlockAll}
        clearedIds={new Set(["a"])}
      />,
    );
    const clearedOption = screen.getByRole("radio", { name: /Scene A/ });
    expect(clearedOption).not.toBeDisabled();
    expect(screen.getByText(/Cleared/)).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("skips a locked middle option when navigating with ArrowRight", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const isUnlocked = (id: string) => id !== "b";
    render(
      <SceneSelector scenes={THREE_SCENES} selectedId="a" onSelect={onSelect} isUnlocked={isUnlocked} clearedIds={NO_CLEARED} />,
    );
    // Anchored: the locked Scene B option's own hint text ("clear Scene A
    // first") would otherwise also match a loose /Scene A/ query.
    screen.getByRole("radio", { name: /^Scene A/ }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onSelect).toHaveBeenCalledWith("c");
    expect(screen.getByRole("radio", { name: /^Scene C/ })).toHaveFocus();
  });

  it("End lands on the last unlocked option, not a locked trailing one", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const isUnlocked = (id: string) => id !== "c";
    render(
      <SceneSelector scenes={THREE_SCENES} selectedId="a" onSelect={onSelect} isUnlocked={isUnlocked} clearedIds={NO_CLEARED} />,
    );
    // Anchored for the same reason: the locked Scene C option's hint text
    // ("clear Scene B first") would otherwise also match /Scene B/.
    screen.getByRole("radio", { name: /^Scene A/ }).focus();
    await user.keyboard("{End}");
    expect(onSelect).toHaveBeenCalledWith("b");
    expect(screen.getByRole("radio", { name: /^Scene B/ })).toHaveFocus();
  });
});
