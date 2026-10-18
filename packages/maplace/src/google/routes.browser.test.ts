/// <reference types="google.maps" />
import { expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import type { LatLng } from "../geometry";
import { createMaplace } from "../maplace/create";
import type { RouteResult } from "../route";
import { TOWNS } from "../testing/conformance/fixtures";
import { frames } from "./frames";
import { inputOn } from "./testing/map-input";
import { idle } from "./testing/map-waits";
import { steadyPoint } from "./testing/page-input";
import { onGoogle } from "./testing/store-on-google";
import { describeWithMaps } from "./testing/with-maps";

/** Google answers a route over the network: seconds on a slow runner. */
const ROUTE_TIMEOUT_MS = 15_000;

/** A store on Google with stops in Bologna (draggable) and Ferrara, its route results recorded. */
async function routeOnGoogle() {
  const locations = [
    { id: "a", ...TOWNS.bologna, title: "Bologna", editable: true },
    { id: "b", ...TOWNS.ferrara, title: "Ferrara" },
  ];
  const attached = await onGoogle(createMaplace({ locations }));
  const { Route } = await google.maps.importLibrary("routes");
  const computeRoutes = vi.spyOn(Route, "computeRoutes");
  const createPolylines = vi.spyOn(Route.prototype, "createPolylines");
  const results: (RouteResult | undefined)[] = [];
  attached.maplace.on("routeChange", ({ result }) => results.push(result));
  const reported = (count: number) =>
    expect.poll(() => results.length, { timeout: ROUTE_TIMEOUT_MS }).toBe(count);
  return { ...attached, computeRoutes, createPolylines, results, reported };
}

/** The Bologna marker's pin, where a user grabs it, once Google has put it there to stay. */
function bolognaPin(map: google.maps.Map) {
  return steadyPoint(() => map.getDiv().querySelector('[aria-label="Bologna"]') ?? undefined);
}

describeWithMaps("routes on Google", () => {
  it("reports the route over the roads, drawing its line on the map", async () => {
    const { maplace, googleMap, computeRoutes, createPolylines, results, reported } =
      await routeOnGoogle();
    maplace.setRoute({ stops: ["a", "b"] });
    await reported(1);
    const [result] = results;
    expect(result?.legs).toEqual([expect.objectContaining({ from: "a", to: "b" })]);
    // Some 45 km by road; straight, about 40.
    expect(result?.distanceMeters).toBeGreaterThan(40_000);
    expect(result?.path.length).toBeGreaterThan(10);
    // Turn-by-turn steps come with the whole legs, with no field asked for them.
    expect(computeRoutes.mock.calls[0]?.[0].fields).toEqual(["legs", "path"]);
    const steps = result?.legs[0]?.steps ?? [];
    expect(steps.length).toBeGreaterThan(2);
    expect(steps.some(({ instruction }) => instruction !== undefined)).toBe(true);
    const lines = createPolylines.mock.results.flatMap(({ value }) => value);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((line) => line.getMap() === googleMap())).toBe(true);
  });

  it("computes again once a dragged stop is let go, and never for a new style", async () => {
    const { maplace, googleMap, computeRoutes, results, reported } = await routeOnGoogle();
    maplace.setRoute({ stops: ["a", "b"] });
    await reported(1);
    const grabbed = await bolognaPin(googleMap() as google.maps.Map);
    await commands.pressMouse([grabbed, { x: grabbed.x + 60, y: grabbed.y + 40 }]);
    await reported(2);
    expect(computeRoutes).toHaveBeenCalledTimes(2);
    expect(results[1]?.distanceMeters).not.toBe(results[0]?.distanceMeters);
    maplace.setRoute({ stops: ["a", "b"], style: { stroke: "#d32f2f", strokeWidth: 6 } });
    await frames(10);
    expect(computeRoutes).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(2);
  });

  it("lets a click on the line through to the map, which deselects", async () => {
    const { maplace, googleMap, results, reported } = await routeOnGoogle();
    maplace.setRoute({ stops: ["a", "b"] });
    await reported(1);
    const map = googleMap() as google.maps.Map;
    // Selecting pans to it, ending in an `idle`: the line is clicked where it then is.
    const panned = idle(map);
    maplace.select("b");
    await panned;
    const path = results[0]?.path ?? [];
    const onTheLine = path[Math.floor(path.length / 2)] as LatLng;
    await (await inputOn(map)).click(onTheLine);
    await expect.poll(() => maplace.getSnapshot().selectedId).toBeUndefined();
  });

  it("fails the route for stops no road joins, at sea, the map still ready", async () => {
    const locations = [
      { id: "a", lat: 1, lng: 1 },
      { id: "b", lat: 2, lng: 3 },
    ];
    const { maplace, errors } = await onGoogle(createMaplace({ locations }));
    maplace.setRoute({ stops: ["a", "b"] });
    await expect
      .poll(() => errors, { timeout: ROUTE_TIMEOUT_MS })
      .toEqual([expect.objectContaining({ code: "route-failed" })]);
    expect(maplace.getSnapshot().loadState).toBe("ready");
  });
});
