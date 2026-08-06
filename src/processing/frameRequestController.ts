// Guards against stale/out-of-order async results — plain logic, independent
// of React, so it's unit-testable without a component or a DOM. Every call
// to `request` bumps a version counter; if a *newer* request has started by
// the time an older one's `process` resolves, the older call resolves to
// `null` instead of applying stale data. This is what stops a slow frame
// (e.g. a worker still processing a previous slider position) from
// clobbering a newer one that finished first.
export type FrameRequestController<TInput, TOutput> = {
  request(input: TInput): Promise<TOutput | null>;
  currentVersion(): number;
};

export function createFrameRequestController<TInput, TOutput>(
  process: (input: TInput) => Promise<TOutput> | TOutput,
): FrameRequestController<TInput, TOutput> {
  let version = 0;

  async function request(input: TInput): Promise<TOutput | null> {
    version += 1;
    const requestedVersion = version;

    const result = await process(input);

    if (requestedVersion !== version) return null;
    return result;
  }

  return {
    request,
    currentVersion: () => version,
  };
}
