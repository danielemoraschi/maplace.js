import { describe, expect, it } from "vitest";
import { gateMaps } from "./map-gate.ts";

/** Maps by name, a visibility the test controls, and the releases it saw. */
function setup(...maps: string[]) {
  const waiting = new Map<string, () => void>();
  const released: string[] = [];
  const openMaps = gateMaps(maps, {
    whenVisible: (map, run) => waiting.set(map, run),
    release: (map) => released.push(map),
  });
  const show = (map: string) => waiting.get(map)?.();
  return { openMaps, show, waiting, released };
}

describe("gateMaps", () => {
  it("releases no map before it opens, visible or not", () => {
    const { waiting, released } = setup("rome", "milan");
    expect(waiting.size).toBe(0);
    expect(released).toEqual([]);
  });

  it("once open, releases each map as it comes into view", () => {
    const { openMaps, show, released } = setup("rome", "milan");
    openMaps();
    expect(released).toEqual([]);
    show("milan");
    expect(released).toEqual(["milan"]);
  });

  it("opens once, however often it is asked", () => {
    const { openMaps, show, released } = setup("rome");
    openMaps();
    openMaps();
    show("rome");
    expect(released).toEqual(["rome"]);
  });
});
