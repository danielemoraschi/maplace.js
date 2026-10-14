// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MountContext } from "../adapter";
import { CONTAINER } from "../testing/container";
import type { GoogleLibraries } from "./libraries";
import type { MapInUse, MapSource } from "./map-source";
import { createMapState } from "./map-state";
import { createMapLifecycle } from "./mount";
import type { MapPart, MountedMap } from "./mounted-map";
import { stubMapsJs } from "./testing/stub-libraries";

afterEach(() => {
  vi.unstubAllGlobals();
});

const map = {} as google.maps.Map;

/** Maps JS whose libraries the test finishes loading, and a source counting opens and releases. */
function heldMaps() {
  let finish: () => void = () => {};
  const loaded = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const libraries = stubMapsJs(loaded);
  const counts = { opened: 0, released: 0 };
  const opening: { libraries?: GoogleLibraries } = {};
  const source: MapSource = {
    open(_container, given): MapInUse {
      counts.opened += 1;
      opening.libraries = given;
      return { map, release: () => (counts.released += 1) };
    },
  };
  return { source, counts, finish, libraries, opening };
}

function mountContext(controller = new AbortController()) {
  return { container: CONTAINER, signal: controller.signal } as MountContext;
}

/** A part that records the maps it was opened on. */
function recordingPart() {
  const openedOn: MountedMap[] = [];
  const part: MapPart = { open: (mounted) => openedOn.push(mounted) };
  return { part, openedOn };
}

function lifecycle(source: MapSource, parts: readonly MapPart[] = []) {
  const state = createMapState();
  return { state, ...createMapLifecycle({ source, state, parts }) };
}

describe("createMapLifecycle", () => {
  it("opens the map once the libraries are loaded, then opens each part on it", async () => {
    const { source, counts, finish, libraries, opening } = heldMaps();
    const { part, openedOn } = recordingPart();
    const { state, mount } = lifecycle(source, [part]);
    const mounting = mount(mountContext());
    await Promise.resolve();
    expect(counts.opened).toBe(0);
    finish();
    await mounting;
    expect(opening.libraries).toEqual(libraries);
    expect(state.mounted?.map).toBe(map);
    expect(openedOn).toEqual([state.mounted]);
  });

  it("opens nothing when the load is cancelled before it finishes", async () => {
    const { source, counts, finish } = heldMaps();
    const { part, openedOn } = recordingPart();
    const { state, mount } = lifecycle(source, [part]);
    const controller = new AbortController();
    const mounting = mount(mountContext(controller));
    controller.abort();
    finish();
    await mounting;
    expect([counts.opened, openedOn.length]).toEqual([0, 0]);
    expect(state.mounted).toBeUndefined();
  });

  it("opens nothing when destroyed before the load finishes", async () => {
    const { source, counts, finish } = heldMaps();
    const { mount, destroy } = lifecycle(source);
    const mounting = mount(mountContext());
    destroy();
    finish();
    await mounting;
    expect(counts.opened).toBe(0);
  });

  it("closes the map once, however often it is destroyed, and forgets it first", async () => {
    const { source, counts, finish } = heldMaps();
    const { state, mount, destroy } = lifecycle(source, [
      { open: (mounted) => mounted.onDestroy(() => expect(state.mounted).toBeUndefined()) },
    ]);
    finish();
    await mount(mountContext());
    destroy();
    destroy();
    expect(counts.released).toBe(1);
    expect(state.mounted).toBeUndefined();
  });

  it("can be destroyed before it was mounted", () => {
    const { destroy } = lifecycle(heldMaps().source);
    expect(destroy).not.toThrow();
  });

  it("fails the mount when the libraries fail to load", async () => {
    const { source } = heldMaps();
    vi.stubGlobal("google", {
      maps: { importLibrary: () => Promise.reject(new Error("blocked")) },
    });
    await expect(lifecycle(source).mount(mountContext())).rejects.toThrow("blocked");
  });
});
