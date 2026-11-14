import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { adding, markerDrawable, presented, withContent } from "../testing/conformance/fixtures";
import { reportedViewport, unmountAll } from "../testing/conformance/harness";
import type { Bounds, ResolvedView } from "../viewport";
import { mountedOnGlobe } from "./testing/mounted";

afterEach(() => {
  unmountAll();
});

/** Flights' cities, London to Sydney: 225° of longitude, more than a globe shows at once. */
const FLIGHTS: Bounds = { south: -33.87, west: -74.01, north: 51.51, east: 151.21 };
const fitting = (bounds: Bounds): ResolvedView => ({ kind: "fit-bounds", bounds, padding: 40 });

/** Where the map is centred, its longitude in −180..180. */
const centreLongitude = (map: MapLibreMap) => map.getCenter().wrap().lng;

describe("maplace's view on a MapLibre globe", () => {
  it("fits Flights' 225° of routes with London's side in view, not the far one", async () => {
    const { adapter, map, probe } = await mountedOnGlobe();
    adapter.setView(fitting(FLIGHTS));
    await probe.settle();
    expect(centreLongitude(map)).toBeGreaterThan(FLIGHTS.west);
    expect(centreLongitude(map)).toBeLessThan(FLIGHTS.east);
  });

  it("zoomed out past MapLibre's −1, reports zoom 0, never below", async () => {
    const mounted = await mountedOnGlobe();
    mounted.map.setZoom(-2);
    await mounted.probe.settle();
    expect(mounted.map.getZoom()).toBeLessThan(-1);
    expect(reportedViewport(mounted).zoom).toBe(0);
  });

  it("switching projection fits the standing view again, then reports it once", async () => {
    const { adapter, map, probe, host } = await mountedOnGlobe();
    adapter.setView(fitting(FLIGHTS));
    await probe.settle();
    const before = host.reportsOf("reportViewportChange").length;
    map.setProjection({ type: "mercator" });
    await probe.settle();
    expect(map.getBounds().contains([FLIGHTS.west, FLIGHTS.north])).toBe(true);
    expect(map.getBounds().contains([FLIGHTS.east, FLIGHTS.south])).toBe(true);
    expect(host.reportsOf("reportViewportChange").length).toBe(before + 1);
  });

  it("keeps a view the user moved when the projection switches", async () => {
    const { adapter, map, probe } = await mountedOnGlobe();
    adapter.setView(fitting(FLIGHTS));
    await probe.settle();
    map.jumpTo({ center: [100, 10], zoom: 2 }, { originalEvent: new MouseEvent("mousedown") });
    await probe.settle();
    map.setProjection({ type: "mercator" });
    await probe.settle();
    expect(centreLongitude(map)).toBeCloseTo(100, 4);
  });

  it("fades a popup once its place turns behind the globe", async () => {
    const { adapter, map, probe } = await mountedOnGlobe();
    adapter.setView({ kind: "center", center: { lat: 0, lng: 0 }, zoom: 1 });
    await adapter.apply(adding(withContent(markerDrawable("a", { lat: 0, lng: 0 }), "Alpha")));
    adapter.present(presented({ selectedId: "a" }));
    await probe.settle();
    map.jumpTo({ center: [180, 0] });
    await probe.settle();
    const popup = map.getContainer().querySelector<HTMLElement>(".maplibregl-popup");
    expect(popup && getComputedStyle(popup).opacity).toBe("0.2");
  });
});
