import type { LatLng } from "../../geometry";
import type { Route, RouteLeg, RouteResult, TravelMode } from "../../route";

/** Where a stop's location is pinned, if the map has it yet. */
export type AnchorOf = (id: string) => LatLng | undefined;

/** Metres per second for each travel mode: a straight line at a steady speed. */
const SPEED_BY_MODE: Readonly<Record<TravelMode, number>> = {
  driving: 14,
  bicycling: 5,
  walking: 1.4,
  transit: 10,
};
const EARTH_RADIUS_METERS = 6_371_000;

/** The route asked for, computed when the map settles, as a provider answers later. */
export interface FakeRouting {
  set(route: Route | undefined): void;
  /**
   * The result for the route asked for, once its stops are on the map; then none until asked
   * again.
   */
  settle(anchorOf: AnchorOf): RouteResult | undefined;
}

export function createRouting(): FakeRouting {
  let pending: Route | undefined;
  return {
    set(route) {
      pending = route;
    },
    settle(anchorOf) {
      const result = pending && straightRoute(pending, anchorOf);
      // A stop still being drawn: the provider answers once it has them all.
      if (result) pending = undefined;
      return result;
    },
  };
}

/** A straight-line route through the stops; undefined when a stop isn't on the map. */
function straightRoute(route: Route, anchorOf: AnchorOf): RouteResult | undefined {
  const points = route.stops.map(anchorOf);
  if (points.includes(undefined)) return undefined;
  const path = points as LatLng[];
  const speed = SPEED_BY_MODE[route.travelMode ?? "driving"];
  const legs: RouteLeg[] = route.stops.slice(1).map((to, index) => {
    const distanceMeters = distanceBetween(path[index] as LatLng, path[index + 1] as LatLng);
    return {
      from: route.stops[index] as string,
      to,
      distanceMeters,
      durationSeconds: distanceMeters / speed,
    };
  });
  return {
    legs,
    distanceMeters: sum(legs.map((leg) => leg.distanceMeters)),
    durationSeconds: sum(legs.map((leg) => leg.durationSeconds)),
    path,
  };
}

/** Great-circle distance (haversine). */
function distanceBetween(from: LatLng, to: LatLng): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to.lat - from.lat);
  const dLng = radians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
