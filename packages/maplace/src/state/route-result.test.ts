import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import type { Route, RouteLeg, RouteResult } from "../route";
import { NO_CHANGE } from "./change";
import { initialSnapshot } from "./initial";
import { setRouteResult } from "./route-result";

const locations: Location[] = ["a", "b", "c"].map((id) => ({ id, lat: 0, lng: 0 }));
const ABC: Route = { stops: ["a", "b", "c"] };
const THROUGH: Route = { stops: ["a", "b", "c"], via: ["b"] };
const routed = { ...initialSnapshot({ locations }), route: ABC };
const leg = (from: string, to: string): RouteLeg => ({
  from,
  to,
  distanceMeters: 1,
  durationSeconds: 1,
  steps: [],
});
const result: RouteResult = {
  legs: [leg("a", "b"), leg("b", "c")],
  distanceMeters: 2,
  durationSeconds: 2,
  path: [{ lat: 0, lng: 0 }],
};

describe("setRouteResult", () => {
  it("stores a frozen copy and fires routeChange with it", () => {
    const change = setRouteResult(routed, { route: ABC, result });
    const stored = change.patch.routeResult;
    expect(stored).toEqual(result);
    expect(Object.isFrozen(stored?.legs[0])).toBe(true);
    expect(change.events).toEqual([{ name: "routeChange", payload: { result: stored } }]);
  });

  it("freezes each leg's steps, never keeping the caller's", () => {
    const step = { instruction: "Head north", distanceMeters: 1, durationSeconds: 1 };
    const stepped = { ...result, legs: [{ ...leg("a", "b"), steps: [step] }, leg("b", "c")] };
    const stored = setRouteResult(routed, { route: ABC, result: stepped }).patch.routeResult;
    expect(stored).toEqual(stepped);
    expect(stored?.legs[0]?.steps).not.toBe(stepped.legs[0]?.steps);
    expect(Object.isFrozen(stored?.legs[0]?.steps)).toBe(true);
    expect(Object.isFrozen(stored?.legs[0]?.steps[0])).toBe(true);
  });

  it("takes a result whose legs run between the stops not passed through", () => {
    const passing = { ...routed, route: THROUGH };
    const direct = { ...result, legs: [leg("a", "c")] };
    expect(setRouteResult(passing, { route: THROUGH, result: direct }).patch.routeResult).toEqual(
      direct,
    );
  });

  it("throws for legs that don't run between their route's stops, an adapter's bug", () => {
    const passing = { ...routed, route: THROUGH };
    expect(() => setRouteResult(passing, { route: THROUGH, result })).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message:
          "reportRouteChange: result.legs must run between the stops that end legs, in order",
      }),
    );
  });

  it("clears a stored result", () => {
    const stored = { ...routed, routeResult: result };
    expect(setRouteResult(stored, { route: ABC, result: undefined })).toEqual({
      patch: { routeResult: undefined },
      events: [{ name: "routeChange", payload: { result: undefined } }],
    });
  });

  it("changes nothing without a route, when already clear, or for a stale result", () => {
    expect(setRouteResult({ ...routed, route: undefined }, { route: ABC, result })).toBe(NO_CHANGE);
    expect(setRouteResult(routed, { route: ABC, result: undefined })).toBe(NO_CHANGE);
    const reordered = { ...routed, route: { stops: ["a", "c", "b"] } };
    expect(setRouteResult(reordered, { route: ABC, result })).toBe(NO_CHANGE);
    const shorter = { ...routed, route: { stops: ["a", "b"] } };
    expect(setRouteResult(shorter, { route: ABC, result })).toBe(NO_CHANGE);
  });

  it("drops a result for a route since replaced, though its legs fit", () => {
    const direct = { ...routed, route: { stops: ["a", "c"] } };
    const late = { ...result, legs: [leg("a", "c")] };
    expect(setRouteResult(direct, { route: THROUGH, result: late })).toBe(NO_CHANGE);
  });

  it("drops a result computed for another travel mode", () => {
    const walking = { ...routed, route: { ...ABC, travelMode: "walking" as const } };
    expect(setRouteResult(walking, { route: ABC, result })).toBe(NO_CHANGE);
  });

  it("takes a result for the same journey in a new style, or with via in another order", () => {
    const styled = { ...routed, route: { ...ABC, style: { stroke: "#f00" } } };
    expect(setRouteResult(styled, { route: ABC, result }).patch.routeResult).toEqual(result);
    const stops = ["a", "b", "c", "d"];
    const passing = { ...routed, route: { stops, via: ["b", "c"] } };
    const direct = { ...result, legs: [leg("a", "d")] };
    const report = { route: { stops, via: ["c", "b"] }, result: direct };
    expect(setRouteResult(passing, report).patch.routeResult).toEqual(direct);
  });
});
