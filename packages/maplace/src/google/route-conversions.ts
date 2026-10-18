/// <reference types="google.maps" preserve="true" />

import type { Journey } from "../adapter-kit/journey";
import { withTotals } from "../adapter-kit/route-result";
import { MaplaceError } from "../errors";
import {
  legStops,
  passesThrough,
  type Route,
  type RouteLeg,
  type RouteResult,
  type RouteStep,
  type TravelMode,
} from "../route";
import { latLngOf } from "./lat-lng";

/** Google's Routes take 25 intermediate stops, besides the origin and the destination. */
export const ROUTE_STOP_LIMIT = 27;

/**
 * What the result is read from and the line drawn with: Google answers only these. Whole legs:
 * Maps JS 3.66 refuses a leg's own fields (`legs.distanceMeters`), transit's line needs them, and
 * they carry their steps.
 */
export const ROUTE_FIELDS = ["legs", "path"];

const GOOGLE_TRAVEL_MODES: Readonly<Record<TravelMode, google.maps.TravelModeString>> = {
  driving: "DRIVING",
  walking: "WALKING",
  bicycling: "BICYCLING",
  transit: "TRANSIT",
};

/**
 * The journey as Google's request: no travel mode is Google's default, driving, and a stop
 * passed through is one of Google's via waypoints, every other one a stopover.
 */
export function routeRequest(journey: Journey): google.maps.routes.ComputeRoutesRequest {
  const [origin, ...after] = journey.points;
  const destination = after.pop();
  return {
    origin: origin as google.maps.LatLngLiteral,
    destination: destination as google.maps.LatLngLiteral,
    intermediates: after.map((location, index) => waypointOf(location, index + 1, journey)),
    fields: ROUTE_FIELDS,
    ...(journey.travelMode && { travelMode: GOOGLE_TRAVEL_MODES[journey.travelMode] }),
  };
}

/**
 * Google's answer for `route` in maplace's terms: a leg between each two stops that end legs, in
 * metres and seconds.
 */
export function routeResultOf(
  answer: google.maps.routes.Route,
  route: Pick<Route, "stops" | "via">,
): RouteResult {
  const legs = answer.legs ?? [];
  const ends = legStops(route);
  if (legs.length !== ends.length - 1) {
    throw routeFailed(`Google's legs don't run between the ${ends.length} stops`);
  }
  const named = legs.map((leg, index) =>
    legOf(leg, ends[index] as string, ends[index + 1] as string),
  );
  return withTotals(named, (answer.path ?? []).map(latLngOf));
}

/** A route that can't be reported: the reason, and Google's own error when there is one. */
export function routeFailed(reason: string, cause?: unknown): MaplaceError {
  return new MaplaceError("route-failed", `setRoute: ${reason}`, { cause });
}

/** The stop at `index`, where Google passes through it or stops over (its default). */
function waypointOf(
  location: google.maps.LatLngLiteral,
  index: number,
  journey: Journey,
): google.maps.routes.Waypoint {
  return passesThrough(journey, index) ? { location, via: true } : { location };
}

function legOf(leg: google.maps.routes.RouteLeg, from: string, to: string): RouteLeg {
  const between = `between "${from}" and "${to}"`;
  return {
    from,
    to,
    distanceMeters: leg.distanceMeters,
    durationSeconds: durationSecondsOf(leg.durationMillis, between),
    steps: leg.steps.map((step) => stepOf(step, between)),
  };
}

/** A step's duration is without traffic, the only one Google gives a step. */
function stepOf(step: google.maps.routes.RouteLegStep, between: string): RouteStep {
  return {
    // `||`, not `??`: an empty instruction is no instruction.
    instruction: step.instructions || undefined,
    distanceMeters: step.distanceMeters,
    durationSeconds: durationSecondsOf(step.staticDurationMillis, `for a step ${between}`),
  };
}

/**
 * A duration Google gave no finite value for (none when it can't tell, infinity past 2^53 ms)
 * fails the route: never a made-up number.
 */
function durationSecondsOf(millis: number | null | undefined, what: string): number {
  if (typeof millis !== "number" || !Number.isFinite(millis)) {
    throw routeFailed(`Google gave no duration ${what}`);
  }
  return millis / 1000;
}
