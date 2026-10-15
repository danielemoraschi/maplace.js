import { type Journey, journeyOf, type StopPoint, sameJourney } from "../../adapter-kit/journey";
import { withTotals } from "../../adapter-kit/route-result";
import type { LatLng } from "../../geometry";
import type { Route, RouteLeg, RouteResult, TravelMode } from "../../route";

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
   * The result for a journey not computed yet (a new style alone isn't one); none while a stop
   * is still to be drawn.
   */
  settle(pointOf: StopPoint): RouteResult | undefined;
}

export function createRouting(): FakeRouting {
  let route: Route | undefined;
  let computed: Journey | undefined;
  return {
    set(next) {
      route = next;
      if (next === undefined) computed = undefined;
    },
    settle(pointOf) {
      const journey = route && journeyOf(route, pointOf);
      if (journey === undefined || sameJourney(computed, journey)) return undefined;
      computed = journey;
      return straightRoute(journey);
    },
  };
}

/** A straight-line route through the stops. */
function straightRoute({ stops, travelMode, points }: Journey): RouteResult {
  const speed = SPEED_BY_MODE[travelMode ?? "driving"];
  const legs: RouteLeg[] = stops.slice(1).map((to, index) => {
    const distanceMeters = distanceBetween(points[index] as LatLng, points[index + 1] as LatLng);
    return {
      from: stops[index] as string,
      to,
      distanceMeters,
      durationSeconds: distanceMeters / speed,
    };
  });
  return withTotals(legs, points);
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
