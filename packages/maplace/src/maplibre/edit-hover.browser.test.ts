import type { Map as MapLibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import type { LatLng } from "../geometry";
import { createMaplace } from "../maplace/create";
import { onMapLibre } from "./testing/control-site";
import { pagePointOf } from "./testing/user-drags";

/** The polygon's outline, a square 2° wide around the origin, with a hole 1° wide. */
const OUTLINE: LatLng[] = [
  { lat: -1, lng: -1 },
  { lat: -1, lng: 1 },
  { lat: 1, lng: 1 },
  { lat: 1, lng: -1 },
];
const HOLE: LatLng[] = OUTLINE.map(({ lat, lng }) => ({ lat: lat / 2, lng: lng / 2 }));
/** In the fill, between the outline and the hole. */
const ON_FILL: LatLng = { lat: 0, lng: 0.75 };
const CORNER = OUTLINE[2] as LatLng;
/** Where the corner is dragged: off the polygon. */
const DRAGGED_TO: LatLng = { lat: 1.8, lng: 1.8 };
/** Further off, where nothing is. */
const AWAY: LatLng = { lat: -2, lng: -2.5 };

/** An editable polygon on a store's map, hover and selection going round through the store. */
async function polygonOnStore() {
  const maplace = createMaplace({
    locations: [{ id: "p", type: "polygon", path: OUTLINE, holes: [HOLE], editable: true }],
    view: { kind: "center", center: { lat: 0, lng: 0 }, zoom: 7 },
  });
  const { map } = await onMapLibre(maplace);
  const handleCount = () => map.getContainer().querySelectorAll(".maplace-edit-handle").length;
  const point = (at: LatLng) => pagePointOf(map, at);
  return { maplace, map, handleCount, point };
}

const hovered = (maplace: ReturnType<typeof createMaplace>) => maplace.getSnapshot().hoveredId;

describe("an editable shape's handles, as a user points at it on MapLibre", () => {
  it("shows them while the pointer is on the shape, none at rest", async () => {
    const { maplace, handleCount, point } = await polygonOnStore();
    expect(handleCount()).toBe(0);
    await commands.moveMouse(point(ON_FILL));
    await vi.waitFor(() => expect(handleCount()).toBe(16));
    await commands.moveMouse(point(AWAY));
    await vi.waitFor(() => expect(handleCount()).toBe(0));
    expect(hovered(maplace)).toBeUndefined();
  });

  it("keeps a hovered shape's handles through a drag that leaves it, and after the drop until the pointer moves on", async () => {
    const { maplace, handleCount, point } = await polygonOnStore();
    await commands.moveMouse(point(ON_FILL));
    await vi.waitFor(() => expect(handleCount()).toBe(16));
    await commands.moveMouse(point(CORNER));
    await commands.holdMouse(point(CORNER));
    await commands.moveMouse(point(DRAGGED_TO));
    expect(handleCount()).toBe(16);
    await commands.releaseMouse();
    await vi.waitFor(() => expect(locationPath(maplace)?.[2]?.lat).toBeCloseTo(DRAGGED_TO.lat, 0));
    expect(handleCount()).toBe(16);
    await commands.moveMouse(point(AWAY));
    await vi.waitFor(() => expect(handleCount()).toBe(0));
  });

  it("drags a hovered shape's corner again straight after its drop, the pointer not moved between", async () => {
    const { maplace, handleCount, point } = await polygonOnStore();
    await commands.moveMouse(point(CORNER));
    await vi.waitFor(() => expect(handleCount()).toBe(16));
    await commands.pressMouse([point(CORNER), point(DRAGGED_TO)]);
    await vi.waitFor(() => expect(locationPath(maplace)?.[2]?.lat).toBeCloseTo(DRAGGED_TO.lat, 0));
    await commands.pressMouse([point(DRAGGED_TO), point(CORNER)]);
    await vi.waitFor(() => expect(locationPath(maplace)?.[2]?.lat).toBeCloseTo(CORNER.lat, 0));
  });

  it("reports no hover for a shape whose handle is let go outside the map, its handles gone at the next move", async () => {
    const { maplace, map, handleCount, point } = await polygonOnStore();
    await commands.moveMouse(point(CORNER));
    await vi.waitFor(() => expect(handleCount()).toBe(16));
    await commands.holdMouse(point(CORNER));
    await commands.moveMouse(outsideOf(map));
    await commands.releaseMouse();
    await commands.moveMouse({ ...outsideOf(map), y: outsideOf(map).y + 10 });
    await vi.waitFor(() => expect(handleCount()).toBe(0));
    expect(hovered(maplace)).toBeUndefined();
  });
});

function locationPath(maplace: ReturnType<typeof createMaplace>) {
  const location = maplace.getSnapshot().locations.find(({ id }) => id === "p");
  return location?.type === "polygon" ? location.path : undefined;
}

/** A point below the map's container, off the map. */
function outsideOf(map: MapLibreMap) {
  const box = map.getContainer().getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.bottom + 20 };
}
