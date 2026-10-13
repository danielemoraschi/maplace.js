import { describe, expect, it, vi } from "vitest";
import type { MountContext } from "../adapter";
import { CONTAINER } from "../testing/container";
import type { MapInUse, MapSource } from "./map-source";
import { createMapState } from "./map-state";
import { createMapLifecycle } from "./mount";

const map = {} as google.maps.Map;

/** A source whose load the test finishes, and which counts its opens and releases. */
function heldSource() {
  const counts = { opened: 0, released: 0 };
  let finish: () => void = () => {};
  const loaded = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const opened = (): MapInUse => {
    counts.opened += 1;
    return { map, release: () => (counts.released += 1) };
  };
  const source: MapSource = { load: () => loaded.then(() => opened) };
  return { source, counts, finish };
}

/** What mount reads at G1: the container and the signal. */
function mountContext(controller = new AbortController()) {
  return { container: CONTAINER, signal: controller.signal } as MountContext;
}

function lifecycle(source: MapSource) {
  const state = createMapState();
  return { state, ...createMapLifecycle(source, state) };
}

describe("createMapLifecycle", () => {
  it("opens the map once it is loaded, and holds it in the state", async () => {
    const { source, counts, finish } = heldSource();
    const { state, mount } = lifecycle(source);
    const mounting = mount(mountContext());
    expect(state.map).toBeUndefined();
    finish();
    await mounting;
    expect(counts.opened).toBe(1);
    expect(state.map).toBe(map);
  });

  it("opens nothing when the load is cancelled before it finishes", async () => {
    const { source, counts, finish } = heldSource();
    const { state, mount } = lifecycle(source);
    const controller = new AbortController();
    const mounting = mount(mountContext(controller));
    controller.abort();
    finish();
    await mounting;
    expect(counts.opened).toBe(0);
    expect(state.map).toBeUndefined();
  });

  it("opens nothing when destroyed before the load finishes", async () => {
    const { source, counts, finish } = heldSource();
    const { mount, destroy } = lifecycle(source);
    const mounting = mount(mountContext());
    destroy();
    finish();
    await mounting;
    expect(counts.opened).toBe(0);
  });

  it("releases the map once, however often it is destroyed", async () => {
    const { source, counts, finish } = heldSource();
    const { state, mount, destroy } = lifecycle(source);
    finish();
    await mount(mountContext());
    destroy();
    destroy();
    expect(counts.released).toBe(1);
    expect(state.map).toBeUndefined();
  });

  it("can be destroyed before it was mounted", () => {
    const { destroy } = lifecycle(heldSource().source);
    expect(destroy).not.toThrow();
  });

  it("fails the mount when the map fails to load", async () => {
    const failure = new Error("blocked");
    const { mount } = lifecycle({ load: vi.fn(() => Promise.reject(failure)) });
    await expect(mount(mountContext())).rejects.toBe(failure);
  });
});
