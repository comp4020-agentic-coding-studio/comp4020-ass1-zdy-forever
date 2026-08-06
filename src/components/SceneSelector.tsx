import type { SceneDefinition } from "../domain/types";

export type SceneSelectorProps = {
  scenes: readonly SceneDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function SceneSelector({ scenes, selectedId, onSelect }: SceneSelectorProps) {
  return (
    <div className="scene-selector" role="radiogroup" aria-label="Scene">
      {scenes.map((scene) => {
        const selected = scene.id === selectedId;
        return (
          <button
            key={scene.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={selected ? "scene-selector__option scene-selector__option--selected" : "scene-selector__option"}
            onClick={() => onSelect(scene.id)}
          >
            <span className="scene-selector__title">{scene.title}</span>
            <span className="scene-selector__description">{scene.description}</span>
          </button>
        );
      })}
    </div>
  );
}
