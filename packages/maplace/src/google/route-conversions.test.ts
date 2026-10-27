// @vitest-environment happy-dom
/// <reference types="google.maps" />
import { describe, expect, it } from "vitest";
import type { Journey } from "../adapter-kit/journey";
import type { LatLng } from "../geometry";
import type { Avoidance, TravelMode } from "../route";
import { ROUTE_FIELDS, routeRequest, routeResultOf } from "./route-conversions";
import { routeFailure, type StubLeg, type StubStep, stubLeg } from "./testing/stub-routes";

const BOLOGNA = { lat: 44.49, lng: 11.34 };
const MODENA = { lat: 44.65, lng: 10.93 };
const FERRARA = { lat: 44.84, lng: 11.62 };

/** A journey through `points`, its stops named `s0`, `s1` and on. */
function journey(points: readonly LatLng[], travelMode?: TravelMode, via?: string[]): Journey {
  return {
    stops: points.map((_, index) => `s${index}`),
    via,
    travelMode,
    avoid: undefined,
    points,
  };
}

/** Google's route as far as the conversion reads it. */
function googleRoute(legs: StubLeg[], path: LatLng[] = []): google.maps.routes.Route {
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

  it("passes through a via stop, leaving the others stopovers as Google's default", () => {
    const request = routeRequest(journey([BOLOGNA, MODENA, FERRARA, BOLOGNA], undefined, ["s1"]));
    expect(request.intermediates).toStrictEqual([
      { location: MODENA, via: true },
      { location: FERRARA },
    ]);
  });

  it("names each travel mode as Google does, leaving none to Google's default", () => {
    const modeOf = (mode?: TravelMode) => routeRequest(journey([BOLOGNA, FERRARA], mode));
    expect(modeOf("driving").travelMode).toBe("DRIVING");
    expect(modeOf("walking").travelMode).toBe("WALKING");
    expect(modeOf("bicycling").travelMode).toBe("BICYCLING");
    expect(modeOf("transit").travelMode).toBe("TRANSIT");
    expect(modeOf()).not.toHaveProperty("travelMode");
  });

  it("asks Google to avoid each, on a driving route or one with no travel mode", () => {
    const avoiding = (travelMode?: TravelMode) =>
      routeRequest({
        ...journey([BOLOGNA, FERRARA], travelMode),
        avoid: ["tolls", "highways", "ferries"],
      });
    const everything = { avoidTolls: true, avoidHighways: true, avoidFerries: true };
    expect(avoiding("driving").routeModifiers).toEqual(everything);
    expect(avoiding().routeModifiers).toEqual(everything);
  });

  it("names each thing avoided as Google's own modifier", () => {
    const modifiersOf = (avoided: Avoidance) =>
      routeRequest({ ...journey([BOLOGNA, FERRARA]), avoid: [avoided] }).routeModifiers;
    expect(modifiersOf("tolls")).toEqual({ avoidTolls: true });
    expect(modifiersOf("highways")).toEqual({ avoidHighways: true });
    expect(modifiersOf("ferries")).toEqual({ avoidFerries: true });
  });

  it("sends no modifiers when nothing is avoided, or on another travel mode", () => {
    const avoiding = (avoid: Journey["avoid"], travelMode?: TravelMode) =>
      routeRequest({ ...journey([BOLOGNA, FERRARA], travelMode), avoid });
    expect(avoiding([])).not.toHaveProperty("routeModifiers");
    for (const mode of ["walking", "bicycling", "transit"] as const) {
      expect(avoiding(["tolls"], mode)).not.toHaveProperty("routeModifiers");
    }
  });
});

describe("routeResultOf", () => {
  it("gives each leg its stops, in metres and seconds, with the totals and path", () => {
    const route = googleRoute(
      [stubLeg(40_000, 1_800_500), stubLeg(60_000, 2_700_000)],
      [BOLOGNA, MODENA, FERRARA],
    );
    expect(routeResultOf(route, { stops: ["b", "m", "f"] })).toEqual({
      legs: [
        {
          from: "b",
          to: "m",
          distanceMeters: 40_000,
          durationSeconds: 1_800.5,
          steps: [{ instruction: "Head north", distanceMeters: 40_000, durationSeconds: 1_800.5 }],
        },
        {
          from: "m",
          to: "f",
          distanceMeters: 60_000,
          durationSeconds: 2_700,
          steps: [{ instruction: "Head north", distanceMeters: 60_000, durationSeconds: 2_700 }],
        },
      ],
      distanceMeters: 100_000,
      durationSeconds: 4_500.5,
      path: [BOLOGNA, MODENA, FERRARA],
    });
  });

  it("fails the route when a leg has no finite duration, never reporting a made-up one", () => {
    for (const durationMillis of [null, undefined, Number.POSITIVE_INFINITY]) {
      const route = googleRoute([stubLeg(40_000, durationMillis)]);
      expect(() => routeResultOf(route, { stops: ["b", "m"] })).toThrow(
        routeFailure('setRoute: Google gave no duration between "b" and "m"'),
      );
    }
  });

  it("gives each leg its steps in order, in metres and seconds", () => {
    const steps: StubStep[] = [
      { instructions: "Head north", distanceMeters: 300, staticDurationMillis: 30_500 },
      { instructions: "Turn left", distanceMeters: 700, staticDurationMillis: 29_500 },
    ];
    const route = googleRoute([stubLeg(1000, 60_000, steps)]);
    expect(routeResultOf(route, { stops: ["b", "m"] }).legs[0]?.steps).toEqual([
      { instruction: "Head north", distanceMeters: 300, durationSeconds: 30.5 },
      { instruction: "Turn left", distanceMeters: 700, durationSeconds: 29.5 },
    ]);
  });

  it("keeps a step Google words no instruction for, its instruction undefined", () => {
    for (const instructions of [null, ""]) {
      const steps = [{ instructions, distanceMeters: 1000, staticDurationMillis: 60_000 }];
      const route = googleRoute([stubLeg(1000, 60_000, steps)]);
      expect(routeResultOf(route, { stops: ["b", "m"] }).legs[0]?.steps).toEqual([
        { instruction: undefined, distanceMeters: 1000, durationSeconds: 60 },
      ]);
    }
  });

  it("fails the route when a step has no finite duration", () => {
    for (const staticDurationMillis of [null, undefined, Number.POSITIVE_INFINITY]) {
      const steps = [{ instructions: "Go", distanceMeters: 1000, staticDurationMillis }];
      const route = googleRoute([stubLeg(1000, 60_000, steps)]);
      expect(() => routeResultOf(route, { stops: ["b", "m"] })).toThrow(
        routeFailure('setRoute: Google gave no duration for a step between "b" and "m"'),
      );
    }
  });

  it("names one leg past a via stop by the stops that end it", () => {
    const passing = { stops: ["b", "m", "f"], via: ["m"] };
    const route = googleRoute([stubLeg(100_000, 4_500_000)]);
    expect(routeResultOf(route, passing).legs).toEqual([
      expect.objectContaining({ from: "b", to: "f" }),
    ]);
    const twoLegs = googleRoute([stubLeg(1, 1), stubLeg(1, 1)]);
    expect(() => routeResultOf(twoLegs, passing)).toThrow(
      routeFailure("Google's legs don't run between the 2 stops"),
    );
  });

  it("fails the route when Google's legs don't match the stops", () => {
    const route = googleRoute([stubLeg(1, 1)]);
    expect(() => routeResultOf(route, { stops: ["b", "m", "f"] })).toThrow(
      routeFailure("Google's legs don't run between the 3 stops"),
    );
  });
});
