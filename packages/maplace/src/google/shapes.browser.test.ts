import { afterEach, expect, it } from "vitest";
import type { Drawable } from "../drawable";
import type { Geometry } from "../geometry";
import {
  adding,
  circleDrawable,
  ORIGIN,
  polygonDrawable,
  polylineDrawable,
  presented,
  reshaped,
  updating,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import type { RecordingHost } from "../testing/conformance/recording-host";
import { inputOn } from "./testing/map-input";
import { mountedGoogle, TEST_OPTIONS } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

/** Close enough that the fixtures' shapes, a degree or two across, have handles apart. */
const ZOOM = 7;
/** Metres per degree of longitude at the equator. */
const METRES_PER_DEGREE = 111_319.49;
/** On the polygon fixture's ring, outside its hole. */
const IN_RING = { lat: 0.75, lng: 0.75 };

/** Google drawing `drawables` around the origin, with a user's mouse on the map. */
async function drawnOnMap(...drawables: Drawable[]) {
  const mounted = await mountedGoogle({
    ...TEST_OPTIONS,
    mapOptions: { disableDoubleClickZoom: true },
  });
  const map = mounted.state.mounted?.map as google.maps.Map;
  await mounted.adapter.apply(adding(...drawables));
  const idle = new Promise((resolve) => google.maps.event.addListenerOnce(map, "idle", resolve));
  map.setOptions({ center: ORIGIN, zoom: ZOOM });
  await idle;
  return { ...mounted, input: await inputOn(map) };
}

/** The `nth` change reported, from 1, once it is the last one. */
async function changeReported(host: RecordingHost, nth: number): Promise<[string, Geometry]> {
  await expect.poll(() => host.reportsOf("reportChange").length).toBe(nth);
  return host.reportsOf("reportChange")[nth - 1] as [string, Geometry];
}

describeWithMaps("Google shapes under real input", () => {
  afterEach(unmountAll);

  it("reports a click on a shape once, as the shape's and not the map's", async () => {
    const { input, host } = await drawnOnMap(polygonDrawable("p"));
    await input.click(IN_RING);
    await expect.poll(() => host.reportsOf("reportSelect")).toEqual([["p"]]);
  });

  it("reports a click in a shape's hole as the map's", async () => {
    const { input, host } = await drawnOnMap(polygonDrawable("p"));
    await input.click(ORIGIN);
    await expect.poll(() => host.reportsOf("reportSelect")).toEqual([[undefined]]);
  });

  it("reports the pointer onto a shape and off it", async () => {
    const { input, host } = await drawnOnMap(polygonDrawable("p"));
    await input.pointTo(IN_RING);
    await input.pointTo({ lat: 1.5, lng: 1.5 });
    await expect.poll(() => host.reportsOf("reportHover")).toEqual([["p"], [undefined]]);
  });

  it("gives the click to the selected of two overlapping shapes", async () => {
    const { adapter, input, host } = await drawnOnMap(polygonDrawable("p"), polygonDrawable("q"));
    adapter.present(presented({ selectedId: "p" }));
    await input.click(IN_RING);
    await expect.poll(() => host.reportsOf("reportSelect")).toEqual([["p"]]);
  });

  it("reports a circle's new radius once, when its handle is let go", async () => {
    const radius = 50_000;
    const edge = { lat: 0, lng: radius / METRES_PER_DEGREE };
    const circle = circleDrawable("c", {
      editable: true,
      geometry: { type: "circle", center: ORIGIN, radius },
    });
    const { input, host } = await drawnOnMap(circle);
    await input.drag({ from: edge, to: { lat: 0, lng: edge.lng * 1.5 } });
    expect(await changeReported(host, 1)).toMatchObject([
      "c",
      { type: "circle", radius: expect.closeTo(75_000, -4) },
    ]);
    expect(host.reportsOf("reportSelect")).toEqual([]);
  });

  it("reports a moved and an added polygon corner, the second after the store wrote back the first (0.2 #64, #164)", async () => {
    const polygon = polygonDrawable("p", { editable: true });
    const { adapter, input, host } = await drawnOnMap(polygon);
    await input.drag({ from: { lat: 1, lng: 1 }, to: { lat: 1.3, lng: 1.2 } });
    const [, moved] = await changeReported(host, 1);
    await adapter.apply(updating(reshaped(polygon, structuredClone(moved))));
    // The midpoint of the side from (-1, -1) to (-1, 1).
    await input.drag({ from: { lat: -1, lng: 0 }, to: { lat: -1.3, lng: 0 } });
    expect(await changeReported(host, 2)).toMatchObject([
      "p",
      { type: "polygon", path: { length: 5 } },
    ]);
    expect(host.reportsOf("reportSelect")).toEqual([]);
  });

  it("reports a moved polyline point (0.2 #178)", async () => {
    const { input, host } = await drawnOnMap(polylineDrawable("l", { editable: true }));
    await input.drag({ from: { lat: 1, lng: 1 }, to: { lat: 1.2, lng: 0.8 } });
    expect(await changeReported(host, 1)).toMatchObject(["l", { type: "polyline" }]);
  });
});
