import { describe, expect, it } from "vitest";
import type { Viewport } from "../../viewport";
import { MAP_SIZE } from "../map-probe";
import {
  adding,
  manyMarkers,
  markerDrawable,
  polygonDrawable,
  squareAround,
  updating,
} from "./fixtures";
import { boxContains, FIT_MAX_ZOOM, lngSpanAt, lngSpanOf } from "./geo";
import { type MountedSubject, mountSubject } from "./harness";
import type { ConformanceSubject } from "./subject";

/**
 * Markers drawn ahead of the one a view names, so the view comes first. Not a large diff: with
 * 4,000 markers on it, Google took up to 2.4 s to settle a move (its `idle` waits for tiles).
 */
const DRAWN_AHEAD = 1000;

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

    it("fits a box with no size (one location) at the fit cap, centred on it", async () => {
      const mounted = await mountSubject(subject);
      const point = { south: 10, west: 20, north: 10, east: 20 };
      mounted.adapter.setView({ kind: "fit-bounds", bounds: point, padding: 40 });
      await mounted.probe.settle();
      const viewport = reportedViewport(mounted);
      expect(viewport.zoom).toBe(FIT_MAX_ZOOM);
      expect(viewport.center.lat).toBeCloseTo(10, DEGREE_DIGITS);
      expect(viewport.center.lng).toBeCloseTo(20, DEGREE_DIGITS);
    });

    it("fits locations metres apart no closer than the fit cap", async () => {
      const mounted = await mountSubject(subject);
      const metres = { south: 10, west: 20, north: 10.0001, east: 20.0001 };
      mounted.adapter.setView({ kind: "fit-bounds", bounds: metres, padding: 40 });
      await mounted.probe.settle();
      expect(reportedViewport(mounted).zoom).toBe(FIT_MAX_ZOOM);
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

    it("brings a shape to its centre point", async () => {
      const mounted = await mountSubject(subject);
      const path = squareAround({ lat: 15, lng: 25 }, 10);
      const field = polygonDrawable("field", { geometry: { type: "polygon", path, holes: [] } });
      await mounted.adapter.apply(adding(field));
      mounted.adapter.setView({ kind: "location", id: "field", zoom: 4 });
      await mounted.probe.settle();
      const { center } = reportedViewport(mounted);
      expect(center.lat).toBeCloseTo(15, DEGREE_DIGITS);
      expect(center.lng).toBeCloseTo(25, DEGREE_DIGITS);
    });

    it("centres on a location named while it is still being drawn, once it is", async () => {
      const mounted = await mountSubject(subject);
      const target = markerDrawable("target", { lat: 10, lng: 20 });
      const drawing = mounted.adapter.apply(adding(...manyMarkers(DRAWN_AHEAD), target));
      mounted.adapter.setView({ kind: "location", id: "target", zoom: 6 });
      expect(mounted.probe.locationIds()).not.toContain("target");
      await drawing;
      await mounted.probe.settle();
      expect(reportedViewport(mounted).center.lng).toBeCloseTo(20, DEGREE_DIGITS);
    });

    it("centres on where a location moved to in a diff sent just before the view", async () => {
      const mounted = await mountSubject(subject);
      await mounted.adapter.apply(adding(markerDrawable("a", { lat: 10, lng: 20 })));
      const moving = mounted.adapter.apply(updating(markerDrawable("a", { lat: -30, lng: 40 })));
      mounted.adapter.setView({ kind: "location", id: "a", zoom: 5 });
      await moving;
      await mounted.probe.settle();
      const { center } = reportedViewport(mounted);
      expect(center.lat).toBeCloseTo(-30, DEGREE_DIGITS);
      expect(center.lng).toBeCloseTo(40, DEGREE_DIGITS);
    });

    it("reports the view it opens at once it settles", async () => {
      const mounted = await mountSubject(subject);
      await mounted.probe.settle();
      expect(mounted.host.reportsOf("reportViewport")).toHaveLength(1);
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
