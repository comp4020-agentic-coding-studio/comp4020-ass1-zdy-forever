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
    sourceImage: "./scenes/portrait/source-ai.webp",
    subjectMask: "./scenes/portrait/subject-mask-ai.svg",
    depthMap: "./scenes/portrait/depth-map-ai.svg",
    focusDepth: 0.15,
    baseSettings: { iso: 200, aperture: 4, shutterSeconds: 1 / 125 },
    answerSettings: { iso: 100, aperture: 1.4, shutterSeconds: 1 / 500 },
    qualityTargets: {
      noise: ["minimal", "low"],
      depthOfField: ["shallow", "very-shallow"],
      motionBlur: ["frozen", "slight"],
    },
  },
  {
    id: "motion",
    title: "Moving subject",
    description:
      "A subject in motion against a static scene — shutter speed decides whether it freezes or streaks.",
    sourceImage: "./scenes/motion/source-ai.webp",
    motionMask: "./scenes/motion/motion-mask-ai.svg",
    motionVector: { x: 1, y: 0 },
    baseSettings: { iso: 400, aperture: 5.6, shutterSeconds: 1 / 500 },
    answerSettings: { iso: 400, aperture: 5.6, shutterSeconds: 1 / 500 },
    qualityTargets: {
      noise: ["minimal", "low", "moderate"],
      motionBlur: ["frozen", "slight"],
    },
  },
  {
    id: "night",
    title: "Night street",
    description:
      "Low light forces a three-way trade-off between ISO noise, a wide aperture, and a slow shutter.",
    sourceImage: "./scenes/night/source-ai.webp",
    depthMap: "./scenes/night/depth-map-ai.svg",
    focusDepth: 0.4,
    baseSettings: { iso: 1600, aperture: 2.8, shutterSeconds: 1 / 30 },
    answerSettings: { iso: 1600, aperture: 2.8, shutterSeconds: 1 / 30 },
    qualityTargets: {
      noise: ["minimal", "low", "moderate"],
      motionBlur: ["frozen", "slight", "visible"],
    },
  },
  {
    id: "landscape",
    title: "Landscape",
    description: "A wide, deep scene where the whole frame usually needs to stay in focus.",
    sourceImage: "./scenes/landscape/source-ai.webp",
    depthMap: "./scenes/landscape/depth-map-ai.svg",
    focusDepth: 0.6,
    baseSettings: { iso: 100, aperture: 8, shutterSeconds: 1 / 250 },
    answerSettings: { iso: 100, aperture: 8, shutterSeconds: 1 / 250 },
    qualityTargets: {
      noise: ["minimal", "low"],
      depthOfField: ["very-deep", "deep"],
      motionBlur: ["frozen", "slight"],
    },
  },
];

export function getScene(id: string): SceneDefinition | undefined {
  return SCENES.find((scene) => scene.id === id);
}

export const DEFAULT_SCENE_ID = SCENES[0].id;
