/// <reference types="google.maps" />
import { vi } from "vitest";
import type { LatLng } from "../../geometry";
import type { GoogleShape } from "../placed-location";
import type { MapInput } from "./map-input";
import { TILES_TIMEOUT_MS } from "./store-on-google";

/**
 * How far north of a point the pointer steps and back while waiting: about 2 px at zoom 7, the
 * zoom the shape tests press at, so it stays on a handle or a small shape.
 */
const NUDGE = 0.02;

/**
 * Waits, the pointer at `at`, until Google takes it there for `shape`: on a slow machine a shape
 * takes input some time after the map's `idle`, and a click before that goes to the map.
 */
export function pointerTakenByShape(
  input: MapInput,
  shape: GoogleShape,
  at: LatLng,
): Promise<void> {
  return pointerTaken(input, shape, at, () => true);
}

/**
 * Waits, the pointer at `at`, until Google takes it there for one of `shape`'s handles, a vertex
 * or a midpoint: handles come later than the shape, and a press before them drags the map.
 */
export function pointerTakenByHandle(
  input: MapInput,
  shape: google.maps.Polygon | google.maps.Polyline,
  at: LatLng,
): Promise<void> {
  return pointerTaken(
    input,
    shape,
    at,
    (event) => event.vertex !== undefined || event.edge !== undefined,
  );
}

/**
 * Moves the pointer off `at` and back until Google fires a pointer event on `shape` that `takes`:
 * Google fires none at a pointer holding still while a shape becomes ready for it.
 */
async function pointerTaken(
  input: MapInput,
  shape: GoogleShape,
  at: LatLng,
  takes: (event: google.maps.PolyMouseEvent) => boolean,
): Promise<void> {
  let taken = false;
  const listeners = ["mouseover", "mousemove"].map((type) =>
    shape.addListener(type, (event: google.maps.PolyMouseEvent) => {
      if (takes(event)) taken = true;
    }),
  );
  try {
    await vi.waitUntil(
      async () => {
        await input.pointTo({ lat: at.lat + NUDGE, lng: at.lng });
        await input.pointTo(at);
        return taken;
      },
      { timeout: TILES_TIMEOUT_MS },
    );
  } finally {
    for (const listener of listeners) listener.remove();
  }
}
