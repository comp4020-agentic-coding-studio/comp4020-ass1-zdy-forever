import type { PixelImage } from "../domain/types";
import { runPipeline, type PipelineInput } from "./pipeline";

export type WorkerRequest = {
  requestId: number;
  input: PipelineInput;
};

export type WorkerResponse = {
  requestId: number;
  image: PixelImage;
};

// Typed as a minimal structural shape rather than via the `webworker` lib
// reference — that lib can't coexist with the app tsconfig's `dom` lib in
// the same program (both declare a conflicting global `self`), so this
// casts instead of pulling in a second, incompatible global scope.
type WorkerGlobal = {
  onmessage: ((event: { data: WorkerRequest }) => void) | null;
  postMessage: (message: WorkerResponse, transfer?: Transferable[]) => void;
};

const workerSelf = self as unknown as WorkerGlobal;

workerSelf.onmessage = (event) => {
  const { requestId, input } = event.data;
  const image = runPipeline(input);
  workerSelf.postMessage({ requestId, image }, [image.data.buffer]);
};
