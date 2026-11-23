import { expect, it } from "vitest";
import type { LatLng } from "../geometry";
import { createMaplace } from "../maplace/create";
import { cameraAt } from "./testing/camera-at";
import { polygonOn } from "./testing/held-drags";
import { inputOn } from "./testing/map-input";
import { pointerTakenByHandle } from "./testing/shape-pointer";
import { onGoogle } from "./testing/store-on-google";
import { describeWithMaps } from "./testing/with-maps";

const OUTLINE: LatLng[] = [
  { lat: -1, lng: -1 },
  { lat: -1, lng: 1 },
  { lat: 1, lng: 1 },
  { lat: 1, lng: -1 },
];
const CORNER = OUTLINE[2] as LatLng;
/** On the fill, clear of the corner. */
const ON_FILL: LatLng = { lat: 0, lng: 0.5 };
/** A marker on the way the corner is dragged. */
const ON_THE_WAY: LatLng = { lat: 1.3, lng: 1.2 };
const DRAGGED_TO: LatLng = { lat: 1.6, lng: 1.4 };
const AWAY: LatLng = { lat: -1.6, lng: -1.6 };

/** An editable polygon and a marker by its corner on a store's Google map, at zoom 7. */
async function polygonOnStore() {
  const maplace = createMaplace({
    locations: [
      { id: "p", type: "polygon", path: OUTLINE, editable: true },
      { id: "m", ...ON_THE_WAY },
    ],
  });
  const { state, googleMap } = await onGoogle(maplace);
  const map = googleMap() as google.maps.Map;
  await cameraAt(map, { center: { lat: 0, lng: 0 }, zoom: 7 });
  return { maplace, polygon: polygonOn(state, "p"), input: await inputOn(map) };
}

describeWithMaps("an editable Google shape's handles, as a user points at it", () => {
  it("shows them only while the pointer is on the shape", async () => {
    const { polygon, input } = await polygonOnStore();
    expect(polygon.getEditable()).toBe(false);
    await input.pointTo(ON_FILL);
    await expect.poll(() => polygon.getEditable()).toBe(true);
    await input.pointTo(AWAY);
    await expect.poll(() => polygon.getEditable()).toBe(false);
  });

  it("lands a hovered polygon's corner dragged off it and across a marker, reporting its change", async () => {
    const { maplace, polygon, input } = await polygonOnStore();
    await input.pointTo(ON_FILL);
    await expect.poll(() => polygon.getEditable()).toBe(true);
    await pointerTakenByHandle(input, polygon, CORNER);
    const held = await input.hold(CORNER);
    await held.moveTo(ON_THE_WAY);
    await held.moveTo(DRAGGED_TO);
    await held.release();
    await expect
      .poll(() => {
        const location = maplace.getSnapshot().locations.find(({ id }) => id === "p");
        return location?.type === "polygon" ? location.path[2] : undefined;
      })
      .toMatchObject({
        lat: expect.closeTo(DRAGGED_TO.lat, 1),
        lng: expect.closeTo(DRAGGED_TO.lng, 1),
      });
    // Its handles go once the pointer moves away after the release: Google let the moves through.
    await input.pointTo(AWAY);
    await expect.poll(() => polygon.getEditable()).toBe(false);
  });
});
