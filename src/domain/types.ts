export type CameraSettings = {
  iso: number;
  aperture: number;
  shutterSeconds: number;
};

export type SceneDefinition = {
  id: string;
  title: string;
  description: string;
  sourceImage: string;
  subjectMask?: string;
  depthMap?: string;
  motionMask?: string;
  motionVector?: {
    x: number;
    y: number;
  };
  focusDepth?: number;
  baseSettings: CameraSettings;
  handheldThreshold?: number;
};

export type ExposureLevel = "very-dark" | "dark" | "balanced" | "bright" | "clipped";
export type NoiseLevel = "minimal" | "low" | "moderate" | "strong" | "severe";
export type DepthOfFieldLevel = "very-shallow" | "shallow" | "moderate" | "deep" | "very-deep";
export type MotionBlurLevel = "frozen" | "slight" | "visible" | "strong" | "extreme";

export type Assessment = {
  exposure: ExposureLevel;
  noise: NoiseLevel;
  depthOfField: DepthOfFieldLevel;
  motionBlur: MotionBlurLevel;
  messages: string[];
};

export type AlbumExperiment = {
  id: string;
  capturedAt: number;
  order: number;
  sceneId: string;
  sceneTitle: string;
  settings: CameraSettings;
  totalExposureStops: number;
  imageBlob: Blob;
  imageUrl: string;
  assessment: Assessment;
};

// Plain pixel buffer shape, deliberately not `ImageData` itself so the
// processing pipeline can be unit-tested with tiny synthetic fixtures in
// Node, with no browser Canvas required. A real ImageData satisfies this
// shape structurally.
export type PixelImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};
