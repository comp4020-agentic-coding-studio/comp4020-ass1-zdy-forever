import type { KeyboardEvent } from "react";
import type { SceneDefinition } from "../domain/types";

export type SceneSelectorProps = {
  scenes: readonly SceneDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
};

// Follows the ARIA radiogroup authoring pattern: only the checked option is
// in the tab order, and arrow keys move both focus and selection between
// options (wrapping at the ends) rather than tabbing through every option.
export function SceneSelector({ scenes, selectedId, onSelect }: SceneSelectorProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % scenes.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + scenes.length) % scenes.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = scenes.length - 1;
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
        return (
          <button
            key={scene.id}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={selected ? "scene-selector__option scene-selector__option--selected" : "scene-selector__option"}
            onClick={() => onSelect(scene.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className="scene-selector__title">{scene.title}</span>
            <span className="scene-selector__description">{scene.description}</span>
          </button>
        );
      })}
    </div>
  );
}
