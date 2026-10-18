import type { LatLng } from "../geometry";
import { type Route, sameStops, type TravelMode } from "../route";
import { sameList, samePoint } from "./same-geometry";

/**
 * What a route is computed for, on every map alike: a new journey is a new computation (billed,
 * on a provider), while a new style alone isn't one.
 */
export interface Journey {
  readonly stops: readonly string[];
  /** Inner stops passed through (`Route.via`). */
  readonly via: readonly string[] | undefined;
  readonly travelMode: TravelMode | undefined;
  /** Where each stop is on the map, in order. */
  readonly points: readonly LatLng[];
}

/** Where a stop is on the map, if it is there: its anchor, the point its popup points at. */
export type StopPoint = (id: string) => LatLng | undefined;

/** The journey through the stops where they are; undefined until every stop is on the map. */
export function journeyOf(route: Route, pointOf: StopPoint): Journey | undefined {
  const points: LatLng[] = [];
  for (const stop of route.stops) {
    const point = pointOf(stop);
    if (point === undefined) return undefined;
    points.push(point);
  }
  return { stops: route.stops, via: route.via, travelMode: route.travelMode, points };
}

/**
 * Whether `next` was computed already: the same stops, in order, the same ones ending legs, at
 * the same points.
 */
export function sameJourney(last: Journey | undefined, next: Journey): boolean {
  return (
    last !== undefined &&
    last.travelMode === next.travelMode &&
    sameStops(last, next) &&
    sameList(last.points, next.points, samePoint)
  );
}
