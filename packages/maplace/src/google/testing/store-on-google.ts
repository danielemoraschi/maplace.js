/// <reference types="google.maps" />
import { expect, onTestFinished } from "vitest";
import type { Adapter } from "../../adapter";
import type { LatLng } from "../../geometry";
import { sizedContainer } from "../../testing/container";
import { createGoogleAdapter } from "../index";
import { latLngOf } from "../lat-lng";
import { TEST_OPTIONS } from "./subject";

/** Where a test's store draws: the page's own map, or a container of its own (sized by default). */
interface StoreSite {
  readonly map?: google.maps.Map | undefined;
  readonly container?: HTMLElement | undefined;
}

/** A store as far as attaching it goes (this layer doesn't see the store's own types). */
interface Attachable {
  attach(adapter: Adapter, container: HTMLElement): () => void;
  whenReady(): Promise<void>;
}

/**
 * `maplace` attached to Google in a container on the page, detached and gone after the test; the
 * adapter is given back for what a page calls on it directly (`mountControl`).
 */
export async function onGoogle<Store extends Attachable>(
  maplace: Store,
  { map, container }: StoreSite = {},
) {
  const holder = container ?? (map?.getDiv().parentElement as HTMLElement) ?? sizedContainer();
  const adapter = createGoogleAdapter({ ...TEST_OPTIONS, map });
  const detach = maplace.attach(adapter, holder);
  onTestFinished(() => {
    detach();
    holder.remove();
  });
  await maplace.whenReady();
  return { maplace, container: holder, adapter };
}

/** Whether a reported centre is `at`, to four decimals of a degree. */
export function centredOn(center: LatLng | undefined, at: LatLng): boolean {
  return center !== undefined && near(center.lat, at.lat) && near(center.lng, at.lng);
}

export function centerOf(map: google.maps.Map): LatLng {
  return latLngOf(map.getCenter() as google.maps.LatLng);
}

function near(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-4;
}

/** How long Google takes at most to settle a fit: its `idle` waits for the tiles. */
export const FIT_TIMEOUT_MS = 5000;

/** Waits for the store's fit of its locations, not the view a map opens at (zoom 1). */
export async function fitted(maplace: {
  getSnapshot(): { viewport?: { zoom: number } | undefined };
}) {
  const zoom = () => maplace.getSnapshot().viewport?.zoom ?? 0;
  await expect.poll(zoom, { timeout: FIT_TIMEOUT_MS }).toBeGreaterThan(2);
}
