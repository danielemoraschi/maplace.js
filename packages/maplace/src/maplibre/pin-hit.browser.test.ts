import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pinImageSize, pinRadiusOf } from "../adapter-kit/pin-image";
import { pinLooksOf } from "../adapter-kit/pin-looks";
import type { LatLng } from "../geometry";
import { adding, markerDrawable, ORIGIN } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { mountedMapLibre } from "./testing/mounted";
import { clickCanvas } from "./testing/pointer";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";

afterEach(unmountAll);

const RESTING = pinLooksOf(document.body).resting;

/** Where `px` pixels below `at` is on the map. */
function below(map: MapLibreMap, at: LatLng, px: number): LatLng {
  const { x, y } = map.project([at.lng, at.lat]);
  const { lat, lng } = map.unproject([x, y + px]);
  return { lat, lng };
}

/**
 * Pin `a` at the origin and pin `b`, added after it so drawn over it, close enough below that
 * `b`'s image, its shadow's room included, reaches over `a`'s dot, though `b`'s dot doesn't.
 */
async function crowdedPins() {
  const mounted = await mountedMapLibre();
  const { map, adapter } = mounted;
  adapter.setView({ kind: "center", center: ORIGIN, zoom: 6 });
  const apart = (pinRadiusOf(RESTING) + pinImageSize(RESTING) / 2) / 2 + 1;
  expect(apart).toBeLessThan(pinImageSize(RESTING) / 2);
  await adapter.apply(
    adding(markerDrawable("a", ORIGIN), markerDrawable("b", below(map, ORIGIN, apart))),
  );
  await vi.waitFor(() => expect(renderedIds(map, ["maplace-pins"])).toHaveLength(2), RENDER_WAIT);
  return mounted;
}

describe("a pin on MapLibre, pointed at", () => {
  it("is hit on its dot, under a neighbour's image drawn over it", async () => {
    const { map, host } = await crowdedPins();
    clickCanvas(map, ORIGIN);
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
  });

  it("is hit beside its dot too, across its image, where no other dot is nearer", async () => {
    const { map, host } = await crowdedPins();
    const { x, y } = map.project([ORIGIN.lng, ORIGIN.lat]);
    const { lat, lng } = map.unproject([x - pinRadiusOf(RESTING) - 2, y - 2]);
    clickCanvas(map, { lat, lng });
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
  });

  it("is hit on a world copy east of 180°, crowded by a pin west of it drawn over it", async () => {
    const { map, adapter, host } = await mountedMapLibre();
    adapter.setView({ kind: "center", center: { lat: 0, lng: 180 }, zoom: 10 });
    const apart = (pinRadiusOf(RESTING) + pinImageSize(RESTING) / 2) / 2 + 1;
    const { x, y } = map.project([180, 0]);
    const west = map.unproject([x - apart / 2, y]);
    const east = map.unproject([x + apart / 2, y]);
    // Stored west of the antimeridian, as a page gives it; drawn east of 180°, beside the other.
    const eastPin = { lat: 0, lng: east.lng - 360 };
    await adapter.apply(
      adding(markerDrawable("e", eastPin), markerDrawable("w", { lat: 0, lng: west.lng })),
    );
    await vi.waitFor(() => expect(renderedIds(map, ["maplace-pins"])).toHaveLength(2), RENDER_WAIT);
    clickCanvas(map, { lat: 0, lng: east.lng });
    expect(host.reportsOf("reportSelectionChange")).toEqual([["e"]]);
  });
});
