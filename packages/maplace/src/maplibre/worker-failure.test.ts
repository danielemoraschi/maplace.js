import { describe, expect, it, vi } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import type { MapLibre } from "./library";
import { watchWorker } from "./worker-failure";

/** A hello no worker answers: the workers never loaded. */
const unanswered = () => new Promise<never>(() => {});

/** The global dispatcher as the watch uses it: its errors, its hellos and its new workers. */
function fakeDispatcher(broadcast: (type: string, data: unknown) => Promise<unknown> = unanswered) {
  const listeners: ((event: { error: Error }) => void)[] = [];
  const whenWorkersCreated: (() => void)[] = [];
  const dispatcher = {
    broadcast: vi.fn(broadcast),
    on(type: string, listener: (event: { error: Error }) => void) {
      if (type === "error") listeners.push(listener);
      if (type === "workerscreate") whenWorkersCreated.push(listener as () => void);
    },
  };
  return {
    dispatcher,
    maplibre: { getGlobalDispatcher: () => dispatcher } as unknown as MapLibre,
    fire: (error = new Error("Worker failed to load")) => {
      for (const listener of listeners) listener({ error });
    },
    createWorkers: () => {
      for (const listener of whenWorkersCreated) listener();
    },
    listeners,
  };
}

/** What a hello gets when 6.16 stops the workers before they answer. */
function stoppedBeforeAnswering(): Error {
  const error = new Error("The workers were terminated while a message was in flight.");
  error.name = "AbortError";
  return error;
}

/** Hellos answered in turn, one per broadcast; any after them go unanswered. */
function inTurn(...hellos: (() => Promise<unknown>)[]) {
  return () => hellos.shift()?.() ?? unanswered();
}

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
    const { maplibre, fire } = fakeDispatcher(() => Promise.resolve([null]));
    const watch = watchWorker(maplibre);
    const heard = vi.fn();
    watch.whenFails(heard);
    await nextTask();
    fire();
    expect(watch.failure()).toBeUndefined();
    expect(heard).not.toHaveBeenCalled();
  });

  it("says hello with a message of maplace's own, which no worker handles", () => {
    const { maplibre, dispatcher } = fakeDispatcher();
    watchWorker(maplibre);
    expect(dispatcher.broadcast).toHaveBeenCalledWith(
      expect.stringMatching(/^maplace:/),
      undefined,
    );
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
    const { maplibre, listeners, dispatcher } = fakeDispatcher();
    expect(watchWorker(maplibre)).toBe(watchWorker(maplibre));
    expect(listeners).toHaveLength(1);
    expect(dispatcher.broadcast).toHaveBeenCalledTimes(1);
    expect(watchWorker(fakeDispatcher().maplibre)).not.toBe(watchWorker(maplibre));
  });

  it("watches nothing, and never fails, on a maplibre-gl without a global dispatcher", () => {
    const watch = watchWorker({} as MapLibre);
    expect(watch.failure()).toBeUndefined();
    expect(() => watch.whenFails(vi.fn())()).not.toThrow();
  });

  it("takes a rejected hello for the failure it is: no worker could be made", async () => {
    const cause = new Error("no worker");
    const { maplibre } = fakeDispatcher(() => Promise.reject(cause));
    const watch = watchWorker(maplibre);
    const heard = vi.fn();
    watch.whenFails(heard);
    await nextTask();
    expect(watch.failure()).toMatchObject({ code: "provider-load-failed", cause });
    expect(heard).toHaveBeenCalledWith(watch.failure());
  });

  it("says hello again to the next workers when the first were stopped before answering", async () => {
    const { maplibre, dispatcher, fire, createWorkers } = fakeDispatcher(
      inTurn(() => Promise.reject(stoppedBeforeAnswering())),
    );
    const watch = watchWorker(maplibre);
    await nextTask();
    expect(watch.failure()).toBeUndefined();
    createWorkers();
    expect(dispatcher.broadcast).toHaveBeenCalledTimes(2);
    fire();
    expect(watch.failure()).toMatchObject({ code: "provider-load-failed" });
  });

  it("hears the next workers fail to load after the first answered", async () => {
    const { maplibre, fire, createWorkers } = fakeDispatcher(inTurn(() => Promise.resolve([null])));
    const watch = watchWorker(maplibre);
    await nextTask();
    createWorkers();
    fire();
    expect(watch.failure()).toMatchObject({ code: "provider-load-failed" });
  });

  it("takes an error after the next workers' answer for no failure", async () => {
    const { maplibre, fire, createWorkers } = fakeDispatcher(
      inTurn(
        () => Promise.reject(stoppedBeforeAnswering()),
        () => Promise.resolve([null]),
      ),
    );
    const watch = watchWorker(maplibre);
    await nextTask();
    createWorkers();
    await nextTask();
    fire();
    expect(watch.failure()).toBeUndefined();
  });

  it("watches nothing, and never fails, on a dispatcher without broadcast", () => {
    const { maplibre, dispatcher, fire, listeners } = fakeDispatcher();
    (dispatcher as { broadcast?: unknown }).broadcast = undefined;
    const watch = watchWorker(maplibre);
    fire();
    expect(watch.failure()).toBeUndefined();
    expect(listeners).toHaveLength(0);
    expect(() => watch.whenFails(vi.fn())()).not.toThrow();
  });
});
