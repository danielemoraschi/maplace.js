import { MaplaceError } from "../errors";
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

/** The values added up. */
export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** A route that can't be reported: the reason, and the provider's own error when there is one. */
export function routeFailed(reason: string, cause?: unknown): MaplaceError {
  return new MaplaceError("route-failed", `setRoute: ${reason}`, { cause });
}
