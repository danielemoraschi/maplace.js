import { describe, expect, it } from "vitest";
import { styleLoaded } from "./style-load";

/** A map as `styleLoaded` reads one: its style, whether every tile is in, its `style.load`. */
function mapWith(style: object | undefined) {
  const listeners: (() => void)[] = [];
  const map = {
    getStyle: () => style,
    // A map moving over tiles still loading: MapLibre's isStyleLoaded() says false.
    isStyleLoaded: () => false,
    once: (_type: string, listener: () => void) => listeners.push(listener),
  };
  const loadStyle = () => {
    for (const listener of listeners) listener();
  };
  return { map: map as never, loadStyle };
}

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
