import { describe, expect, it, vi } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import type { MapLibre } from "./library";
import { watchWorker } from "./worker-failure";

/** The global dispatcher as the watch uses it: its errors, and an actor on a worker. */
function fakeDispatcher(getActor?: () => unknown) {
  const target = new EventTarget();
  const listeners: ((event: { error: Error }) => void)[] = [];
  const dispatcher = {
    getActor: getActor ?? (() => Promise.resolve({ target })),
    on: (_: string, listener: (event: { error: Error }) => void) => listeners.push(listener),
  };
  return {
    target,
    maplibre: { getGlobalDispatcher: () => dispatcher } as unknown as MapLibre,
    fire: (error = new Error("Worker failed to load")) => {
      for (const listener of listeners) listener({ error });
    },
    listeners,
  };
}

/** What calling a method a later maplibre-gl took out does. */
const noGetActor = () => {
  throw new TypeError("dispatcher.getActor is not a function");
};

describe("watchWorker", () => {
  it("knows nothing until the worker fails", async () => {
    const { maplibre } = fakeDispatcher();
    await nextTask();
    expect(watchWorker(maplibre).failure()).toBeUndefined();
  });

  it("keeps the first failure of a worker that never answered, naming the worker", () => {
    const { maplibre, fire } = fakeDispatcher();
    const watch = watchWorker(maplibre);
    const first = new Error("first");
    fire(first);
    fire(new Error("second"));
    expect(watch.failure()).toMatchObject({
      code: "provider-load-failed",
      message: expect.stringMatching(/worker/i),
      cause: first,
    });
    expect(watch.failure()?.message).not.toMatch(/style/i);
  });

  it("takes an error after an answer for no failure: nothing kept, nobody told", async () => {
    const { maplibre, fire, target } = fakeDispatcher();
    const watch = watchWorker(maplibre);
    const heard = vi.fn();
    watch.whenFails(heard);
    await nextTask();
    target.dispatchEvent(new Event("message"));
    fire();
    expect(watch.failure()).toBeUndefined();
    expect(heard).not.toHaveBeenCalled();
  });

  it("tells those waiting once, however many workers fail", () => {
    const { maplibre, fire } = fakeDispatcher();
    const watch = watchWorker(maplibre);
    const heard = vi.fn();
    watch.whenFails(heard);
    fire();
    fire();
    expect(heard).toHaveBeenCalledTimes(1);
    expect(heard).toHaveBeenCalledWith(watch.failure());
  });

  it("tells nobody after they stop", () => {
    const { maplibre, fire } = fakeDispatcher();
    const watch = watchWorker(maplibre);
    const heard = vi.fn();
    watch.whenFails(heard)();
    fire();
    expect(heard).not.toHaveBeenCalled();
  });

  it("watches once per dispatcher", () => {
    const { maplibre, listeners } = fakeDispatcher();
    expect(watchWorker(maplibre)).toBe(watchWorker(maplibre));
    expect(listeners).toHaveLength(1);
    expect(watchWorker(fakeDispatcher().maplibre)).not.toBe(watchWorker(maplibre));
  });

  it("watches nothing, and never fails, on a maplibre-gl without a global dispatcher", () => {
    const watch = watchWorker({} as MapLibre);
    expect(watch.failure()).toBeUndefined();
    expect(() => watch.whenFails(vi.fn())()).not.toThrow();
  });

  it("takes a rejected getActor for the failure it is: no worker could be made", async () => {
    const cause = new Error("no worker");
    const { maplibre } = fakeDispatcher(() => Promise.reject(cause));
    const watch = watchWorker(maplibre);
    const heard = vi.fn();
    watch.whenFails(heard);
    await nextTask();
    expect(watch.failure()).toMatchObject({ code: "provider-load-failed", cause });
    expect(heard).toHaveBeenCalledWith(watch.failure());
  });

  it.each([
    ["without getActor", noGetActor],
    ["whose actor has no target", () => Promise.resolve({})],
  ])(
    "counts a dispatcher %s as answered: no throw, an error is no failure",
    async (_, getActor) => {
      const { maplibre, fire } = fakeDispatcher(getActor);
      const watch = watchWorker(maplibre);
      await nextTask();
      fire();
      expect(watch.failure()).toBeUndefined();
    },
  );
});
