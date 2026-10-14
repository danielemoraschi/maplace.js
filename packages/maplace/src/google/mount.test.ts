// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MapVerdict } from "./mounted-map";
import {
  HELD_MAP,
  heldMaps,
  lifecycle,
  mountContext,
  recordingPart,
} from "./testing/stub-lifecycle";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createMapLifecycle", () => {
  it("opens the map once the libraries are loaded, then opens each part on it", async () => {
    const { source, counts, finish, libraries, opening } = heldMaps();
    const { part, openedOn } = recordingPart();
    const { state, mount } = lifecycle(source, { parts: [part] });
    const mounting = mount(mountContext());
    await Promise.resolve();
    expect(counts.opened).toBe(0);
    finish();
    await mounting;
    expect(opening.libraries).toEqual(libraries);
    expect(state.mounted?.map).toBe(HELD_MAP);
    expect(openedOn).toEqual([state.mounted]);
  });

  it("opens nothing when the load is cancelled before it finishes", async () => {
    const { source, counts, finish } = heldMaps();
    const { part, openedOn } = recordingPart();
    const { state, mount } = lifecycle(source, { parts: [part] });
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
    const { state, mount, destroy } = lifecycle(source, {
      parts: [
        { open: (mounted) => mounted.onDestroy(() => expect(state.mounted).toBeUndefined()) },
      ],
    });
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

  it("resolves once Google's verdicts are in, the parts open before", async () => {
    const { source, finish } = heldMaps();
    const { part, openedOn } = recordingPart();
    let give: () => void = () => {};
    const verdict: MapVerdict = () => new Promise((resolve) => (give = resolve));
    const { mount } = lifecycle({ ...source, verdict }, { parts: [part] });
    let mounted = false;
    finish();
    const mounting = mount(mountContext()).then(() => (mounted = true));
    await vi.waitFor(() => expect(openedOn).toHaveLength(1));
    expect(mounted).toBe(false);
    give();
    await mounting;
    expect(mounted).toBe(true);
  });

  it("resolves when destroyed while waiting for a verdict, the map closed", async () => {
    const { source, counts, finish } = heldMaps();
    const verdict: MapVerdict = (mounted) => new Promise((resolve) => mounted.onDestroy(resolve));
    const { state, mount, destroy } = lifecycle({ ...source, verdict });
    finish();
    const mounting = mount(mountContext());
    await vi.waitFor(() => expect(state.mounted).toBeDefined());
    destroy();
    await mounting;
    expect(counts.released).toBe(1);
  });
});
