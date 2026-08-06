import type { SceneDefinition } from "./types";

// Exactly four scenes, per the brief's scope: portrait, moving subject,
// night street, landscape. No scene-specific logic lives outside this data —
// components and the processing pipeline read these fields generically.
export const SCENES: readonly SceneDefinition[] = [
  {
    id: "portrait",
    title: "Portrait",
    description:
      "A still subject against a cluttered background — the classic case for shallow depth of field.",
    sourceImage: "/scenes/portrait/source.png",
    subjectMask: "/scenes/portrait/subject-mask.png",
    depthMap: "/scenes/portrait/depth-map.png",
    focusDepth: 0.15,
    baseSettings: { iso: 200, aperture: 4, shutterSeconds: 1 / 125 },
    handheldThreshold: 60,
  },
  {
    id: "motion",
    title: "Moving subject",
    description:
      "A subject in motion against a static scene — shutter speed decides whether it freezes or streaks.",
    sourceImage: "/scenes/motion/source.png",
    motionMask: "/scenes/motion/motion-mask.png",
    motionVector: { x: 1, y: 0 },
    baseSettings: { iso: 400, aperture: 5.6, shutterSeconds: 1 / 500 },
    handheldThreshold: 250,
  },
  {
    id: "night",
    title: "Night street",
    description:
      "Low light forces a three-way trade-off between ISO noise, a wide aperture, and a slow shutter.",
    sourceImage: "/scenes/night/source.png",
    depthMap: "/scenes/night/depth-map.png",
    focusDepth: 0.4,
    baseSettings: { iso: 1600, aperture: 2.8, shutterSeconds: 1 / 30 },
    handheldThreshold: 30,
  },
  {
    id: "landscape",
    title: "Landscape",
    description: "A wide, deep scene where the whole frame usually needs to stay in focus.",
    sourceImage: "/scenes/landscape/source.png",
    depthMap: "/scenes/landscape/depth-map.png",
    focusDepth: 0.6,
    baseSettings: { iso: 100, aperture: 8, shutterSeconds: 1 / 250 },
    handheldThreshold: 60,
  },
];

export function getScene(id: string): SceneDefinition | undefined {
  return SCENES.find((scene) => scene.id === id);
}

export const DEFAULT_SCENE_ID = SCENES[0].id;
