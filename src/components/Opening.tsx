export type OpeningProps = {
  onStart: () => void;
};

export function Opening({ onStart }: OpeningProps) {
  return (
    <section className="opening" aria-labelledby="opening-heading">
      <div className="opening__intro">
        <p className="tutorial__eyebrow">Before you begin</p>
        <h2 id="opening-heading">Learn how a camera turns light into a photograph</h2>
        <p className="opening__lead">
          This website is a hands-on camera simulator. You will change real camera settings, compare the result with
          the original photograph, and learn why every brighter image comes with a visual trade-off.
        </p>
        <div className="opening__scroll-cue" aria-hidden="true">
          <span />
          Scroll to explore
        </div>
      </div>

      <div className="opening__principles" aria-label="Camera basics">
        <article data-scroll-reveal>
          <span className="opening__step-number" aria-hidden="true">01</span>
          <h3>Exposure means brightness</h3>
          <p className="opening__principle-copy">Too little light makes a photograph dark; too much washes out detail. A balanced exposure keeps useful detail.</p>
        </article>
        <article data-scroll-reveal>
          <span className="opening__step-number" aria-hidden="true">02</span>
          <h3>Three controls share the job</h3>
          <p className="opening__principle-copy">ISO, aperture and shutter speed can all brighten the frame, but they affect noise, focus and motion differently.</p>
        </article>
        <article data-scroll-reveal>
          <span className="opening__step-number" aria-hidden="true">03</span>
          <h3>There is no free setting</h3>
          <p className="opening__principle-copy">The aim is not one perfect number. It is choosing which trade-off best protects the subject you care about.</p>
        </article>
      </div>

      <div className="opening__how-to" data-scroll-reveal>
        <div>
          <h3>How to use the simulator</h3>
          <ol>
            <li>Compare the original and simulated photograph.</li>
            <li>Move the available camera control.</li>
            <li>Watch the exposure badge, image effects and triangle respond.</li>
          </ol>
        </div>
        <button type="button" className="opening__start" onClick={onStart}>Start with ISO →</button>
      </div>
    </section>
  );
}
