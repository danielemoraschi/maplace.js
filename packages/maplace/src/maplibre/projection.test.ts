import type { Map as MapLibreMap, ProjectionSpecification } from "maplibre-gl";
import { describe, expect, it } from "vitest";
import { isOnGlobe, onProjectionSwitch } from "./projection";

/** A map whose style gives `projection`, or none, as MapLibre's `getProjection` does. */
const mapWith = (projection: ProjectionSpecification | undefined) =>
  ({ getProjection: () => projection }) as unknown as MapLibreMap;

describe("isOnGlobe", () => {
  it("is flat with no projection, mercator, or a planar one", () => {
    expect(isOnGlobe(mapWith(undefined))).toBe(false);
    expect(isOnGlobe(mapWith({}))).toBe(false);
    expect(isOnGlobe(mapWith({ type: "mercator" }))).toBe(false);
    expect(isOnGlobe(mapWith({ type: "EPSG:3857" }))).toBe(false);
  });

  it("is a globe for globe, vertical-perspective or an expression", () => {
    expect(isOnGlobe(mapWith({ type: "globe" }))).toBe(true);
    expect(isOnGlobe(mapWith({ type: "vertical-perspective" }))).toBe(true);
    const expression = [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      "vertical-perspective",
      12,
      "mercator",
    ];
    expect(isOnGlobe(mapWith({ type: expression } as unknown as ProjectionSpecification))).toBe(
      true,
    );
  });
});

describe("onProjectionSwitch", () => {
  /** A map whose projection the test sets, announcing each as MapLibre does, a style load too. */
  function announcingMap() {
    let projection: ProjectionSpecification = { type: "mercator" };
    const listeners = new Set<() => void>();
    const map = {
      getProjection: () => projection,
      on: (_: string, listener: () => void) => listeners.add(listener),
      off: (_: string, listener: () => void) => listeners.delete(listener),
    } as unknown as MapLibreMap;
    const teardowns: (() => void)[] = [];
    const mounted = { map, onDestroy: (teardown: () => void) => teardowns.push(teardown) };
    const close = () => {
      for (const teardown of teardowns) teardown();
    };
    const announce = (next: ProjectionSpecification) => {
      projection = next;
      for (const listener of listeners) listener();
    };
    return { mounted, announce, close, listening: () => listeners.size };
  }

  it("calls back on a switch to the globe and back, not for the same projection loaded again", () => {
    const { mounted, announce } = announcingMap();
    let switches = 0;
    onProjectionSwitch(mounted, () => {
      switches += 1;
    });
    announce({ type: "mercator" });
    expect(switches).toBe(0);
    announce({ type: "globe" });
    announce({ type: "globe" });
    expect(switches).toBe(1);
    announce({ type: "mercator" });
    expect(switches).toBe(2);
  });

  it("stops listening once the map closes", () => {
    const { mounted, close, listening } = announcingMap();
    onProjectionSwitch(mounted, () => {});
    expect(listening()).toBe(1);
    close();
    expect(listening()).toBe(0);
  });
});
