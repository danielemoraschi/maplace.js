import { frozenPath } from "../diff/frozen";
import { legStops, type Route, type RouteLeg, type RouteResult } from "../route";
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

/** Whether the legs run between the stops that end legs, those the route doesn't pass through. */
function runsThrough({ legs }: RouteResult, route: Route): boolean {
  const ends = legStops(route);
  return (
    legs.length === ends.length - 1 &&
    legs.every((leg, index) => leg.from === ends[index] && leg.to === ends[index + 1])
  );
}

function frozenResult(result: RouteResult): RouteResult {
  return Object.freeze({
    legs: Object.freeze(result.legs.map(frozenLeg)),
    distanceMeters: result.distanceMeters,
    durationSeconds: result.durationSeconds,
    path: frozenPath(result.path),
  });
}

function frozenLeg(leg: RouteLeg): RouteLeg {
  const steps = Object.freeze(leg.steps.map((step) => Object.freeze({ ...step })));
  return Object.freeze({ ...leg, steps });
}
