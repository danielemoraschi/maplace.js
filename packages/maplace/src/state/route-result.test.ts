import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import type { RouteResult } from "../route";
import { NO_CHANGE } from "./change";
import { initialSnapshot } from "./initial";
import { setRouteResult } from "./route-result";

const locations: Location[] = ["a", "b", "c"].map((id) => ({ id, lat: 0, lng: 0 }));
const routed = { ...initialSnapshot({ locations }), route: { stops: ["a", "b", "c"] } };
const leg = (from: string, to: string) => ({ from, to, distanceMeters: 1, durationSeconds: 1 });
const result: RouteResult = {
  legs: [leg("a", "b"), leg("b", "c")],
  distanceMeters: 2,
  durationSeconds: 2,
  path: [{ lat: 0, lng: 0 }],
};

describe("setRouteResult", () => {
  it("stores a frozen copy and fires route with it", () => {
    const change = setRouteResult(routed, result);
    const stored = change.patch.routeResult;
    expect(stored).toEqual(result);
    expect(Object.isFrozen(stored?.legs[0])).toBe(true);
    expect(change.events).toEqual([{ name: "route", payload: { result: stored } }]);
  });

  it("clears a stored result", () => {
    expect(setRouteResult({ ...routed, routeResult: result }, undefined)).toEqual({
      patch: { routeResult: undefined },
      events: [{ name: "route", payload: { result: undefined } }],
    });
  });

  it("changes nothing without a route, when already clear, or for a stale result", () => {
    expect(setRouteResult({ ...routed, route: undefined }, result)).toBe(NO_CHANGE);
    expect(setRouteResult(routed, undefined)).toBe(NO_CHANGE);
    const reordered = { ...routed, route: { stops: ["a", "c", "b"] } };
    expect(setRouteResult(reordered, result)).toBe(NO_CHANGE);
    const shorter = { ...routed, route: { stops: ["a", "b"] } };
    expect(setRouteResult(shorter, result)).toBe(NO_CHANGE);
  });
});
