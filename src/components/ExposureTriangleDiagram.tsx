export type ExposureTriangleDiagramProps = {
  isoStops?: number;
  apertureStops?: number;
  shutterStops?: number;
};

type VertexKey = "iso" | "aperture" | "shutter";

const CENTER = { x: 100, y: 96 };

const VERTICES: Record<VertexKey, { x: number; y: number }> = {
  iso: { x: 100, y: 18 },
  aperture: { x: 26, y: 168 },
  shutter: { x: 174, y: 168 },
};

const VERTEX_COPY: Record<VertexKey, { label: string; cost: string }> = {
  iso: { label: "ISO", cost: "higher = more grain" },
  aperture: { label: "Aperture", cost: "wider = shallower focus" },
  shutter: { label: "Shutter", cost: "slower = more motion blur" },
};

// Purely illustrative: clamps each control's exposure contribution to ±3
// stops and blends that toward the corresponding vertex so the marker drifts
// as settings change. Not a precision instrument — the numeric assessment
// lives in IndicatorBadges/ExplanationPanel.
function weightFromStops(stops: number): number {
  return Math.min(Math.max(stops, -3), 3) / 3;
}

export function ExposureTriangleDiagram({
  isoStops = 0,
  apertureStops = 0,
  shutterStops = 0,
}: ExposureTriangleDiagramProps) {
  const weights: Record<VertexKey, number> = {
    iso: weightFromStops(isoStops),
    aperture: weightFromStops(apertureStops),
    shutter: weightFromStops(shutterStops),
  };

  const markerX =
    CENTER.x +
    (VERTICES.iso.x - CENTER.x) * weights.iso +
    (VERTICES.aperture.x - CENTER.x) * weights.aperture +
    (VERTICES.shutter.x - CENTER.x) * weights.shutter;
  const markerY =
    CENTER.y +
    (VERTICES.iso.y - CENTER.y) * weights.iso +
    (VERTICES.aperture.y - CENTER.y) * weights.aperture +
    (VERTICES.shutter.y - CENTER.y) * weights.shutter;

  const trianglePoints = (Object.keys(VERTICES) as VertexKey[])
    .map((key) => `${VERTICES[key].x},${VERTICES[key].y}`)
    .join(" ");

  return (
    <figure className="exposure-triangle-diagram">
      <svg viewBox="0 -16 200 206" role="img" aria-label="Exposure triangle: ISO, aperture and shutter speed, each trading light for a different cost">
        <polygon className="exposure-triangle-diagram__triangle" points={trianglePoints} />
        {(Object.keys(VERTICES) as VertexKey[]).map((key) => (
          <g key={key} className="exposure-triangle-diagram__vertex">
            <circle cx={VERTICES[key].x} cy={VERTICES[key].y} r={5} />
            <text x={VERTICES[key].x} y={VERTICES[key].y + (key === "iso" ? -14 : 22)} textAnchor="middle" className="exposure-triangle-diagram__label">
              {VERTEX_COPY[key].label}
            </text>
            <text x={VERTICES[key].x} y={VERTICES[key].y + (key === "iso" ? -2 : 36)} textAnchor="middle" className="exposure-triangle-diagram__cost">
              {VERTEX_COPY[key].cost}
            </text>
          </g>
        ))}
        <circle className="exposure-triangle-diagram__marker" cx={markerX} cy={markerY} r={6} />
      </svg>
    </figure>
  );
}
