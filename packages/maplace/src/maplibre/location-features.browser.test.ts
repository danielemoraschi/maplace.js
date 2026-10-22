import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Drawable } from "../drawable";
import type { LatLng } from "../geometry";
import { adding, circleDrawable, ORIGIN, polygonDrawable } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { mountedMapLibre } from "./testing/mounted";
import { RENDER_WAIT } from "./testing/rendered";

afterEach(unmountAll);

const ANTIMERIDIAN: LatLng = { lat: 0, lng: 180 };

/** Metres in a degree of latitude, or of longitude on the equator: the test's own measure. */
const METRES_PER_DEGREE = 111_195;

/** The points `metres` north, east, south and west of `from` on the equator. */
function around(from: LatLng, metres: number): LatLng[] {
  const degrees = metres / METRES_PER_DEGREE;
  return [
    { lat: from.lat + degrees, lng: from.lng },
    { lat: from.lat, lng: from.lng + degrees },
    { lat: from.lat - degrees, lng: from.lng },
    { lat: from.lat, lng: from.lng - degrees },
  ];
}

/** Whether MapLibre fills an area at `at`, in the world copy nearest the view's centre. */
function filledAt(map: MapLibreMap, at: LatLng): boolean {
  const centre = map.getCenter().lng;
  const lng = at.lng + 360 * Math.round((centre - at.lng) / 360);
  const point = map.project([lng, at.lat]);
  return map.queryRenderedFeatures(point, { layers: ["maplace-fills"] }).length > 0;
}

/** `drawable` drawn on a map looking at `centre` from zoom `zoom`, once MapLibre renders it. */
async function drawnAround(drawable: Drawable, centre: LatLng, zoom: number) {
  const { map, adapter } = await mountedMapLibre();
  map.jumpTo({ center: [centre.lng, centre.lat], zoom });
  await adapter.apply(adding(drawable));
  await vi.waitFor(() => expect(filledAt(map, centre)).toBe(true), RENDER_WAIT);
  return map;
}

describe("shape features as MapLibre renders them", () => {
  it("fills a polygon across ±180 at the antimeridian and not round the world", async () => {
    const path = [
      { lat: -2, lng: 178 },
      { lat: -2, lng: -178 },
      { lat: 2, lng: -178 },
      { lat: 2, lng: 178 },
    ];
    const across = polygonDrawable("p", { geometry: { type: "polygon", path } });
    const map = await drawnAround(across, ANTIMERIDIAN, 4);
    expect(filledAt(map, { lat: 0, lng: 170 })).toBe(false);
    expect(filledAt(map, { lat: 0, lng: -170 })).toBe(false);
  });

  it("fills a 1 km circle 900 m from its centre and not 1,100 m from it", async () => {
    const map = await drawnAround(circleDrawable("c"), ORIGIN, 13);
    for (const inside of around(ORIGIN, 900)) expect(filledAt(map, inside)).toBe(true);
    for (const outside of around(ORIGIN, 1100)) expect(filledAt(map, outside)).toBe(false);
  });

  it("draws a circle across ±180 as one ring", async () => {
    const circle = { type: "circle", center: ANTIMERIDIAN, radius: 50_000 } as const;
    const map = await drawnAround(circleDrawable("c", { geometry: circle }), ANTIMERIDIAN, 7);
    const [, eastInside, , westInside] = around(ANTIMERIDIAN, 40_000);
    const [, eastOutside] = around(ANTIMERIDIAN, 60_000);
    expect(filledAt(map, eastInside as LatLng)).toBe(true);
    expect(filledAt(map, westInside as LatLng)).toBe(true);
    expect(filledAt(map, eastOutside as LatLng)).toBe(false);
  });
});
