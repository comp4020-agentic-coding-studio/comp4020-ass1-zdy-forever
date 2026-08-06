// One-off dev-time generator: renders simple illustrated scene layers (source
// image, subject mask, depth map, motion mask) as inline SVG and screenshots
// them to public/scenes/**/*.png with Playwright's already-installed
// Chromium. Not part of `pnpm build`/`pnpm check` — run manually with:
//   node scripts/generate-scene-assets.ts
// Re-run and commit the resulting PNGs whenever a layout constant below
// changes.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_ROOT = path.resolve(__dirname, "..", "public", "scenes");

const WIDTH = 960;
const HEIGHT = 640;

function htmlPage(bodyInnerHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><style>html,body{margin:0;padding:0;}svg{display:block;}</style></head><body>${bodyInnerHtml}</body></html>`;
}

function svg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${inner}</svg>`;
}

type Layer = { fileName: string; markup: string };
type Scene = { id: string; layers: Layer[] };

// ---------- Portrait ----------

const PORTRAIT_HEAD = { cx: 480, cy: 250, r: 90 };
const PORTRAIT_SHOULDERS = "M 300 640 C 300 470 380 350 480 350 C 580 350 660 470 660 640 Z";

function portraitSource(): string {
  return svg(`
    <defs>
      <filter id="bgBlur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#f4ecdd" />
    <g opacity="0.55" filter="url(#bgBlur)">
      <circle cx="140" cy="180" r="70" fill="#8a9b6e" />
      <circle cx="230" cy="230" r="50" fill="#7c8a5e" />
      <circle cx="820" cy="160" r="80" fill="#8a9b6e" />
      <circle cx="880" cy="270" r="55" fill="#7c8a5e" />
      <rect x="0" y="430" width="${WIDTH}" height="210" fill="#cabf9e" />
      <circle cx="60" cy="470" r="40" fill="#b7ab86" />
      <circle cx="900" cy="500" r="46" fill="#b7ab86" />
    </g>
    <path d="${PORTRAIT_SHOULDERS}" fill="#b3512f" stroke="#33302a" stroke-width="5" />
    <circle cx="${PORTRAIT_HEAD.cx}" cy="${PORTRAIT_HEAD.cy}" r="${PORTRAIT_HEAD.r}" fill="#d9a173" stroke="#33302a" stroke-width="5" />
    <path d="M 425 240 Q 452 215 479 240" fill="none" stroke="#33302a" stroke-width="4" opacity="0.6" />
    <path d="M 481 240 Q 508 215 535 240" fill="none" stroke="#33302a" stroke-width="4" opacity="0.6" />
    <circle cx="452" cy="255" r="6" fill="#33302a" />
    <circle cx="508" cy="255" r="6" fill="#33302a" />
    <path d="M 455 300 Q 480 316 505 300" fill="none" stroke="#33302a" stroke-width="4" stroke-linecap="round" />
  `);
}

function portraitSubjectMask(): string {
  return svg(`
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#000000" />
    <path d="${PORTRAIT_SHOULDERS}" fill="#ffffff" />
    <circle cx="${PORTRAIT_HEAD.cx}" cy="${PORTRAIT_HEAD.cy}" r="${PORTRAIT_HEAD.r}" fill="#ffffff" />
  `);
}

function portraitDepthMap(): string {
  return svg(`
    <defs>
      <radialGradient id="bgDepth" cx="50%" cy="35%" r="75%">
        <stop offset="0%" stop-color="#9a9a9a" />
        <stop offset="100%" stop-color="#f4f4f4" />
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgDepth)" />
    <path d="${PORTRAIT_SHOULDERS}" fill="#141414" />
    <circle cx="${PORTRAIT_HEAD.cx}" cy="${PORTRAIT_HEAD.cy}" r="${PORTRAIT_HEAD.r}" fill="#0a0a0a" />
  `);
}

// ---------- Motion (moving subject) ----------

const RUNNER_MASK_ELLIPSE = { cx: 560, cy: 400, rx: 100, ry: 170 };

function motionBackground(): string {
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#e9e2d0" />
    <rect x="0" y="0" width="${WIDTH}" height="360" fill="#dcd4bd" />
    <rect x="0" y="360" width="${WIDTH}" height="280" fill="#8f8a7c" />
    <rect x="0" y="360" width="${WIDTH}" height="10" fill="#33302a" opacity="0.4" />
    ${[80, 260, 700, 860]
      .map(
        (x, i) =>
          `<rect x="${x}" y="${140 - (i % 2) * 30}" width="120" height="${220 + (i % 2) * 30}" fill="#c9c0a4" stroke="#33302a" stroke-width="3" opacity="0.8" />`,
      )
      .join("")}
    <path d="M 0 610 L ${WIDTH} 610" stroke="#33302a" stroke-width="4" stroke-dasharray="24 18" opacity="0.5" />
  `;
}

function runnerFigure(): string {
  return `
    <g stroke="#33302a" stroke-width="6" stroke-linecap="round" fill="none">
      <path d="M 560 300 L 545 360" />
      <path d="M 545 360 L 500 340" />
      <path d="M 545 360 L 595 385" />
      <path d="M 545 360 L 520 460" />
      <path d="M 520 460 L 495 555" />
      <path d="M 545 360 L 575 450" />
      <path d="M 575 450 L 615 520" />
    </g>
    <circle cx="560" cy="278" r="26" fill="#d9a173" stroke="#33302a" stroke-width="5" />
    <path d="M 520 460 L 480 470" stroke="#33302a" stroke-width="8" stroke-linecap="round" />
    <path d="M 575 450 L 620 435" stroke="#33302a" stroke-width="8" stroke-linecap="round" />
    <path d="M 545 360 L 545 420" stroke="#b3512f" stroke-width="26" stroke-linecap="round" />
  `;
}

function motionSource(): string {
  return svg(`${motionBackground()}${runnerFigure()}`);
}

function motionMask(): string {
  return svg(`
    <defs>
      <filter id="feather" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="16" />
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#000000" />
    <ellipse cx="${RUNNER_MASK_ELLIPSE.cx}" cy="${RUNNER_MASK_ELLIPSE.cy}" rx="${RUNNER_MASK_ELLIPSE.rx}" ry="${RUNNER_MASK_ELLIPSE.ry}" fill="#ffffff" filter="url(#feather)" />
  `);
}

// ---------- Night street ----------

const NIGHT_HORIZON_Y = 320;

const NIGHT_BUILDINGS = [
  { x: 0, width: 150, top: 120 },
  { x: 140, width: 110, top: 60 },
  { x: 260, width: 160, top: 150 },
  { x: 430, width: 120, top: 90 },
  { x: 560, width: 180, top: 130 },
  { x: 730, width: 130, top: 70 },
  { x: 850, width: 110, top: 160 },
];

function nightBuilding(building: (typeof NIGHT_BUILDINGS)[number], seed: number): string {
  const { x, width, top } = building;
  const height = NIGHT_HORIZON_Y - top;
  const columns = Math.max(2, Math.floor(width / 45));
  const rows = Math.max(2, Math.floor(height / 45));
  const windows = Array.from({ length: columns * rows }, (_, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const wx = x + 18 + col * ((width - 36) / Math.max(1, columns - 1) || width);
    const wy = top + 24 + row * ((height - 48) / Math.max(1, rows - 1) || height);
    const lit = (col + row + seed) % 3 !== 0;
    return lit
      ? `<circle cx="${wx}" cy="${wy}" r="16" fill="#e8b34a" opacity="0.3" filter="url(#glow)" /><rect x="${wx - 7}" y="${wy - 7}" width="14" height="14" fill="#f0c56a" />`
      : `<rect x="${wx - 7}" y="${wy - 7}" width="14" height="14" fill="#454b66" opacity="0.8" />`;
  }).join("");
  return `<rect x="${x}" y="${top}" width="${width}" height="${height}" fill="#242a42" stroke="#13152180" stroke-width="2" />${windows}`;
}

function nightSource(): string {
  const skyline = NIGHT_BUILDINGS.map((building, i) => nightBuilding(building, i)).join("");
  return svg(`
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#14172a" />
        <stop offset="100%" stop-color="#333c5c" />
      </linearGradient>
      <linearGradient id="street" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a2733" />
        <stop offset="100%" stop-color="#100f14" />
      </linearGradient>
      <filter id="glow" x="-150%" y="-150%" width="400%" height="400%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${NIGHT_HORIZON_Y}" fill="url(#sky)" />
    ${skyline}
    <rect x="0" y="${NIGHT_HORIZON_Y}" width="${WIDTH}" height="${HEIGHT - NIGHT_HORIZON_Y}" fill="url(#street)" />
    <path d="M ${WIDTH / 2 - 40} ${NIGHT_HORIZON_Y} L 40 ${HEIGHT} L ${WIDTH / 2} ${HEIGHT} Z" fill="#39394a" opacity="0.35" />
    <path d="M ${WIDTH / 2 + 40} ${NIGHT_HORIZON_Y} L ${WIDTH - 40} ${HEIGHT} L ${WIDTH / 2} ${HEIGHT} Z" fill="#39394a" opacity="0.35" />
    <path d="M ${WIDTH / 2 - 8} ${NIGHT_HORIZON_Y + 20} L ${WIDTH / 2 - 60} ${HEIGHT} M ${WIDTH / 2 + 8} ${NIGHT_HORIZON_Y + 20} L ${WIDTH / 2 + 60} ${HEIGHT}" stroke="#e8b34a" stroke-width="3" stroke-dasharray="20 22" opacity="0.5" />
    <line x1="120" y1="${NIGHT_HORIZON_Y}" x2="120" y2="${NIGHT_HORIZON_Y + 190}" stroke="#403a2c" stroke-width="7" />
    <circle cx="120" cy="${NIGHT_HORIZON_Y + 185}" r="15" fill="#f0c56a" />
    <ellipse cx="120" cy="${NIGHT_HORIZON_Y + 185}" rx="70" ry="50" fill="#e8b34a" opacity="0.22" filter="url(#glow)" />
    <ellipse cx="120" cy="${HEIGHT - 20}" rx="90" ry="26" fill="#e8b34a" opacity="0.14" filter="url(#glow)" />
  `);
}

function nightDepthMap(): string {
  return svg(`
    <defs>
      <linearGradient id="depth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f4f4f4" />
        <stop offset="${(NIGHT_HORIZON_Y / HEIGHT) * 100}%" stop-color="#c8c8c8" />
        <stop offset="100%" stop-color="#141414" />
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#depth)" />
  `);
}

// ---------- Landscape ----------

const BACK_RIDGE = "M 0 320 L 160 250 320 300 480 240 640 290 800 230 960 300 L 960 380 L 0 380 Z";
const MID_RIDGE = "M 0 400 L 200 320 420 380 620 300 820 360 960 320 L 960 460 L 0 460 Z";
const FRONT_RIDGE = "M 0 470 L 180 420 380 480 600 410 780 470 960 430 L 960 560 L 0 560 Z";

function landscapeSource(): string {
  return svg(`
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#eadfc4" />
        <stop offset="100%" stop-color="#f6ede0" />
      </linearGradient>
      <filter id="sunGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)" />
    <circle cx="740" cy="150" r="70" fill="#e8b34a" opacity="0.35" filter="url(#sunGlow)" />
    <circle cx="740" cy="150" r="42" fill="#e8b34a" />
    <path d="${BACK_RIDGE}" fill="#b9c2ae" opacity="0.7" />
    <path d="${MID_RIDGE}" fill="#8ba07f" opacity="0.85" />
    <path d="${FRONT_RIDGE}" fill="#5f7a56" stroke="#33302a" stroke-width="4" />
    <rect x="0" y="560" width="${WIDTH}" height="80" fill="#4c5e3f" />
    ${Array.from(
      { length: 24 },
      (_, i) => `<path d="M ${20 + i * 40} 630 L ${14 + i * 40} 600" stroke="#33302a" stroke-width="3" opacity="0.5" />`,
    ).join("")}
  `);
}

function landscapeDepthMap(): string {
  return svg(`
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#f6f6f6" />
    <path d="${BACK_RIDGE}" fill="#c2c2c2" />
    <path d="${MID_RIDGE}" fill="#7a7a7a" />
    <path d="${FRONT_RIDGE}" fill="#3c3c3c" />
    <rect x="0" y="560" width="${WIDTH}" height="80" fill="#101010" />
  `);
}

const SCENES: Scene[] = [
  {
    id: "portrait",
    layers: [
      { fileName: "source.png", markup: portraitSource() },
      { fileName: "subject-mask.png", markup: portraitSubjectMask() },
      { fileName: "depth-map.png", markup: portraitDepthMap() },
    ],
  },
  {
    id: "motion",
    layers: [
      { fileName: "source.png", markup: motionSource() },
      { fileName: "motion-mask.png", markup: motionMask() },
    ],
  },
  {
    id: "night",
    layers: [
      { fileName: "source.png", markup: nightSource() },
      { fileName: "depth-map.png", markup: nightDepthMap() },
    ],
  },
  {
    id: "landscape",
    layers: [
      { fileName: "source.png", markup: landscapeSource() },
      { fileName: "depth-map.png", markup: landscapeDepthMap() },
    ],
  },
];

async function main(): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
    for (const scene of SCENES) {
      const sceneDir = path.join(OUTPUT_ROOT, scene.id);
      await mkdir(sceneDir, { recursive: true });
      for (const layer of scene.layers) {
        await page.setContent(htmlPage(layer.markup));
        const outputPath = path.join(sceneDir, layer.fileName);
        await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
        console.log(`wrote ${path.relative(process.cwd(), outputPath)}`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
