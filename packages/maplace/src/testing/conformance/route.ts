import { describe, expect, it } from "vitest";
import {
  adding,
  LARGE_DIFF,
  manyMarkers,
  markerDrawable,
  TOWNS,
  townMarkers,
  updating,
} from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

/** Stops `a`, `b` and `c` in towns a road joins. */
const STOPS = townMarkers();

/** A mounted subject with the stops drawn and the route through `stops` reported. */
async function routedSubject(subject: ConformanceSubject, stops = ["a", "b"]) {
  const mounted = await mountSubject(subject);
  await mounted.adapter.apply(adding(...STOPS));
  mounted.adapter.setRoute({ stops });
  await mounted.probe.settle();
  return { ...mounted, routes: () => mounted.host.reportsOf("reportRoute") };
}

export function routeChecks(subject: ConformanceSubject, supports: Supports): void {
  describe("route", () => {
    it.runIf(supports.has("route"))(
      "reports a route whose legs run through the stops",
      async () => {
        const { routes } = await routedSubject(subject, ["a", "b", "c"]);
        const [result] = routes()[0] ?? [];
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
        const drawing = adapter.apply(adding(...manyMarkers(LARGE_DIFF), ...STOPS));
        adapter.setRoute({ stops: ["a", "c"] });
        await probe.settle();
        await drawing;
        await probe.settle();
        expect(host.reportsOf("reportRoute")).toHaveLength(1);
      },
    );

    it.runIf(supports.has("route"))(
      "reports the route anew once a stop moves, and only then",
      async () => {
        const { adapter, probe, routes } = await routedSubject(subject);
        await adapter.apply(updating(markerDrawable("c", TOWNS.bologna)));
        await probe.settle();
        expect(routes()).toHaveLength(1);
        await adapter.apply(updating(markerDrawable("b", TOWNS.ferrara)));
        await probe.settle();
        const [first, moved] = routes().map(([result]) => result?.distanceMeters);
        expect(moved).toBeDefined();
        expect(moved).not.toBe(first);
      },
    );

    it.runIf(supports.has("route"))("reports nothing new for a new style alone", async () => {
      const { adapter, probe, routes } = await routedSubject(subject);
      adapter.setRoute({ stops: ["a", "b"], style: { stroke: "#ff0000" } });
      await probe.settle();
      expect(routes()).toHaveLength(1);
    });
  });
}
