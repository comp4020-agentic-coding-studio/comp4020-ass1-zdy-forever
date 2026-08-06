import { useEffect, useRef, useState } from "react";
import type { PixelImage } from "../domain/types";
import { downsample } from "./downsample";
import { createFrameRequestController } from "./frameRequestController";
import { runPipeline, type PipelineInput } from "./pipeline";
import type { WorkerRequest, WorkerResponse } from "./worker";

// Reached only while `isInteracting` is true (e.g. mid-drag on a slider):
// processing a quarter-size frame is roughly 16x cheaper, which is what
// keeps a drag responsive on the main thread even without a worker.
const LOW_RES_FACTOR = 4;

function supportsWorker(): boolean {
  return typeof Worker !== "undefined";
}

function createPipelineWorker(): Worker {
  return new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
}

function downsampleInput(input: PipelineInput, factor: number): PipelineInput {
  return {
    ...input,
    source: downsample(input.source, factor),
    depthMap: input.depthMap && downsample(input.depthMap, factor),
    subjectMask: input.subjectMask && downsample(input.subjectMask, factor),
    motionMask: input.motionMask && downsample(input.motionMask, factor),
  };
}

export type ProcessedFrameState = {
  image: PixelImage | null;
  isProcessing: boolean;
};

let nextRequestId = 0;

function dispatchToWorker(worker: Worker, input: PipelineInput): Promise<PixelImage> {
  const requestId = ++nextRequestId;

  return new Promise((resolve) => {
    function handleMessage(event: MessageEvent<WorkerResponse>) {
      if (event.data.requestId !== requestId) return;
      worker.removeEventListener("message", handleMessage);
      resolve(event.data.image);
    }

    worker.addEventListener("message", handleMessage);
    // Structured-clone (copy), deliberately not transferred: `input`'s
    // layers (source/masks) are the scene's shared, reused images, and
    // transferring would detach their buffers on this side after the
    // first frame. Only the freshly-allocated response buffer is
    // transferred, inside worker.ts.
    const message: WorkerRequest = { requestId, input };
    worker.postMessage(message);
  });
}

// Dispatches pipeline runs to a Worker when available, falling back to
// running synchronously on the main thread otherwise (feature-detected, not
// a separate implementation — both paths call the exact same
// `runPipeline`). Guards against stale/out-of-order results with a version
// counter (frameRequestController.ts), and processes a low-resolution
// preview while `isInteracting` is true, settling to a full-resolution
// frame once it becomes false.
export function useProcessedFrame(input: PipelineInput | null, isInteracting: boolean): ProcessedFrameState {
  const [state, setState] = useState<ProcessedFrameState>({ image: null, isProcessing: false });
  const workerRef = useRef<Worker | null>(null);
  const controllerRef = useRef(
    createFrameRequestController<PipelineInput, PixelImage>((frameInput) => {
      const worker = workerRef.current;
      return worker ? dispatchToWorker(worker, frameInput) : runPipeline(frameInput);
    }),
  );

  useEffect(() => {
    if (!supportsWorker()) return;
    const worker = createPipelineWorker();
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!input) {
      setState({ image: null, isProcessing: false });
      return;
    }

    const frameInput = isInteracting ? downsampleInput(input, LOW_RES_FACTOR) : input;
    setState((previous) => ({ image: previous.image, isProcessing: true }));

    let cancelled = false;
    controllerRef.current.request(frameInput).then((result) => {
      if (cancelled || !result) return;
      setState({ image: result, isProcessing: false });
    });

    return () => {
      cancelled = true;
    };
  }, [input, isInteracting]);

  return state;
}
