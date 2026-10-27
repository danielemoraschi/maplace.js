import { frozenPath } from "../diff/frozen";
import { MaplaceError } from "../errors";
import {
  type Route,
  type RouteLeg,
  type RouteResult,
  runsThrough,
  sameComputation,
} from "../route";
import type { Snapshot } from "../store";
import { child, reject, root } from "../validate/fail";
import { type Change, NO_CHANGE } from "./change";

const LEGS = child(root("reportRouteChange"), "result.legs");

/** What the map reports of a route it computed: the route it was computed for, and the result. */
export interface RouteReport {
  readonly route: Route;
  readonly result: RouteResult | undefined;
}

/**
 * A route the map computed for `route`, or cleared (`undefined`): stored as a frozen copy, then
 * `routeChange` fires. A result for a route but the current one (other stops, `via`, travel mode
 * or `avoid`, or none set) was computed before it changed, a race like an unknown id: no change.
 * A result for the current route whose legs don't run between its stops is the adapter's bug and
 * throws.
 */
export function setRouteResult<Data>(
  snapshot: Snapshot<Data>,
  { route, result }: RouteReport,
): Change<Data> {
  if (!answersCurrentRoute(snapshot, route)) return NO_CHANGE;
  if (result === undefined && snapshot.routeResult === undefined) return NO_CHANGE;
  if (result !== undefined) checkLegs(result, route);
  const routeResult = result && frozenResult(result);
  return {
    patch: { routeResult },
    events: [{ name: "routeChange", payload: { result: routeResult } }],
  };
}

/**
 * A `route-failed` named for a route since replaced or cleared: a race, ignored. Any other error,
 * a load or auth failure above all, counts whatever route it names.
 */
export function isStaleRouteFailure(
  snapshot: Snapshot<unknown>,
  error: unknown,
  route: Route | undefined,
): boolean {
  return (
    route !== undefined &&
    error instanceof MaplaceError &&
    error.code === "route-failed" &&
    !answersCurrentRoute(snapshot, route)
  );
}

/**
 * Whether what the map computed for `route` answers the store's route: the same journey, as a new
 * style alone computes nothing again.
 */
function answersCurrentRoute({ route: current }: Snapshot<unknown>, route: Route): boolean {
  return current !== undefined && sameComputation(current, route);
}

/** Legs that don't fit their own route are the adapter's bug, not a race: it throws. */
function checkLegs({ legs }: RouteResult, route: Route): void {
  if (!runsThrough(legs, route)) {
    reject(LEGS, "must run between the stops that end legs, in order");
  }
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
