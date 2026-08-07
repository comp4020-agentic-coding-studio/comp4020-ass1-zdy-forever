import type { KeyboardEvent } from "react";
import type { SceneDefinition } from "../domain/types";

export type SceneSelectorProps = {
  scenes: readonly SceneDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
  isUnlocked: (id: string) => boolean;
  clearedIds: ReadonlySet<string>;
};

// Follows the ARIA radiogroup authoring pattern: only the checked option is
// in the tab order, and arrow keys move both focus and selection between
// options (wrapping at the ends) rather than tabbing through every option.
// Locked options are skipped entirely by that navigation — the first scene
// is always unlocked, so there's always at least one stop to land on.
export function SceneSelector({ scenes, selectedId, onSelect, isUnlocked, clearedIds }: SceneSelectorProps) {
  function nextUnlockedIndex(from: number, direction: 1 | -1): number {
    let index = from;
    for (let step = 0; step < scenes.length; step += 1) {
      index = (index + direction + scenes.length) % scenes.length;
      if (isUnlocked(scenes[index].id)) return index;
    }
    return from;
  }

  function firstUnlockedIndex(direction: 1 | -1): number {
    const start = direction === 1 ? -1 : scenes.length;
    return nextUnlockedIndex(start, direction);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = nextUnlockedIndex(index, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = nextUnlockedIndex(index, -1);
    } else if (event.key === "Home") {
      nextIndex = firstUnlockedIndex(1);
    } else if (event.key === "End") {
      nextIndex = firstUnlockedIndex(-1);
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const next = scenes[nextIndex];
    onSelect(next.id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='radio']")[nextIndex]?.focus();
  }

  return (
    <div className="scene-selector" role="radiogroup" aria-label="Scene">
      {scenes.map((scene, index) => {
        const selected = scene.id === selectedId;
        const unlocked = isUnlocked(scene.id);
        const cleared = clearedIds.has(scene.id);
        const previousTitle = index > 0 ? scenes[index - 1].title : null;
        const classNames = ["scene-selector__option"];
        if (selected) classNames.push("scene-selector__option--selected");
        if (!unlocked) classNames.push("scene-selector__option--locked");
        const status = cleared ? "Completed" : selected ? "In progress" : unlocked ? "Ready" : "Locked";

        return (
          <button
            key={scene.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={!unlocked || undefined}
            disabled={!unlocked}
            tabIndex={selected ? 0 : -1}
            className={classNames.join(" ")}
            onClick={() => onSelect(scene.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className="scene-selector__media" aria-hidden="true">
              <img src={scene.sourceImage} alt="" loading="lazy" decoding="async" />
              <span className="scene-selector__media-overlay">
                <span className="scene-selector__number">{String(index + 1).padStart(2, "0")}</span>
                <span className="scene-selector__status" data-status={status.toLowerCase().replace(" ", "-")}>{status}</span>
              </span>
            </span>
            <span className="scene-selector__content">
              <span className="scene-selector__title">
                {scene.title}
                {cleared && <span className="scene-selector__badge"> ✓ Cleared</span>}
              </span>
              <span className="scene-selector__description">
                {unlocked ? scene.description : `Locked — clear ${previousTitle} first`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
