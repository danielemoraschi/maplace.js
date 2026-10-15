/// <reference types="google.maps" />
import { expect, vi } from "vitest";
import { stubMapsJs } from "./stub-libraries";
import { StubPolyline } from "./stub-shapes";

/** The look Google gives a route's polylines before the adapter's options. */
export const STUB_ROUTE_LOOK: google.maps.PolylineOptions = { strokeColor: "#4285f4" };

/** One leg as Google gives it: metres, and milliseconds or `null` when Google can't tell. */
interface StubLeg {
  readonly distanceMeters: number;
  readonly durationMillis: number | null;
}

type PolylineOptionsOf = (
  defaults: google.maps.PolylineOptions,
  details: google.maps.routes.RoutePolylineDetails,
) => google.maps.PolylineOptions;

/** A route Google computed, of one leg with no path, and one polyline per `createPolylines`. */
export class StubRoute {
  readonly legs: readonly StubLeg[];
  readonly path = [];
  readonly createPolylines = vi.fn(
    ({ polylineOptions }: { polylineOptions: PolylineOptionsOf }) => {
      const polyline = new StubPolyline();
      polyline.setValues(
        polylineOptions(STUB_ROUTE_LOOK, {} as google.maps.routes.RoutePolylineDetails),
      );
      return [polyline];
    },
  );

  constructor(leg: StubLeg = { distanceMeters: 1000, durationMillis: 60_000 }) {
    this.legs = [leg];
  }
}

/**
 * Google's routes library: each `computeRoutes` stays open until the test answers it or fails
 * it, oldest first, as Google answers over the network.
 */
export function stubRoutes() {
  const open: { answer(routes: StubRoute[]): void; fail(error: unknown): void }[] = [];
  const computeRoutes = vi.fn(
    (_request: google.maps.routes.ComputeRoutesRequest) =>
      new Promise<{ routes: StubRoute[] }>((resolve, reject) => {
        open.push({ answer: (routes) => resolve({ routes }), fail: reject });
      }),
  );
  const library = { Route: { computeRoutes } } as unknown as google.maps.RoutesLibrary;
  return {
    library,
    computeRoutes,
    /** Answers the oldest open request with `route`, or with no route at all. */
    answer(route?: StubRoute): void {
      open.shift()?.answer(route ? [route] : []);
    },
    fail(error: unknown): void {
      open.shift()?.fail(error);
    },
  };
}

/** A Maps JS on the page whose routes library is `stubRoutes()`, given back to answer with. */
export function routesOnPage() {
  const routes = stubRoutes();
  stubMapsJs(undefined, { routes: routes.library });
  return routes;
}

/** The error a route fails with, its message holding `message`. */
export const routeFailure = (message: string) =>
  expect.objectContaining({ code: "route-failed", message: expect.stringContaining(message) });
