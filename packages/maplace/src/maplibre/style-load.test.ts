import { describe, expect, it, vi } from "vitest";
import { styleLoaded, whenStyleLoaded } from "./style-load";

/** A map as the style waits read one: its style, whether every tile is in, its `style.load`. */
function mapWith(initial: object | undefined) {
  let style = initial;
  let listeners: (() => void)[] = [];
  const map = {
    getStyle: () => style,
    // A map moving over tiles still loading: MapLibre's isStyleLoaded() says false.
    isStyleLoaded: () => false,
    once: (_type: string, listener: () => void) => listeners.push(listener),
  };
  /** Gives the map `next` as its style, then fires `style.load` once to whoever listens now. */
  const fireStyleLoad = (next: object | undefined) => {
    style = next;
    const heard = listeners;
    listeners = [];
    for (const listener of heard) listener();
  };
  const loadStyle = () => fireStyleLoad({ version: 8 });
  return { map: map as never, loadStyle, fireStyleLoad };
}

describe("whenStyleLoaded", () => {
  it("runs at once for a style loaded, whatever tiles are still loading", () => {
    const { map } = mapWith({ version: 8 });
    const run = vi.fn();
    whenStyleLoaded(map, run);
    expect(run).toHaveBeenCalledOnce();
  });

  it("runs on the next style load, not before", () => {
    const { map, loadStyle } = mapWith(undefined);
    const run = vi.fn();
    whenStyleLoaded(map, run);
    expect(run).not.toHaveBeenCalled();
    loadStyle();
    expect(run).toHaveBeenCalledOnce();
  });

  it("waits on when the style is gone again by the time its load is heard", () => {
    const { map, loadStyle, fireStyleLoad } = mapWith(undefined);
    const run = vi.fn();
    whenStyleLoaded(map, run);
    fireStyleLoad(undefined);
    expect(run).not.toHaveBeenCalled();
    loadStyle();
    expect(run).toHaveBeenCalledOnce();
  });
});

describe("styleLoaded", () => {
  it("resolves at once for a style loaded, whatever tiles are still loading", async () => {
    const { map } = mapWith({ version: 8 });
    await expect(styleLoaded(map)).resolves.toBeUndefined();
  });

  it("waits for the style to load", async () => {
    const { map, loadStyle } = mapWith(undefined);
    let loaded = false;
    const waiting = styleLoaded(map).then(() => {
      loaded = true;
    });
    await Promise.resolve();
    expect(loaded).toBe(false);
    loadStyle();
    await waiting;
    expect(loaded).toBe(true);
  });
});
