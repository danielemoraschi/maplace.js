// @vitest-environment happy-dom
import type { Map as MapLibreMap } from "maplibre-gl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdapterHost, MountContext } from "../adapter";
import { createMapFailureNotice } from "../adapter-kit/map-failure";
import { MAP_FAILURE_CLASS } from "../map-failure-words";
import { createMapState } from "./map-state";
import { createMapLifecycle } from "./mount";

/** The worker's errors, as the global dispatcher fires them; a new dispatcher for each test. */
let fireWorkerError: () => void = () => {};

vi.mock("./library", () => ({
  loadMapLibre: async () => ({
    getGlobalDispatcher: () => mocks.dispatcher,
  }),
}));
vi.mock("./clustering", () => ({
  loadClustering: async () => () => ({ release() {} }),
}));
vi.mock("./stylesheet-check", () => ({ warnOfMissingStylesheetOnce() {} }));

const mocks = vi.hoisted(() => ({ dispatcher: {} as object }));

beforeEach(() => {
  const listeners: ((event: { error: Error }) => void)[] = [];
  mocks.dispatcher = {
    getActor: () => new Promise(() => {}),
    on: (_: string, listener: (event: { error: Error }) => void) => listeners.push(listener),
  };
  fireWorkerError = () => {
    for (const listener of listeners) listener({ error: new Error("Worker failed to load") });
  };
});

/** A map whose style loads when the test says. */
function fakeMap() {
  let style: object | undefined;
  const once = new Map<string, () => void>();
  const map = {
    getStyle: () => style,
    once: (type: string, listener: () => void) => once.set(type, listener),
    on() {},
    off() {},
  } as unknown as MapLibreMap;
  return {
    map,
    loadStyle() {
      style = {};
      once.get("style.load")?.();
    },
  };
}

/** A lifecycle on `fakeMap`, and what mounting it needs. */
function lifecycle() {
  const { map, loadStyle } = fakeMap();
  const open = vi.fn(() => ({ map, release() {} }));
  const notice = createMapFailureNotice();
  const reportError = vi.fn();
  const { mount, destroy } = createMapLifecycle({
    source: { open },
    state: createMapState(),
    parts: [],
    reportFatal: notice.reportFatal,
  });
  const container = document.createElement("div");
  const context = {
    container,
    host: { reportError } as unknown as AdapterHost,
    signal: new AbortController().signal,
    cluster: false,
  } as unknown as MountContext;
  return {
    open,
    loadStyle,
    reportError,
    destroy,
    context,
    mounting: notice.mounting(mount),
    panels: () => container.querySelectorAll(`.${MAP_FAILURE_CLASS}`).length,
  };
}

/** Until the mount has opened its map and waits for the style. */
const untilOpened = (open: ReturnType<typeof lifecycle>["open"]) =>
  vi.waitFor(() => expect(open).toHaveBeenCalled());

describe("the worker's failure, on the MapLibre lifecycle", () => {
  it("before the style loaded rejects the mount, naming the worker", async () => {
    const { open, mounting, context, reportError } = lifecycle();
    const mount = mounting(context);
    await untilOpened(open);
    fireWorkerError();
    await expect(mount).rejects.toMatchObject({ message: expect.stringMatching(/worker/i) });
    expect(reportError).not.toHaveBeenCalled();
  });

  it("after the style loaded is reported once, fatally: the panel shows", async () => {
    const { open, mounting, context, loadStyle, reportError, panels } = lifecycle();
    const mount = mounting(context);
    await untilOpened(open);
    loadStyle();
    await mount;
    fireWorkerError();
    fireWorkerError();
    expect(reportError).toHaveBeenCalledOnce();
    expect(reportError.mock.calls[0]?.[0]).toMatchObject({ code: "provider-load-failed" });
    expect(panels()).toBe(1);
  });

  it("after destroy tells nobody", async () => {
    const { open, mounting, context, loadStyle, reportError, destroy, panels } = lifecycle();
    const mount = mounting(context);
    await untilOpened(open);
    loadStyle();
    await mount;
    destroy();
    fireWorkerError();
    expect(reportError).not.toHaveBeenCalled();
    expect(panels()).toBe(0);
  });

  it("known already, fails the next mount before it opens a map", async () => {
    const first = lifecycle();
    const mount = first.mounting(first.context);
    await untilOpened(first.open);
    fireWorkerError();
    await expect(mount).rejects.toMatchObject({ code: "provider-load-failed" });
    const later = lifecycle();
    await expect(later.mounting(later.context)).rejects.toMatchObject({
      code: "provider-load-failed",
    });
    expect(later.open).not.toHaveBeenCalled();
    expect(later.panels()).toBe(1);
  });
});
