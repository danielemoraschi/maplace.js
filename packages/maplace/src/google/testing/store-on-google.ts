/// <reference types="google.maps" />
import { onTestFinished } from "vitest";
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

/** `maplace` attached to Google in a container on the page, detached and gone after the test. */
export async function onGoogle<Store extends Attachable>(
  maplace: Store,
  { map, container }: StoreSite = {},
) {
  const holder = container ?? (map?.getDiv().parentElement as HTMLElement) ?? sizedContainer();
  const detach = maplace.attach(createGoogleAdapter({ ...TEST_OPTIONS, map }), holder);
  onTestFinished(() => {
    detach();
    holder.remove();
  });
  await maplace.whenReady();
  return { maplace, container: holder };
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
