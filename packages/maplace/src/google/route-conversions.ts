/// <reference types="google.maps" preserve="true" />

import type { Journey } from "../adapter-kit/journey";
import { withTotals } from "../adapter-kit/route-result";
import { MaplaceError } from "../errors";
import type { RouteLeg, RouteResult, TravelMode } from "../route";
import { latLngOf } from "./lat-lng";

/** Google's Routes take 25 intermediate stops, besides the origin and the destination. */
export const ROUTE_STOP_LIMIT = 27;

/**
 * What the result is read from and the line drawn with: Google answers only these. Whole legs:
 * Maps JS 3.66 refuses a leg's own fields (`legs.distanceMeters`), and transit's line needs them.
 */
export const ROUTE_FIELDS = ["legs", "path"];

const GOOGLE_TRAVEL_MODES: Readonly<Record<TravelMode, google.maps.TravelModeString>> = {
  driving: "DRIVING",
  walking: "WALKING",
  bicycling: "BICYCLING",
  transit: "TRANSIT",
};

/** The journey as Google's request: no travel mode is Google's default, driving. */
export function routeRequest({
  points,
  travelMode,
}: Journey): google.maps.routes.ComputeRoutesRequest {
  const [origin, ...after] = points;
  const destination = after.pop();
  return {
    origin: origin as google.maps.LatLngLiteral,
    destination: destination as google.maps.LatLngLiteral,
    intermediates: after.map((location) => ({ location })),
    fields: ROUTE_FIELDS,
    ...(travelMode && { travelMode: GOOGLE_TRAVEL_MODES[travelMode] }),
  };
}

/** Google's route in maplace's terms: a leg between each two stops, in metres and seconds. */
export function routeResultOf(
  route: google.maps.routes.Route,
  stops: readonly string[],
): RouteResult {
  const legs = route.legs ?? [];
  if (legs.length !== stops.length - 1) {
    throw routeFailed(`Google's legs don't run between the ${stops.length} stops`);
  }
  const ours = legs.map((leg, index) =>
    legOf(leg, stops[index] as string, stops[index + 1] as string),
  );
  return withTotals(ours, (route.path ?? []).map(latLngOf));
}

/** A route that can't be reported: the reason, and Google's own error when there is one. */
export function routeFailed(reason: string, cause?: unknown): MaplaceError {
  return new MaplaceError("route-failed", `setRoute: ${reason}`, { cause });
}

/**
 * A leg Google gave no finite duration for (none when it can't tell, infinity past 2^53 ms) fails
 * the route: never a made-up number.
 */
function legOf(leg: google.maps.routes.RouteLeg, from: string, to: string): RouteLeg {
  const millis: number | null | undefined = leg.durationMillis;
  if (typeof millis !== "number" || !Number.isFinite(millis)) {
    throw routeFailed(`Google gave no duration between "${from}" and "${to}"`);
  }
  return { from, to, distanceMeters: leg.distanceMeters, durationSeconds: millis / 1000 };
}
