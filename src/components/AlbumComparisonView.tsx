import { compareExperiments } from "../domain/compare";
import { formatSettings } from "../domain/settings";
import type { AlbumExperiment } from "../domain/types";

export type AlbumComparisonViewProps = {
  first: AlbumExperiment;
  second: AlbumExperiment;
};

export function AlbumComparisonView({ first, second }: AlbumComparisonViewProps) {
  const comparison = compareExperiments(first, second);

  return (
    <section className="album-comparison" aria-label="Experiment comparison">
      <h2>Comparing two experiments</h2>
      <div className="album-comparison__frames">
        {[first, second].map((experiment, index) => (
          <figure key={experiment.id} className="album-comparison__frame">
            <img src={experiment.imageUrl} alt={`${experiment.sceneTitle}, ${formatSettings(experiment.settings)}`} />
            <figcaption>
              {index === 0 ? "First" : "Second"}: {experiment.sceneTitle}, {formatSettings(experiment.settings)}
            </figcaption>
          </figure>
        ))}
      </div>
      <ul className="album-comparison__sentences" aria-live="polite">
        {comparison.sentences.map((sentence) => (
          <li key={sentence}>{sentence}</li>
        ))}
      </ul>
    </section>
  );
}
