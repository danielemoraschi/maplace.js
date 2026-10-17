import { frozenPath } from "../diff/frozen";
import type { Route, RouteResult } from "../route";
import type { Snapshot } from "../store";
import { type Change, NO_CHANGE } from "./change";

/**
 * A route the map computed, or cleared (`undefined`): stored as a frozen copy, then `routeChange`
 * fires. A result whose legs don't run through the current stops was computed before they
 * changed, a race like an unknown id: no change. So is any result while no route is set.
 */
export function setRouteResult<Data>(
  snapshot: Snapshot<Data>,
  result: RouteResult | undefined,
): Change<Data> {
  const { route } = snapshot;
  if (route === undefined) return NO_CHANGE;
  if (result === undefined && snapshot.routeResult === undefined) return NO_CHANGE;
  if (result !== undefined && !runsThrough(result, route)) return NO_CHANGE;
  const routeResult = result && frozenResult(result);
  return {
    patch: { routeResult },
    events: [{ name: "routeChange", payload: { result: routeResult } }],
  };
}

function runsThrough({ legs }: RouteResult, { stops }: Route): boolean {
  return (
    legs.length === stops.length - 1 &&
    legs.every((leg, index) => leg.from === stops[index] && leg.to === stops[index + 1])
  );
}

function frozenResult(result: RouteResult): RouteResult {
  return Object.freeze({
    legs: Object.freeze(result.legs.map((leg) => Object.freeze({ ...leg }))),
    distanceMeters: result.distanceMeters,
    durationSeconds: result.durationSeconds,
    path: frozenPath(result.path),
  });
}
