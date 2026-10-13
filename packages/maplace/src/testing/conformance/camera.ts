import { describe, expect, it } from "vitest";
import type { Viewport } from "../../viewport";
import { MAP_SIZE } from "../map-probe";
import { adding, LARGE_DIFF, manyMarkers, markerDrawable } from "./fixtures";
import { boxContains, lngSpanAt, lngSpanOf } from "./geo";
import { type MountedSubject, mountSubject } from "./harness";
import type { ConformanceSubject } from "./subject";

/** Two decimals of a degree: what providers agree on after their own rounding. */
const DEGREE_DIGITS = 2;

/** The viewport the map last reported; failing the check when it reported none. */
function reportedViewport({ host }: MountedSubject): Viewport {
  // A copy's `pop`: `.at(-1)` is ES2022, past the ES2020 target.
  const viewport = [...host.reportsOf("reportViewport")].pop()?.[0];
  if (viewport === undefined) throw new Error("expected the map to report a viewport");
  return viewport;
}

export function cameraChecks(subject: ConformanceSubject): void {
  describe("camera", () => {
    it("shows a centre and zoom over the longitudes the zoom scale gives", async () => {
      const mounted = await mountSubject(subject);
      mounted.adapter.setView({ kind: "center", center: { lat: 0, lng: 10 }, zoom: 4 });
      await mounted.probe.settle();
      const viewport = reportedViewport(mounted);
      expect(viewport.zoom).toBe(4);
      expect(viewport.center.lng).toBeCloseTo(10, DEGREE_DIGITS);
      expect(lngSpanOf(viewport.bounds)).toBeCloseTo(lngSpanAt(4, MAP_SIZE.width), DEGREE_DIGITS);
    });

    it("fits a box across ±180° in bounds that cross it too", async () => {
      const mounted = await mountSubject(subject);
      const box = { south: -20, west: 170, north: 0, east: -170 };
      mounted.adapter.setView({ kind: "fit-bounds", bounds: box, padding: 40 });
      await mounted.probe.settle();
      const { bounds } = reportedViewport(mounted);
      expect(bounds.west).toBeGreaterThan(bounds.east);
      expect(boxContains(bounds, box)).toBe(true);
    });

    it("fits a box with no size (one location) at a finite zoom, centred on it", async () => {
      const mounted = await mountSubject(subject);
      const point = { south: 10, west: 20, north: 10, east: 20 };
      mounted.adapter.setView({ kind: "fit-bounds", bounds: point, padding: 40 });
      await mounted.probe.settle();
      const viewport = reportedViewport(mounted);
      expect(Number.isFinite(viewport.zoom)).toBe(true);
      expect(viewport.center.lat).toBeCloseTo(10, DEGREE_DIGITS);
      expect(viewport.center.lng).toBeCloseTo(20, DEGREE_DIGITS);
    });

    it("brings a location to the centre, keeping the zoom unless given one", async () => {
      const mounted = await mountSubject(subject);
      await mounted.adapter.apply(adding(markerDrawable("a", { lat: 10, lng: 20 })));
      mounted.adapter.setView({ kind: "center", center: { lat: 0, lng: 0 }, zoom: 5 });
      await mounted.probe.settle();
      mounted.adapter.setView({ kind: "location", id: "a", zoom: undefined });
      await mounted.probe.settle();
      expect(reportedViewport(mounted)).toMatchObject({ zoom: 5 });
      expect(reportedViewport(mounted).center.lat).toBeCloseTo(10, DEGREE_DIGITS);
      mounted.adapter.setView({ kind: "location", id: "a", zoom: 7 });
      await mounted.probe.settle();
      expect(reportedViewport(mounted).zoom).toBe(7);
    });

    it("centres on a location named while it is still being drawn, once it is", async () => {
      const mounted = await mountSubject(subject);
      const target = markerDrawable("target", { lat: 10, lng: 20 });
      const drawing = mounted.adapter.apply(adding(...manyMarkers(LARGE_DIFF), target));
      mounted.adapter.setView({ kind: "location", id: "target", zoom: 6 });
      await drawing;
      await mounted.probe.settle();
      expect(reportedViewport(mounted).center.lng).toBeCloseTo(20, DEGREE_DIGITS);
    });

    it("reports the viewport once a move settles, and not again without one", async () => {
      const mounted = await mountSubject(subject);
      mounted.adapter.setView({ kind: "center", center: { lat: 0, lng: 0 }, zoom: 3 });
      expect(mounted.host.reportsOf("reportViewport")).toEqual([]);
      await mounted.probe.settle();
      await mounted.probe.settle();
      expect(mounted.host.reportsOf("reportViewport")).toHaveLength(1);
    });
  });
}
