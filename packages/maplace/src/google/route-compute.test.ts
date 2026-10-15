// @vitest-environment happy-dom
/// <reference types="google.maps" />
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Journey } from "../adapter-kit/journey";
import { computeRoute } from "./route-compute";
import { routeRequest } from "./route-conversions";
import { stubMapsJs } from "./testing/stub-libraries";
import { routeFailure, routesOnPage, StubRoute } from "./testing/stub-routes";
import { tick as requested } from "./testing/stub-routing";

afterEach(() => {
  vi.unstubAllGlobals();
});

const JOURNEY: Journey = {
  stops: ["a", "b"],
  travelMode: undefined,
  points: [
    { lat: 44.49, lng: 11.34 },
    { lat: 44.84, lng: 11.62 },
  ],
};

describe("computeRoute", () => {
  it("asks Google once for the journey, giving its route and the store's result", async () => {
    const routes = routesOnPage();
    const computing = computeRoute(JOURNEY);
    await requested();
    const route = new StubRoute();
    routes.answer(route);
    const { google, result } = await computing;
    expect(routes.computeRoutes.mock.calls).toEqual([[routeRequest(JOURNEY)]]);
    expect(google).toBe(route);
    expect(result.legs).toEqual([
      { from: "a", to: "b", distanceMeters: 1000, durationSeconds: 60 },
    ]);
  });

  it("fails the route with Google's error as its cause", async () => {
    const routes = routesOnPage();
    const computing = computeRoute(JOURNEY);
    await requested();
    const refused = new Error("PERMISSION_DENIED");
    routes.fail(refused);
    await expect(computing).rejects.toThrow(routeFailure("Google couldn't compute the route"));
    await expect(computing).rejects.toHaveProperty("cause", refused);
  });

  it("fails the route when Google finds none", async () => {
    const routes = routesOnPage();
    const computing = computeRoute(JOURNEY);
    await requested();
    routes.answer();
    await expect(computing).rejects.toThrow(routeFailure("Google found no route"));
  });

  it("fails the route on a Maps JS without Routes, or when the library can't load", async () => {
    stubMapsJs(undefined, { routes: {} as google.maps.RoutesLibrary });
    await expect(computeRoute(JOURNEY)).rejects.toThrow(routeFailure("Maps JS 3.63 or later"));
    vi.stubGlobal("google", {
      maps: { importLibrary: () => Promise.reject(new Error("offline")) },
    });
    await expect(computeRoute(JOURNEY)).rejects.toThrow(routeFailure("failed to load"));
  });

  it("fails the route when a leg comes without a duration", async () => {
    const routes = routesOnPage();
    const computing = computeRoute(JOURNEY);
    await requested();
    routes.answer(new StubRoute({ distanceMeters: 1000, durationMillis: null }));
    await expect(computing).rejects.toThrow(routeFailure("no duration"));
  });
});
