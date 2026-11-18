import type { LatLng } from "./geometry";
import {
  type Avoidance,
  passesThrough,
  type Route,
  type RouteResult,
  type TravelMode,
} from "./route";

/**
 * One stop of a route to compute: the location's id, where it is drawn now, and whether it's
 * passed through.
 */
export interface RouteRequestStop extends LatLng {
  readonly id: string;
  /** Passed through without ending a leg (`Route.via`): the legs run between the other stops. */
  readonly via: boolean;
}

/** What a page's routing function is asked: one route through the stops, in order. */
export interface RouteRequest {
  /** The route's stops, in order, each where its location is drawn (its anchor). */
  readonly stops: readonly RouteRequestStop[];
  /** `"driving"` when the route leaves it out. */
  readonly travelMode: TravelMode;
  /** What the route keeps off where it reasonably can; empty when the route leaves it out. */
  readonly avoid: readonly Avoidance[];
  /** Aborted once the answer would be dropped: the route changed or was cleared, or the map closed. */
  readonly signal: AbortSignal;
}

/**
 * A page's answer: the legs between the stops that end legs (every stop not passed through), in
 * order, and the path the route follows, at least 2 points. The totals are the legs'; the answer's
 * other fields are ignored, so a whole `RouteResult` fits too, but a leg or a step with a field of
 * its own fails the route.
 */
export type RouteAnswer = Pick<RouteResult, "legs" | "path">;

/** A page's own routing, for a map whose provider has none of its own (MapLibre). */
export type RouteComputer = (request: RouteRequest) => Promise<RouteAnswer>;

/**
 * A route's stops as a routing function is asked them: each where it is (`points`, in order),
 * passed through or not.
 */
export function requestStopsOf(
  route: Pick<Route, "stops" | "via">,
  points: readonly LatLng[],
): RouteRequestStop[] {
  return route.stops.map((id, index) => ({
    id,
    ...(points[index] as LatLng),
    via: passesThrough(route, index),
  }));
}
