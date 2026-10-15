import type { LatLng } from "../geometry";
import type { RouteLeg, RouteResult } from "../route";

/** A route's result from its legs and path: the totals are the legs'. */
export function withTotals(legs: readonly RouteLeg[], path: readonly LatLng[]): RouteResult {
  return {
    legs,
    distanceMeters: sum(legs.map((leg) => leg.distanceMeters)),
    durationSeconds: sum(legs.map((leg) => leg.durationSeconds)),
    path,
  };
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
