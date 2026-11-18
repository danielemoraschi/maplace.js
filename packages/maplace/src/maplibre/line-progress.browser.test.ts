import { afterEach, describe, expect, it } from "vitest";
import type { Drawable } from "../drawable";
import type { LatLng } from "../geometry";
import { pointAlong } from "../point-along";
import {
  adding,
  polylineDrawable,
  presented,
  removing,
  updating,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import type { LocationFeature } from "./feature-set";
import { mountedMapLibre } from "./testing/mounted";
import { clickCanvas } from "./testing/pointer";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";

afterEach(unmountAll);

const PATH: LatLng[] = [
  { lat: 0, lng: -1 },
  { lat: 0.5, lng: 1 },
];

/** A red polyline `id` along `PATH` drawn `progress` of the way. */
function lineAt(progress: number | undefined, id = "l", extra?: Partial<Drawable>): Drawable {
  const geometry = { type: "polyline", path: PATH } as const;
  return polylineDrawable(id, { geometry, style: { stroke: "#ff0000" }, progress, ...extra });
}

async function shown(...drawables: Drawable[]) {
  const mounted = await mountedMapLibre();
  mounted.map.jumpTo({ center: [0, 0.25], zoom: 7 });
  await mounted.adapter.apply(adding(...drawables));
  await expect
    .poll(() => renderedIds(mounted.map, ["maplace-lines"]), RENDER_WAIT)
    .toEqual(drawables.map(({ id }) => id).sort());
  const feature = (key: string): LocationFeature | undefined =>
    mounted.state.features?.shapes.featureOf(key);
  return { ...mounted, feature };
}

const coordinates = (feature: LocationFeature | undefined) =>
  (feature?.geometry as GeoJSON.LineString | undefined)?.coordinates;

describe("a line's progress on MapLibre", () => {
  it("draws the travelled part faded and the part ahead as the line, its own line see-through", async () => {
    const { feature } = await shown(lineAt(0.3));
    expect(feature("ll")?.properties.parted).toBe(true);
    expect(feature("tl")?.properties).toMatchObject({
      id: "l",
      stroke: "#ff0000",
      strokeOpacity: 0.4,
    });
    expect(feature("al")?.properties).toMatchObject({ id: "l", stroke: "#ff0000" });
    expect(feature("al")?.properties.strokeOpacity).toBeUndefined();
  });

  it("splits the line where it is drawn: the parts meet at the point along it", async () => {
    const { feature } = await shown(lineAt(0.3));
    const meet = pointAlong({ id: "l", type: "polyline", path: PATH }, 0.3);
    const travelled = coordinates(feature("tl")) ?? [];
    const ahead = coordinates(feature("al")) ?? [];
    expect(travelled.at(-1)).toEqual([meet.lng, meet.lat]);
    expect(ahead[0]).toEqual([meet.lng, meet.lat]);
    expect([travelled[0], ahead.at(-1)]).toEqual([
      [-1, 0],
      [1, 0.5],
    ]);
  });

  it("finds the line under the pointer on its travelled part", async () => {
    const { map, host } = await shown(lineAt(0.6));
    clickCanvas(map, { at: pointAlong({ id: "l", type: "polyline", path: PATH }, 0.2) });
    await expect.poll(() => host.reportsOf("reportSelectionChange")).toEqual([["l"]]);
  });

  it("draws a hovered line over the parts of a split line it crosses", async () => {
    const { adapter, feature } = await shown(lineAt(0.5), lineAt(undefined, "m"));
    adapter.present(presented({ hoveredId: "m" }));
    const hovered = feature("lm")?.properties.strokeRank ?? 0;
    expect(feature("tl")?.properties.strokeRank).toBeLessThan(hovered);
    expect(feature("al")?.properties.strokeRank).toBeLessThan(hovered);
  });

  it("takes both parts off and draws the line whole again once its progress is cleared", async () => {
    const { adapter, feature } = await shown(lineAt(0.5));
    await adapter.apply(updating(lineAt(undefined)));
    expect([feature("tl"), feature("al")]).toEqual([undefined, undefined]);
    expect(feature("ll")?.properties.parted).toBeUndefined();
  });

  it("draws no travelled part at 0 and no part ahead at 1", async () => {
    const { adapter, feature } = await shown(lineAt(0));
    expect([feature("tl"), coordinates(feature("al"))?.length]).toEqual([undefined, 2]);
    await adapter.apply(updating(lineAt(1)));
    expect([feature("al"), coordinates(feature("tl"))?.length]).toEqual([undefined, 2]);
  });

  it("takes the parts off a line hidden, and off one removed", async () => {
    const { adapter, feature } = await shown(lineAt(0.5));
    adapter.present(presented({ hiddenIds: new Set(["l"]) }));
    expect([feature("tl"), feature("al")]).toEqual([undefined, undefined]);
    adapter.present(presented({}));
    await adapter.apply(removing("l"));
    expect([feature("tl"), feature("al"), feature("ll")]).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("keeps a location whose id is a part's key apart from that part", async () => {
    const { map } = await shown(lineAt(0.5), lineAt(undefined, "tl"));
    expect(renderedIds(map, ["maplace-lines"])).toEqual(["l", "tl"]);
  });
});
