import { describe, expect, it } from "vitest";
import { sum } from "../../adapter-kit/route-result";
import type { RouteLeg } from "../../route";
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

/** How far a leg's steps may add up from the leg's own distance: providers round each step. */
const STEP_DISTANCE_TOLERANCE = 0.02;

/** A leg's distance, summed from its steps. */
const stepDistance = (leg: RouteLeg) => sum(leg.steps.map((step) => step.distanceMeters));

/** A mounted subject with the stops drawn and the route through `stops` reported. */
async function routedSubject(subject: ConformanceSubject, stops = ["a", "b"]) {
  const mounted = await mountSubject(subject);
  await mounted.adapter.apply(adding(...STOPS));
  mounted.adapter.setRoute({ stops });
  await mounted.probe.settle();
  return { ...mounted, routes: () => mounted.host.reportsOf("reportRouteChange") };
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
      "gives each leg its steps, which add up to the leg",
      async () => {
        const { routes } = await routedSubject(subject, ["a", "b", "c"]);
        const legs = routes()[0]?.[0]?.legs ?? [];
        const steps = legs.flatMap((leg) => leg.steps);
        expect(legs).toHaveLength(2);
        expect(legs.every((leg) => leg.steps.length > 0)).toBe(true);
        for (const { instruction, distanceMeters, durationSeconds } of steps) {
          expect(instruction === undefined || instruction.length > 0).toBe(true);
          expect(Number.isFinite(distanceMeters) && distanceMeters >= 0).toBe(true);
          expect(Number.isFinite(durationSeconds) && durationSeconds >= 0).toBe(true);
        }
        expect(steps.some(({ instruction }) => instruction !== undefined)).toBe(true);
        for (const leg of legs) {
          const tolerance = leg.distanceMeters * STEP_DISTANCE_TOLERANCE;
          expect(Math.abs(stepDistance(leg) - leg.distanceMeters)).toBeLessThanOrEqual(tolerance);
        }
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
        expect(host.reportsOf("reportRouteChange")).toHaveLength(1);
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

    it.runIf(supports.has("route"))(
      "passes through a via stop: one leg between the others, longer than the direct route",
      async () => {
        const { adapter, probe, routes } = await routedSubject(subject, ["a", "c"]);
        adapter.setRoute({ stops: ["a", "b", "c"], via: ["b"] });
        await probe.settle();
        const [direct, through] = routes().map(([result]) => result);
        expect(through?.legs.map(({ from, to }) => [from, to])).toEqual([["a", "c"]]);
        expect(through?.distanceMeters).toBeGreaterThan(direct?.distanceMeters ?? Infinity);
      },
    );

    it.runIf(supports.has("route"))("reports the route anew when only via changes", async () => {
      const { adapter, probe, routes } = await routedSubject(subject, ["a", "b", "c"]);
      adapter.setRoute({ stops: ["a", "b", "c"], via: ["b"] });
      await probe.settle();
      expect(routes()).toHaveLength(2);
    });

    it.runIf(supports.has("route"))("reports nothing new for a new style alone", async () => {
      const { adapter, probe, routes } = await routedSubject(subject);
      adapter.setRoute({ stops: ["a", "b"], style: { stroke: "#ff0000" } });
      await probe.settle();
      expect(routes()).toHaveLength(1);
    });
  });
}
