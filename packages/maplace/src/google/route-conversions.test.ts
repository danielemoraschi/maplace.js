// @vitest-environment happy-dom
/// <reference types="google.maps" />
import { describe, expect, it } from "vitest";
import type { Journey } from "../adapter-kit/journey";
import type { LatLng } from "../geometry";
import type { TravelMode } from "../route";
import { ROUTE_FIELDS, routeRequest, routeResultOf } from "./route-conversions";
import { routeFailure } from "./testing/stub-routes";

const BOLOGNA = { lat: 44.49, lng: 11.34 };
const MODENA = { lat: 44.65, lng: 10.93 };
const FERRARA = { lat: 44.84, lng: 11.62 };

function journey(points: readonly LatLng[], travelMode?: TravelMode): Journey {
  return { stops: points.map((_, index) => `s${index}`), travelMode, points };
}

/** Google's route as far as the conversion reads it. */
function googleRoute(
  legs: { distanceMeters: number; durationMillis: number | null | undefined }[],
  path: LatLng[] = [],
): google.maps.routes.Route {
  const withAltitude = path.map((point) => ({ toJSON: () => ({ ...point, altitude: 0 }) }));
  return { legs, path: withAltitude } as unknown as google.maps.routes.Route;
}

describe("routeRequest", () => {
  it("goes from the first stop to the last, with no intermediates for two", () => {
    expect(routeRequest(journey([BOLOGNA, FERRARA]))).toEqual({
      origin: BOLOGNA,
      destination: FERRARA,
      intermediates: [],
      fields: ROUTE_FIELDS,
    });
  });

  it("passes through the stops between, in order", () => {
    const request = routeRequest(journey([BOLOGNA, MODENA, FERRARA, BOLOGNA]));
    expect(request.intermediates).toEqual([{ location: MODENA }, { location: FERRARA }]);
    expect(request.destination).toEqual(BOLOGNA);
  });

  it("names each travel mode as Google does, leaving none to Google's default", () => {
    const modeOf = (mode?: TravelMode) => routeRequest(journey([BOLOGNA, FERRARA], mode));
    expect(modeOf("driving").travelMode).toBe("DRIVING");
    expect(modeOf("walking").travelMode).toBe("WALKING");
    expect(modeOf("bicycling").travelMode).toBe("BICYCLING");
    expect(modeOf("transit").travelMode).toBe("TRANSIT");
    expect(modeOf()).not.toHaveProperty("travelMode");
  });
});

describe("routeResultOf", () => {
  it("gives each leg its stops, in metres and seconds, with the totals and path", () => {
    const route = googleRoute(
      [
        { distanceMeters: 40_000, durationMillis: 1_800_500 },
        { distanceMeters: 60_000, durationMillis: 2_700_000 },
      ],
      [BOLOGNA, MODENA, FERRARA],
    );
    expect(routeResultOf(route, ["b", "m", "f"])).toEqual({
      legs: [
        { from: "b", to: "m", distanceMeters: 40_000, durationSeconds: 1_800.5 },
        { from: "m", to: "f", distanceMeters: 60_000, durationSeconds: 2_700 },
      ],
      distanceMeters: 100_000,
      durationSeconds: 4_500.5,
      path: [BOLOGNA, MODENA, FERRARA],
    });
  });

  it("fails the route when a leg has no finite duration, never reporting a made-up one", () => {
    for (const durationMillis of [null, undefined, Number.POSITIVE_INFINITY]) {
      const route = googleRoute([{ distanceMeters: 40_000, durationMillis }]);
      expect(() => routeResultOf(route, ["b", "m"])).toThrow(
        routeFailure('setRoute: Google gave no duration between "b" and "m"'),
      );
    }
  });

  it("fails the route when Google's legs don't match the stops", () => {
    const route = googleRoute([{ distanceMeters: 1, durationMillis: 1 }]);
    expect(() => routeResultOf(route, ["b", "m", "f"])).toThrow(
      routeFailure("Google's legs don't run between the 3 stops"),
    );
  });
});
