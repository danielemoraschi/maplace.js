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
  readonly style?: LineStyle | undefined;
}

type RouteStops = Pick<Route, "stops" | "via">;

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
