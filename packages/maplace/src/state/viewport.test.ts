import { describe, expect, it } from "vitest";
import type { Viewport } from "../viewport";
import { NO_CHANGE } from "./change";
import { initialSnapshot } from "./initial";
import { setViewport } from "./viewport";

const viewport: Viewport = {
  center: { lat: 45, lng: 9 },
  zoom: 10,
  bounds: { south: 44, west: 8, north: 46, east: 10 },
};
const snapshot = initialSnapshot(undefined);

describe("setViewport", () => {
  it("stores a frozen copy and fires viewport with it", () => {
    const change = setViewport(snapshot, viewport);
    const stored = change.patch.viewport;
    expect(stored).toEqual(viewport);
    expect(stored).not.toBe(viewport);
    expect(Object.isFrozen(stored?.bounds)).toBe(true);
    expect(change.events).toEqual([{ name: "viewport", payload: { viewport: stored } }]);
  });

  it("throws on a viewport no map can show (an adapter bug)", () => {
    expect(() => setViewport(snapshot, { ...viewport, zoom: Number.NaN })).toThrow(
      "reportViewport: viewport.zoom",
    );
    const inverted = { ...viewport, bounds: { ...viewport.bounds, south: 50 } };
    expect(() => setViewport(snapshot, inverted)).toThrow("reportViewport: viewport.bounds");
  });

  it("changes nothing for an equal viewport, but does for a nested change", () => {
    const current = { ...snapshot, viewport };
    expect(setViewport(current, structuredClone(viewport))).toBe(NO_CHANGE);
    const moved = { ...viewport, bounds: { ...viewport.bounds, east: 11 } };
    expect(setViewport(current, moved)).not.toBe(NO_CHANGE);
  });
});
