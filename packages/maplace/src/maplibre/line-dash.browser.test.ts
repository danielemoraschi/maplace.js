import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import type { LatLng } from "../geometry";
import type { StrokeDash } from "../style";
import { adding, markerDrawable, polylineDrawable } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { straightRoutes } from "../testing/straight-routes";
import { mountedMapLibre } from "./testing/mounted";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { TEST_OPTIONS } from "./testing/subject";

afterEach(unmountAll);

const WEST: LatLng = { lat: 0, lng: -1 };
const EAST: LatLng = { lat: 0, lng: 1 };
/** Pure red, so the background and the antialiased edges don't count. */
const RED = "#ff0000";

/**
 * The share of the pixels along the line from `from` to `to`, a quarter of the way in from each
 * end, that MapLibre paints red: read from the frame it has just rendered.
 */
function redShareBetween(map: MapLibreMap, from: LatLng, to: LatLng): Promise<number> {
  return new Promise((resolve) => {
    map.once("render", () => {
      const canvas = map.getCanvas();
      const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
      const ratio = canvas.width / canvas.clientWidth;
      const start = map.project([from.lng, from.lat]);
      const end = map.project([to.lng, to.lat]);
      const quarter = (end.x - start.x) / 4;
      const x = Math.round((start.x + quarter) * ratio);
      const width = Math.round(2 * quarter * ratio);
      const y = Math.round(canvas.height - start.y * ratio);
      const pixels = new Uint8Array(width * 4);
      gl.readPixels(x, y, width, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let red = 0;
      for (let at = 0; at < pixels.length; at += 4) {
        if ((pixels[at] ?? 0) > 200 && (pixels[at + 1] ?? 255) < 60) red += 1;
      }
      resolve(red / width);
    });
    map.triggerRepaint();
  });
}

/** A map showing a red line 6 pixels wide from `WEST` to `EAST`, `strokeDash` as given. */
async function lineDashed(strokeDash: StrokeDash | undefined) {
  const { map, adapter } = await mountedMapLibre();
  map.jumpTo({ center: [0, 0], zoom: 6 });
  const style = { stroke: RED, strokeOpacity: 1, strokeWidth: 6, strokeDash };
  const path = [WEST, EAST];
  await adapter.apply(
    adding(polylineDrawable("l", { geometry: { type: "polyline", path }, style })),
  );
  await expect.poll(() => renderedIds(map, ["maplace-lines"]), RENDER_WAIT).toEqual(["l"]);
  return map;
}

describe("a line's dashes on MapLibre", () => {
  it("draws a line unbroken when it is solid or sets no dash", async () => {
    for (const strokeDash of [undefined, "solid"] as const) {
      const map = await lineDashed(strokeDash);
      expect(await redShareBetween(map, WEST, EAST)).toBeGreaterThan(0.98);
      unmountAll();
    }
  });

  it("breaks a dashed line into dashes about as long as the gaps between", async () => {
    const map = await lineDashed("dashed");
    const share = await redShareBetween(map, WEST, EAST);
    expect(share).toBeGreaterThan(0.35);
    expect(share).toBeLessThan(0.65);
  });

  it("draws a dotted line as dots with gaps as wide between", async () => {
    const map = await lineDashed("dotted");
    const share = await redShareBetween(map, WEST, EAST);
    expect(share).toBeGreaterThan(0.3);
    expect(share).toBeLessThan(0.7);
  });

  it("dashes the route as its style asks", async () => {
    const { map, adapter, probe } = await mountedMapLibre({
      ...TEST_OPTIONS,
      computeRoute: straightRoutes,
    });
    map.jumpTo({ center: [0, 0], zoom: 6 });
    await adapter.apply(adding(markerDrawable("w", WEST), markerDrawable("e", EAST)));
    const style = { stroke: RED, strokeOpacity: 1, strokeWidth: 6, strokeDash: "dashed" as const };
    adapter.setRoute({ stops: ["w", "e"], style });
    await probe.settle();
    await expect.poll(() => renderedIds(map, ["maplace-route"]), RENDER_WAIT).toEqual(["route"]);
    expect(await redShareBetween(map, WEST, EAST)).toBeLessThan(0.65);
  });
});
