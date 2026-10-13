import { describe, expect, it } from "vitest";
import { EVERY_CAPABILITY } from "../contract-values";
import { adding, LARGE_DIFF, manyMarkers, markerDrawable } from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

const SMALLEST_ROUTE = 2;

export function capabilityChecks(subject: ConformanceSubject, supports: Supports): void {
  describe("capabilities", () => {
    it("names only capabilities the contract knows", () => {
      for (const capability of supports) expect(EVERY_CAPABILITY).toContain(capability);
    });

    it("limits routes to at least two stops, if at all", () => {
      const { routeStopLimit } = subject.create().adapter;
      if (routeStopLimit === undefined) return;
      expect(Number.isInteger(routeStopLimit)).toBe(true);
      expect(routeStopLimit).toBeGreaterThanOrEqual(SMALLEST_ROUTE);
    });

    it.runIf(supports.has("route"))(
      "reports a route whose legs run through the stops",
      async () => {
        const { adapter, probe, host } = await mountSubject(subject);
        await adapter.apply(
          adding(
            markerDrawable("a"),
            markerDrawable("b", { lat: 1, lng: 1 }),
            markerDrawable("c", { lat: 2, lng: 1 }),
          ),
        );
        adapter.setRoute({ stops: ["a", "b", "c"] });
        await probe.settle();
        const [result] = host.reportsOf("reportRoute")[0] ?? [];
        expect(result?.legs.map(({ from, to }) => [from, to])).toEqual([
          ["a", "b"],
          ["b", "c"],
        ]);
      },
    );

    it.runIf(supports.has("route"))(
      "reports a route through stops still being drawn, once they are",
      async () => {
        const { adapter, probe, host } = await mountSubject(subject);
        const stops = [markerDrawable("start"), markerDrawable("end", { lat: 1, lng: 1 })];
        const drawing = adapter.apply(adding(...manyMarkers(LARGE_DIFF), ...stops));
        adapter.setRoute({ stops: ["start", "end"] });
        await probe.settle();
        await drawing;
        await probe.settle();
        expect(host.reportsOf("reportRoute")).toHaveLength(1);
      },
    );

    it.runIf(supports.has("cluster"))("still draws every location when clustering", async () => {
      const { adapter, probe } = await mountSubject(subject, { cluster: true });
      await adapter.apply(adding(...manyMarkers(3)));
      expect(probe.locationIds()).toHaveLength(3);
    });
  });
}
