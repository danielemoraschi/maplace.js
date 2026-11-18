import { type Journey, journeyOf, type StopPoint, sameJourney } from "../../adapter-kit/journey";
import type { Route, RouteResult } from "../../route";
import { requestStopsOf } from "../../route-request";
import { straightRoute } from "../straight-routes";

/** A computed route and the route it answers. */
export interface FakeRouteAnswer {
  readonly route: Route;
  readonly result: RouteResult;
}

/** The route asked for, computed when the map settles, as a provider answers later. */
export interface FakeRouting {
  set(route: Route | undefined): void;
  /**
   * The answer for a journey not computed yet (a new style alone isn't one); none while a stop
   * is still to be drawn.
   */
  settle(pointOf: StopPoint): FakeRouteAnswer | undefined;
}

export function createFakeRouting(): FakeRouting {
  let route: Route | undefined;
  let computed: Journey | undefined;
  return {
    set(next) {
      route = next;
      if (next === undefined) computed = undefined;
    },
    settle(pointOf) {
      if (route === undefined) return undefined;
      const journey = journeyOf(route, pointOf);
      if (journey === undefined || sameJourney(computed, journey)) return undefined;
      computed = journey;
      return {
        route,
        result: straightRoute(requestStopsOf(journey, journey.points), journey.travelMode),
      };
    },
  };
}
