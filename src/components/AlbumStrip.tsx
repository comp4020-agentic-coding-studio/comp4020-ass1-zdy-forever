import { formatSettings } from "../domain/settings";
import type { AlbumExperiment } from "../domain/types";
import { ALBUM_CAPACITY } from "../state/useAlbum";

export type AlbumStripProps = {
  experiments: AlbumExperiment[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export function AlbumStrip({ experiments, selectedIds, onToggleSelect, onRemove, onClear }: AlbumStripProps) {
  return (
    <section className="album-strip" aria-label="Saved experiments">
      <div className="album-strip__header">
        <h2>Album ({experiments.length}/{ALBUM_CAPACITY})</h2>
        <button type="button" onClick={onClear} disabled={experiments.length === 0}>
          Clear album
        </button>
      </div>
      {experiments.length === 0 ? (
        <p className="album-strip__empty">Save a frame from the simulator to start comparing settings.</p>
      ) : (
        <ul className="album-strip__list">
          {experiments.map((experiment) => {
            const selected = selectedIds.includes(experiment.id);
            return (
              <li key={experiment.id} className="album-strip__item">
                <button
                  type="button"
                  className={
                    selected
                      ? "album-strip__thumb-button album-strip__thumb-button--selected"
                      : "album-strip__thumb-button"
                  }
                  aria-pressed={selected}
                  onClick={() => onToggleSelect(experiment.id)}
                >
                  <img src={experiment.imageUrl} alt={`${experiment.sceneTitle}, ${formatSettings(experiment.settings)}`} />
                  <span className="album-strip__caption">{formatSettings(experiment.settings)}</span>
                </button>
                <button
                  type="button"
                  className="album-strip__remove"
                  onClick={() => onRemove(experiment.id)}
                  aria-label={`Remove ${experiment.sceneTitle} experiment, ${formatSettings(experiment.settings)}`}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
