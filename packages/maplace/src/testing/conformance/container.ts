import { describe, expect, it } from "vitest";
import { MAP_SIZE } from "../map-probe";
import { boxContains, DEGREE_DIGITS, lngSpanAt, lngSpanOf } from "./geo";
import { type MountedSubject, mountSubject, reportedViewport } from "./harness";
import type { ConformanceSubject } from "./subject";

/** A box a 512-px map fits at zoom 5, and a map half as wide only further out. */
const BOX = { south: 10, west: 20, north: 20, east: 35 };

const viewports = ({ host }: MountedSubject) => host.reportsOf("reportViewport").length;

/** Hidden, as a closed tab or dialog hides a map: the container has no size. */
function hide({ container }: MountedSubject): void {
  container.style.display = "none";
}

function show({ container }: MountedSubject): void {
  container.style.display = "";
}

function resizeTo({ container }: MountedSubject, width: number): void {
  container.style.width = `${width}px`;
}

export function containerChecks(subject: ConformanceSubject): void {
  describe("container", () => {
    it("shows a view sent while hidden once shown, at its size, reporting nothing before", async () => {
      const mounted = await mountSubject(subject);
      await mounted.probe.settle();
      const reportedBefore = viewports(mounted);
      hide(mounted);
      mounted.adapter.setView({ kind: "fit-bounds", bounds: BOX, padding: 40 });
      await mounted.probe.settle();
      expect(viewports(mounted)).toBe(reportedBefore);
      show(mounted);
      await mounted.probe.settle();
      const { bounds, zoom } = reportedViewport(mounted);
      expect(boxContains(bounds, BOX)).toBe(true);
      expect(zoom).toBeGreaterThan(3);
    });

    it("fits a fitted view again when the container is resized", async () => {
      const mounted = await mountSubject(subject);
      mounted.adapter.setView({ kind: "fit-bounds", bounds: BOX, padding: 40 });
      await mounted.probe.settle();
      const fittedZoom = reportedViewport(mounted).zoom;
      resizeTo(mounted, MAP_SIZE.width / 2);
      await mounted.probe.settle();
      const { bounds, zoom } = reportedViewport(mounted);
      expect(boxContains(bounds, BOX)).toBe(true);
      expect(zoom).toBeLessThan(fittedZoom);
    });

    it("reports what a resized map shows, keeping a centre and zoom", async () => {
      const mounted = await mountSubject(subject);
      mounted.adapter.setView({ kind: "center", center: { lat: 0, lng: 10 }, zoom: 4 });
      await mounted.probe.settle();
      const width = MAP_SIZE.width / 2;
      resizeTo(mounted, width);
      await mounted.probe.settle();
      const viewport = reportedViewport(mounted);
      expect(viewport.zoom).toBe(4);
      expect(viewport.center.lng).toBeCloseTo(10, DEGREE_DIGITS);
      expect(lngSpanOf(viewport.bounds)).toBeCloseTo(lngSpanAt(4, width), DEGREE_DIGITS);
    });
  });
}
