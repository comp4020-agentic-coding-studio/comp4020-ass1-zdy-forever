import type { CameraSettings } from "../domain/types";

export type TutorialConceptAnimationProps = {
  lessonId: string;
  settings: CameraSettings;
};

const ISO_RANGE = [100, 200, 400, 800, 1600, 3200, 6400];
const SHUTTER_RANGE = [1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4];

function normalizedIndex(value: number, values: readonly number[]): number {
  const index = values.findIndex((candidate) => Math.abs(candidate - value) < 0.000001);
  return Math.max(0, index) / (values.length - 1);
}

export function TutorialConceptAnimation({ lessonId, settings }: TutorialConceptAnimationProps) {
  const isoLevel = normalizedIndex(settings.iso, ISO_RANGE);
  const shutterLevel = normalizedIndex(settings.shutterSeconds, SHUTTER_RANGE);
  const apertureLevel = Math.max(0, Math.min(1, (16 - settings.aperture) / 14.6));

  if (lessonId === "tutorial-iso") {
    return (
      <figure className="tutorial-concept tutorial-concept--iso" role="img" aria-label="ISO amplifies the captured signal and increasingly reveals digital noise">
        <svg viewBox="0 0 360 150" aria-hidden="true">
          <g className="tutorial-concept__photons">
            {[0, 1, 2, 3, 4].map((index) => <circle key={index} cx={34 + index * 22} cy={42 + (index % 2) * 42} r="4" />)}
          </g>
          <path className="tutorial-concept__flow" d="M30 75 H155" />
          <rect className="tutorial-concept__sensor" x="155" y="30" width="58" height="90" rx="12" />
          <rect className="tutorial-concept__signal" x="168" y={104 - isoLevel * 55} width="10" height={12 + isoLevel * 55} rx="5" />
          <rect className="tutorial-concept__signal" x="184" y={90 - isoLevel * 38} width="10" height={26 + isoLevel * 38} rx="5" />
          <g className="tutorial-concept__noise" style={{ opacity: 0.12 + isoLevel * 0.88 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => <circle key={index} cx={244 + (index % 3) * 31} cy={40 + Math.floor(index / 3) * 34} r={2 + (index % 2)} />)}
          </g>
          <text x="30" y="132">LIGHT</text><text x="157" y="142">SENSOR</text><text x="244" y="132">GAIN + NOISE</text>
        </svg>
      </figure>
    );
  }

  if (lessonId === "tutorial-aperture") {
    const openingRadius = 12 + apertureLevel * 27;
    return (
      <figure className="tutorial-concept tutorial-concept--aperture" role="img" aria-label="A wider aperture lets more light through the lens and reduces depth of field">
        <svg viewBox="0 0 360 150" aria-hidden="true">
          <g className="tutorial-concept__rays"><path d="M20 48 H132"/><path d="M20 75 H132"/><path d="M20 102 H132"/></g>
          <circle className="tutorial-concept__lens" cx="180" cy="75" r="55" />
          <circle className="tutorial-concept__iris" cx="180" cy="75" r={openingRadius} />
          <g className="tutorial-concept__focused-rays"><path d="M228 48 L330 70"/><path d="M228 75 H330"/><path d="M228 102 L330 80"/></g>
          <text x="20" y="132">INCOMING LIGHT</text><text x="148" y="142">APERTURE</text><text x="276" y="132">FOCUS</text>
        </svg>
      </figure>
    );
  }

  if (lessonId === "tutorial-shutter") {
    const curtainWidth = 62 - shutterLevel * 47;
    return (
      <figure className="tutorial-concept tutorial-concept--shutter" role="img" aria-label="A slower shutter stays open longer and records more subject movement">
        <svg viewBox="0 0 360 150" aria-hidden="true">
          <rect className="tutorial-concept__frame" x="115" y="20" width="130" height="105" rx="12" />
          <rect className="tutorial-concept__curtain" x="116" y="21" width={curtainWidth} height="103" rx="10" />
          <rect className="tutorial-concept__curtain" x={244 - curtainWidth} y="21" width={curtainWidth} height="103" rx="10" />
          <g className="tutorial-concept__runner" style={{ transform: `translateX(${shutterLevel * 26}px)` }}><circle cx="173" cy="57" r="9"/><path d="M173 68 L173 92 M173 76 L155 86 M173 76 L191 84 M173 92 L158 111 M173 92 L190 109"/></g>
          <g className="tutorial-concept__trail" style={{ opacity: shutterLevel }}><path d="M150 57 H95"/><path d="M150 77 H76"/><path d="M150 97 H105"/></g>
          <text x="22" y="137">RECORDED MOTION</text><text x="150" y="142">SHUTTER</text><text x="274" y="137">TIME</text>
        </svg>
      </figure>
    );
  }

  if (lessonId === "tutorial-two-dials") {
    return (
      <figure className="tutorial-concept tutorial-concept--balance" role="img" aria-label="ISO can compensate for the light lost when a faster shutter freezes movement">
        <svg viewBox="0 0 360 150" aria-hidden="true">
          <path className="tutorial-concept__beam" d="M65 86 H295" />
          <path className="tutorial-concept__pivot" d="M180 86 L155 125 H205 Z" />
          <g className="tutorial-concept__dial tutorial-concept__dial--iso"><circle cx="95" cy="69" r="36"/><path d="M95 69 L110 52"/><text x="84" y="74">ISO</text></g>
          <g className="tutorial-concept__dial tutorial-concept__dial--shutter"><circle cx="265" cy="69" r="36"/><path d="M265 69 L278 86"/><text x="246" y="74">TIME</text></g>
          <circle className="tutorial-concept__balance-light" cx={180 + (isoLevel - shutterLevel) * 34} cy="86" r="7" />
          <text x="45" y="137">BRIGHTER SIGNAL</text><text x="238" y="137">FROZEN ACTION</text>
        </svg>
      </figure>
    );
  }

  return (
    <figure className="tutorial-concept tutorial-concept--triangle" role="img" aria-label="ISO, aperture and shutter speed work together to balance exposure">
      <svg viewBox="0 0 360 150" aria-hidden="true">
        <path className="tutorial-concept__triangle" d="M180 20 L76 122 H284 Z" />
        <g className="tutorial-concept__node tutorial-concept__node--iso"><circle cx="180" cy="25" r={11 + isoLevel * 5}/><text x="180" y="29">ISO</text></g>
        <g className="tutorial-concept__node tutorial-concept__node--aperture"><circle cx="79" cy="119" r={11 + apertureLevel * 5}/><text x="79" y="123">A</text></g>
        <g className="tutorial-concept__node tutorial-concept__node--shutter"><circle cx="281" cy="119" r={11 + shutterLevel * 5}/><text x="281" y="123">S</text></g>
        <circle className="tutorial-concept__exposure" cx="180" cy="86" r="18" />
        <path className="tutorial-concept__energy" d="M180 42 L180 67 M96 112 L159 91 M264 112 L201 91" />
        <text x="154" y="91">EXPOSURE</text>
      </svg>
    </figure>
  );
}
