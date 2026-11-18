import { afterEach, describe, expect, it, vi } from "vitest";
import type { MaplaceError } from "../errors";
import type { RouteComputer } from "../route-request";
import { adding, markerDrawable } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { straightRoutes } from "../testing/straight-routes";
import { ROUTE_SOURCE } from "./layers";
import { mountedMapLibre, mountedOnPageMap } from "./testing/mounted";
import { clickCanvas } from "./testing/pointer";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { removePageMaps, TEST_OPTIONS } from "./testing/subject";
import { TEST_STYLE } from "./testing/test-style";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

const ROUTE_LAYER = "maplace-route";
const WEST = { lat: 44.5, lng: 11 };
const EAST = { lat: 44.5, lng: 11.6 };
/** On the straight route between the stops, away from both. */
const MIDWAY = { lat: 44.5, lng: 11.3 };

/** A MapLibre map routing through `computeRoute`, its two stops drawn and in view. */
async function routedMap(computeRoute: RouteComputer = straightRoutes) {
  const mounted = await mountedMapLibre({ ...TEST_OPTIONS, computeRoute });
  await mounted.adapter.apply(adding(markerDrawable("a", WEST), markerDrawable("b", EAST)));
  mounted.adapter.setView({ kind: "center", center: MIDWAY, zoom: 9 });
  mounted.adapter.setRoute({ stops: ["a", "b"] });
  await mounted.probe.settle();
  return mounted;
}

const routeFeature = (state: Awaited<ReturnType<typeof routedMap>>["state"]) =>
  state.features?.route.featureOf("route");

describe("the route on MapLibre", () => {
  it("draws the route in its own layer, below every location's", async () => {
    const { map } = await routedMap();
    const layers = map.getStyle().layers.map(({ id }) => id);
    expect(layers.indexOf(ROUTE_LAYER)).toBeLessThan(layers.indexOf("maplace-fills"));
    await expect.poll(() => renderedIds(map, [ROUTE_LAYER]), RENDER_WAIT).toEqual(["route"]);
  });

  it("takes no click: a click on the route is a click on the map", async () => {
    const { map, host } = await routedMap();
    await expect.poll(() => renderedIds(map, [ROUTE_LAYER]), RENDER_WAIT).toEqual(["route"]);
    clickCanvas(map, { at: MIDWAY });
    await expect.poll(() => host.reportsOf("reportMapClick").length).toBe(1);
    expect(host.reportsOf("reportSelectionChange")).toEqual([]);
  });

  it("restyles the route for a new style alone, asking the page's routing nothing", async () => {
    const computeRoute = vi.fn(straightRoutes);
    const { adapter, probe, state } = await routedMap(computeRoute);
    adapter.setRoute({ stops: ["a", "b"], style: { stroke: "#ff0000" } });
    await probe.settle();
    expect(computeRoute).toHaveBeenCalledOnce();
    expect(routeFeature(state)?.properties.stroke).toBe("#ff0000");
  });

  it("takes the route off when it is cleared", async () => {
    const { adapter, probe, state, map } = await routedMap();
    adapter.setRoute(undefined);
    await probe.settle();
    expect(routeFeature(state)).toBeUndefined();
    await expect.poll(() => renderedIds(map, [ROUTE_LAYER]), RENDER_WAIT).toEqual([]);
  });

  it("draws the route again after the map is restyled", async () => {
    const { map } = await routedMap();
    map.setStyle(TEST_STYLE, { diff: false });
    await expect.poll(() => renderedIds(map, [ROUTE_LAYER]), RENDER_WAIT).toEqual(["route"]);
  });

  it("fails the route with what the page's routing rejected with", async () => {
    const cause = new Error("no road across the sea");
    const { host } = await routedMap(async () => Promise.reject(cause));
    const [[error, route]] = host.reportsOf("reportError") as [[MaplaceError, unknown]];
    expect(error).toMatchObject({ code: "route-failed", cause });
    expect(route).toEqual({ stops: ["a", "b"] });
  });
});

describe("the route on the page's own map", () => {
  it("leaves no route source or layer of maplace's once detached", async () => {
    const { map, destroy } = await mountedOnPageMap();
    expect(map.getSource(ROUTE_SOURCE)).toBeDefined();
    destroy();
    expect(map.getSource(ROUTE_SOURCE)).toBeUndefined();
    expect(map.getLayer(ROUTE_LAYER)).toBeUndefined();
  });

  it("draws the route in two parts while a progress is set, asking the page's routing nothing", async () => {
    const computeRoute = vi.fn(straightRoutes);
    const { adapter, probe, state } = await routedMap(computeRoute);
    adapter.setRoute({ stops: ["a", "b"], progress: 0.5 });
    await probe.settle();
    const travelled = state.features?.route.featureOf("route-travelled");
    expect(travelled?.properties.strokeOpacity).toBeCloseTo(0.34);
    const ahead =
      (routeFeature(state)?.geometry as GeoJSON.LineString | undefined)?.coordinates ?? [];
    expect(ahead[0]?.[0]).toBeCloseTo(MIDWAY.lng);
    adapter.setRoute({ stops: ["a", "b"] });
    await probe.settle();
    expect(state.features?.route.featureOf("route-travelled")).toBeUndefined();
    expect(computeRoute).toHaveBeenCalledOnce();
  });
});
