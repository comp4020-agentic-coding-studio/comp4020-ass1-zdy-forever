import { SCENES } from "../domain/scenes";
import { ExposureTriangleDiagram } from "./ExposureTriangleDiagram";

export function Opening() {
  return (
    <section className="opening" aria-labelledby="opening-heading">
      <div className="opening__copy">
        <h2 id="opening-heading">Light is a budget, not a switch</h2>
        <p>
          Every photo needs the same amount of light to land correctly exposed. A camera has exactly three dials for
          spending that light — ISO, aperture, and shutter speed — and none of them is free. Raise one to brighten
          the shot and something else in the frame pays for it: grain creeps into shadows, the background swims out
          of focus, or a moving subject smears into a streak.
        </p>
        <p>
          The diagram below has no camera behind it yet — it's just the shape of the trade-off. Below it, four
          scenes let you feel the same trade-off change depending on what's actually in the frame.
        </p>
      </div>
      <ExposureTriangleDiagram />
      <ul className="opening__scenes">
        {SCENES.map((scene) => (
          <li key={scene.id} className="opening__scene">
            <span className="opening__scene-title">{scene.title}</span>
            <span className="opening__scene-description">{scene.description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
