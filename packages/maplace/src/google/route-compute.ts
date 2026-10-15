/// <reference types="google.maps" />
import type { Journey } from "../adapter-kit/journey";
import type { RouteResult } from "../route";
import { loadRoutesLibrary } from "./libraries";
import { routeFailed, routeRequest, routeResultOf } from "./route-conversions";

/** Google's route, which draws the line, and what the store is told. */
export interface ComputedRoute {
  readonly google: google.maps.routes.Route;
  readonly result: RouteResult;
}

/**
 * One computation, billed by Google. Every way it can fail rejects with one `route-failed`,
 * Google's own error as its cause: a Routes API the key may not use, a journey with no route
 * (stops at sea), a Maps JS too old for Routes.
 */
export async function computeRoute(journey: Journey): Promise<ComputedRoute> {
  const Route = await routeClass();
  const answer = await Route.computeRoutes(routeRequest(journey)).catch((cause: unknown) => {
    throw routeFailed("Google couldn't compute the route", cause);
  });
  const route = answer.routes?.[0];
  if (route === undefined) throw routeFailed("Google found no route through the stops");
  return { google: route, result: routeResultOf(route, journey.stops) };
}

/** Google's `Route`, from Maps JS 3.63 on. */
async function routeClass(): Promise<typeof google.maps.routes.Route> {
  const library = await loadRoutesLibrary().catch((cause: unknown) => {
    throw routeFailed("Google's routes library failed to load", cause);
  });
  // Typed as always there; Maps JS before 3.63 has the library without it.
  const Route = library.Route as typeof library.Route | undefined;
  if (Route === undefined) throw routeFailed("Google's routes need Maps JS 3.63 or later");
  return Route;
}
