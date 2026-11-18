// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StubMap } from "./testing/stub-libraries";
import { STUB_ROUTE_LOOK, StubRoute, stubLeg } from "./testing/stub-routes";
import { AB, lineOf, routingOnStubs, tick } from "./testing/stub-routing";
import type { StubPolyline } from "./testing/stub-shapes";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the Google route's line", () => {
  it("is drawn with the result reported, below every location, taking no clicks", async () => {
    const { routed, answer, reported, mounted } = routingOnStubs();
    await routed();
    const line = lineOf(await answer());
    expect(reported()).toEqual([expect.objectContaining({ distanceMeters: 1000 })]);
    expect(line.getMap()).toBe(mounted.map);
    expect(line.get("clickable")).toBe(false);
    expect(line.get("zIndex")).toBe(0);
    expect(line.get("strokeColor")).toBe(STUB_ROUTE_LOOK.strokeColor);
  });

  it("is drawn again for a new style alone, without computing", async () => {
    const { routing, routes, routed, answer } = routingOnStubs();
    await routed();
    const route = await answer();
    const first = lineOf(route);
    routing.setRoute({ ...AB, style: { stroke: "#ff0000" } });
    await tick();
    expect(routes.computeRoutes).toHaveBeenCalledOnce();
    expect(first.getMap()).toBeNull();
    expect(lineOf(route).get("strokeColor")).toBe("#ff0000");
  });

  it("takes the newest style, set while its route was computed", async () => {
    const { routing, routed, answer } = routingOnStubs();
    await routed();
    routing.setRoute({ ...AB, style: { strokeWidth: 8 } });
    await tick();
    expect(lineOf(await answer()).get("strokeWeight")).toBe(8);
  });

  it("stays until the new journey's answer replaces it", async () => {
    const { routed, answer, moveStopB } = routingOnStubs();
    await routed();
    const first = lineOf(await answer());
    await moveStopB();
    expect(first.getMap()).not.toBeNull();
    const second = lineOf(await answer());
    expect(first.getMap()).toBeNull();
    expect(second.getMap()).not.toBeNull();
  });

  it("is dashed in Google's route look, its dashes as wide and opaque as Google's line", async () => {
    const { routing, routed, answer } = routingOnStubs();
    await routed();
    routing.setRoute({ ...AB, style: { strokeDash: "dashed" } });
    await tick();
    const line = lineOf(await answer());
    expect(line.get("strokeOpacity")).toBe(0);
    expect(line.get("icons")).toEqual([
      expect.objectContaining({ icon: expect.objectContaining({ scale: 6, strokeOpacity: 0.9 }) }),
    ]);
  });

  it("is drawn in two parts in Google's look while a progress is set, Google's line off the map", async () => {
    const { routing, routed, answer, mounted } = routingOnStubs();
    await routed();
    routing.setRoute({ ...AB, progress: 0.25 });
    await tick();
    const route = await answer(new StubRoute(stubLeg(1000, 60_000), ALONG));
    const [travelled, ahead] = partsOn(mounted.map, route);
    expect(googleLinesOn(mounted.map, route)).toEqual([]);
    expect(
      travelled
        ?.getPath()
        .getArray()
        .map((point) => point.toJSON()),
    ).toEqual([ALONG[0], { lat: 0, lng: 1 }]);
    expect([travelled?.get("strokeColor"), travelled?.get("strokeOpacity")]).toEqual([
      STUB_ROUTE_LOOK.strokeColor,
      expect.closeTo(0.36),
    ]);
    expect([ahead?.get("strokeOpacity"), ahead?.get("clickable")]).toEqual([0.9, false]);
  });

  it("moves its parts in place as the progress moves, asking Google for no new line", async () => {
    const { routing, routed, answer, mounted } = routingOnStubs();
    await routed();
    routing.setRoute({ ...AB, progress: 0.25 });
    await tick();
    const route = await answer(new StubRoute(stubLeg(1000, 60_000), ALONG));
    const before = partsOn(mounted.map, route);
    routing.setRoute({ ...AB, progress: 0.75 });
    await tick();
    expect(partsOn(mounted.map, route)).toEqual(before);
    expect(before[1]?.getPath().getArray()[0]?.toJSON()).toEqual({ lat: 0, lng: 3 });
    expect(route.createPolylines).toHaveBeenCalledOnce();
  });

  it("is Google's own line again once the progress is cleared, its parts off", async () => {
    const { routing, routed, answer, mounted } = routingOnStubs();
    await routed();
    routing.setRoute({ ...AB, progress: 0.5 });
    await tick();
    const route = await answer(new StubRoute(stubLeg(1000, 60_000), ALONG));
    routing.setRoute(AB);
    await tick();
    expect(partsOn(mounted.map, route)).toEqual([]);
    expect(googleLinesOn(mounted.map, route)).toHaveLength(1);
  });
});

/** The route's path in the stub answers: 4 degrees east along the equator. */
const ALONG = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 4 },
];

/** The polylines on the map Google made for `route`. */
function googleLinesOn(map: google.maps.Map, route: StubRoute): StubPolyline[] {
  const made = new Set(route.createPolylines.mock.results.flatMap(({ value }) => value));
  return [...(map as unknown as StubMap).shapes].filter((shape) =>
    made.has(shape),
  ) as StubPolyline[];
}

/** The route's parts on the map: the polylines on it Google didn't make, travelled first. */
function partsOn(map: google.maps.Map, route: StubRoute): StubPolyline[] {
  const made = new Set(route.createPolylines.mock.results.flatMap(({ value }) => value));
  return [...(map as unknown as StubMap).shapes].filter(
    (shape) => !made.has(shape),
  ) as StubPolyline[];
}
