import type { LatLng } from "./geometry";
import type { LineStyle } from "./style";

export type TravelMode = "driving" | "walking" | "bicycling" | "transit";

/** One route through your own locations, in order. Needs the `route` capability. */
export interface Route {
  /** Location ids, at least 2; the adapter sets the maximum (`Adapter.routeStopLimit`). */
  readonly stops: readonly string[];
  /**
   * Inner stops (ids among the stops between the first and the last) the route passes through
   * without ending a leg; every inner occurrence of such an id passes through. Each still counts
   * toward `routeStopLimit`.
   */
  readonly via?: readonly string[] | undefined;
  /** Driving when left out. */
  readonly travelMode?: TravelMode | undefined;
  /**
   * What the route keeps off where it reasonably can, in any order; nothing when left out. A
   * provider applies it to the travel modes it can (Google: driving only).
   */
  readonly avoid?: readonly ("tolls" | "highways" | "ferries")[] | undefined;
  readonly style?: LineStyle | undefined;
}

/** One thing a route can keep off: an item of `Route.avoid`. */
export type Avoidance = NonNullable<Route["avoid"]>[number];

type RouteStops = Pick<Route, "stops" | "via">;
type RouteAsked = Pick<Route, "stops" | "via" | "travelMode" | "avoid">;

/** The stops between the first and the last: those a route may pass through. */
export function innerStops(stops: readonly string[]): readonly string[] {
  return stops.slice(1, -1);
}

/** Whether the stop at `index` is one the route passes through: an inner stop named in `via`. */
export function passesThrough({ stops, via }: RouteStops, index: number): boolean {
  return index > 0 && index < stops.length - 1 && (via?.includes(stops[index] as string) ?? false);
}

/** The stops the legs run between, in order: every stop the route doesn't pass through. */
export function legStops(route: RouteStops): readonly string[] {
  return route.stops.filter((_, index) => !passesThrough(route, index));
}

/** The same stops in order, passing through the same ones: what a computed route's legs follow. */
export function sameStops(a: RouteStops, b: RouteStops): boolean {
  return (
    a.stops.length === b.stops.length &&
    a.stops.every(
      (id, index) => id === b.stops[index] && passesThrough(a, index) === passesThrough(b, index),
    )
  );
}

/**
 * Whether two routes ask for the same computation: the same stops in order, the same ones passed
 * through, the same travel mode and the same things avoided. Their style isn't part of it.
 */
export function sameComputation(a: RouteAsked, b: RouteAsked): boolean {
  return a.travelMode === b.travelMode && sameStops(a, b) && sameAvoid(a, b);
}

/** The same things avoided, in any order and however often named; none named is an empty list. */
export function sameAvoid(a: Pick<Route, "avoid">, b: Pick<Route, "avoid">): boolean {
  return avoidsAllOf(a, b) && avoidsAllOf(b, a);
}

function avoidsAllOf(route: Pick<Route, "avoid">, other: Pick<Route, "avoid">): boolean {
  return (other.avoid ?? []).every((item) => route.avoid?.includes(item));
}

/** Whether the legs run between the stops that end legs, those the route doesn't pass through. */
export function runsThrough(legs: readonly RouteLeg[], route: RouteStops): boolean {
  const ends = legStops(route);
  return (
    legs.length === ends.length - 1 &&
    legs.every((leg, index) => leg.from === ends[index] && leg.to === ends[index + 1])
  );
}

export interface RouteLeg {
  readonly from: string;
  readonly to: string;
  readonly distanceMeters: number;
  readonly durationSeconds: number;
  /** In order, from `from` to `to`. */
  readonly steps: readonly RouteStep[];
}

/** One turn-by-turn instruction of a leg, so a page can render its own directions. */
export interface RouteStep {
  /**
   * What to do here, as the provider words it, in the map's language; undefined when it gives
   * none.
   */
  readonly instruction: string | undefined;
  readonly distanceMeters: number;
  /** Without traffic. */
  readonly durationSeconds: number;
}

/** A computed route, in neutral units; never a provider object. */
export interface RouteResult {
  readonly legs: readonly RouteLeg[];
  readonly distanceMeters: number;
  readonly durationSeconds: number;
  readonly path: readonly LatLng[];
}
