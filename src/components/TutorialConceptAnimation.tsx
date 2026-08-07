import type { ReactNode } from "react";

export type TutorialConceptAnimationProps = {
  lessonId: string;
};

function ConceptShell({ label, title, takeaway, children }: { label: string; title: string; takeaway: string; children: ReactNode }) {
  return (
    <figure className="tutorial-concept" role="img" aria-label={label}>
      <figcaption className="tutorial-concept__heading">
        <strong>{title}</strong>
        <span>{takeaway}</span>
      </figcaption>
      {children}
    </figure>
  );
}

function ScenePreview({ mode, children }: { mode: string; children: ReactNode }) {
  return <div className={`concept-scene concept-scene--${mode}`}><span className="concept-scene__sun" /><span className="concept-scene__mountain" />{children}</div>;
}

export function TutorialConceptAnimation({ lessonId }: TutorialConceptAnimationProps) {
  if (lessonId === "tutorial-iso") {
    return (
      <ConceptShell label="Low ISO gives a darker clean image; high ISO gives a brighter grainier image" title="What ISO changes" takeaway="Higher ISO brightens the signal — it does not gather more light.">
        <div className="concept-before-after">
          <div className="concept-example"><ScenePreview mode="dark"><span className="concept-scene__person" /></ScenePreview><strong>ISO 100</strong><span>Darker · clean</span></div>
          <span className="concept-arrow" aria-hidden="true">→</span>
          <div className="concept-example"><ScenePreview mode="bright-grain"><span className="concept-scene__person" /><span className="concept-scene__grain" /></ScenePreview><strong>ISO 3200</strong><span>Brighter · more grain</span></div>
        </div>
      </ConceptShell>
    );
  }

  if (lessonId === "tutorial-aperture") {
    return (
      <ConceptShell label="A small aperture gives less light and more depth of field; a wide aperture gives more light and a blurred background" title="What aperture changes" takeaway="A wider opening gathers more light, but less of the scene stays in focus.">
        <div className="concept-before-after">
          <div className="concept-example"><div className="concept-lens concept-lens--small"><i /></div><strong>f/16</strong><span>Less light · more in focus</span></div>
          <span className="concept-arrow" aria-hidden="true">→</span>
          <div className="concept-example"><div className="concept-lens concept-lens--wide"><i /></div><strong>f/2</strong><span>More light · soft background</span></div>
        </div>
      </ConceptShell>
    );
  }

  if (lessonId === "tutorial-shutter") {
    return (
      <ConceptShell label="A fast shutter freezes a moving subject; a slow shutter records the subject as a trail" title="What shutter speed changes" takeaway="The longer the shutter stays open, the farther a moving subject travels during the photo.">
        <div className="concept-before-after">
          <div className="concept-example"><div className="concept-motion concept-motion--frozen"><span className="concept-runner">🛹</span></div><strong>1/1000s</strong><span>Short time · frozen</span></div>
          <span className="concept-arrow" aria-hidden="true">→</span>
          <div className="concept-example"><div className="concept-motion concept-motion--trail"><i /><i /><span className="concept-runner">🛹</span></div><strong>1/15s</strong><span>Long time · motion trail</span></div>
        </div>
      </ConceptShell>
    );
  }

  if (lessonId === "tutorial-two-dials") {
    return (
      <ConceptShell label="A faster shutter freezes the cyclist but darkens the photo, so ISO is raised to restore brightness" title="Why two controls work together" takeaway="Use ISO to replace brightness lost when a faster shutter freezes action.">
        <div className="concept-equation">
          <div><span className="concept-equation__icon">🏃</span><strong>Faster shutter</strong><small>Freezes the cyclist</small><b>− less light</b></div>
          <span className="concept-equation__operator">+</span>
          <div><span className="concept-equation__icon">ISO</span><strong>Raise ISO</strong><small>Amplifies brightness</small><b>+ more grain</b></div>
          <span className="concept-equation__operator">=</span>
          <div className="concept-equation__result"><span className="concept-equation__icon">✓</span><strong>Balanced photo</strong><small>Sharp enough, bright enough</small></div>
        </div>
      </ConceptShell>
    );
  }

  return (
    <ConceptShell label="ISO, aperture, and shutter each add brightness while introducing a different visual cost" title="Three ways to change exposure" takeaway="All three can brighten a photo. Choose which visual cost the subject can tolerate.">
      <div className="concept-three">
        <div><span>ISO</span><strong>Brightness</strong><small>Cost: grain</small></div>
        <div><span>Aperture</span><strong>Lens light</strong><small>Cost: depth of field</small></div>
        <div><span>Shutter</span><strong>Exposure time</strong><small>Cost: motion blur</small></div>
        <div className="concept-three__result"><i /><strong>Balanced exposure</strong></div>
      </div>
    </ConceptShell>
  );
}
