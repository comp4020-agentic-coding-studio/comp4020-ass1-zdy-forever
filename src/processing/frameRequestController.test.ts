import { describe, expect, it } from "vitest";
import { createFrameRequestController } from "./frameRequestController";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("createFrameRequestController", () => {
  it("resolves a single request with its processed result", async () => {
    const controller = createFrameRequestController((input: number) => input * 2);
    const result = await controller.request(5);
    expect(result).toBe(10);
  });

  it("resolves null for a slow request superseded by a faster, newer one", async () => {
    const slow = createDeferred<number>();
    const controller = createFrameRequestController((input: number) => {
      if (input === 1) return slow.promise;
      return Promise.resolve(input * 10);
    });

    const first = controller.request(1);
    const second = controller.request(2);

    expect(await second).toBe(20);

    slow.resolve(999);
    expect(await first).toBeNull();
  });

  it("lets a request through when it is still the latest by the time it resolves", async () => {
    const deferred = createDeferred<number>();
    const controller = createFrameRequestController(() => deferred.promise);

    const only = controller.request(1);
    deferred.resolve(42);

    expect(await only).toBe(42);
  });

  it("supersedes every earlier in-flight request, not just the immediately previous one", async () => {
    const first = createDeferred<string>();
    const second = createDeferred<string>();
    const controller = createFrameRequestController((input: number) => {
      if (input === 1) return first.promise;
      if (input === 2) return second.promise;
      return Promise.resolve("third");
    });

    const a = controller.request(1);
    const b = controller.request(2);
    const c = controller.request(3);

    expect(await c).toBe("third");

    first.resolve("stale-first");
    second.resolve("stale-second");

    expect(await a).toBeNull();
    expect(await b).toBeNull();
  });

  it("tracks the total number of requests via currentVersion", async () => {
    const controller = createFrameRequestController((input: number) => input);
    await controller.request(1);
    await controller.request(2);
    await controller.request(3);
    expect(controller.currentVersion()).toBe(3);
  });
});
