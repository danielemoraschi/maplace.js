/// <reference types="google.maps" />
import { expect, onTestFinished } from "vitest";
import type { Adapter } from "../../adapter";
import type { LatLng } from "../../geometry";
import { sizedContainer } from "../../testing/container";
import { assembleGoogleAdapter } from "../assemble";
import { latLngOf } from "../lat-lng";
import { createMapState } from "../map-state";
import { type ColorScheme, checkGoogleOptions } from "../options";
import { TEST_OPTIONS } from "./subject";

/**
 * Where a test's store draws: the page's own map, or a container of its own (sized by default),
 * and the colour scheme of a map maplace creates there.
 */
export interface StoreSite {
  readonly map?: google.maps.Map | undefined;
  readonly container?: HTMLElement | undefined;
  readonly colorScheme?: ColorScheme | undefined;
}

/** A store as far as attaching it goes (this layer doesn't see the store's own types). */
export interface Attachable {
  attach(adapter: Adapter, container: HTMLElement): () => void;
  whenReady(): Promise<void>;
  on(name: "error", listener: (payload: { error: unknown }) => void): () => void;
}

/**
 * `maplace` attached to Google in a container on the page, detached and gone after the test,
 * whether its load succeeds or not: the errors it emits, and how its load ended (`"ready"`, or
 * what `whenReady` rejected with). The adapter is given back for what a page calls on it directly
 * (`mountControl`), and the Google map it draws on once open, created or the page's own. Built
 * as `createGoogleAdapter` builds it (no probe), with its state kept for the test to read.
 */
export function attachedToGoogle<Store extends Attachable>(
  maplace: Store,
  { map, container, colorScheme }: StoreSite = {},
) {
  const holder = container ?? (map?.getDiv().parentElement as HTMLElement) ?? sizedContainer();
  const errors: unknown[] = [];
  maplace.on("error", ({ error }) => errors.push(error));
  const outcome = maplace.whenReady().then(
    () => "ready",
    (error: unknown) => error,
  );
  const options = { ...TEST_OPTIONS, map, colorScheme };
  checkGoogleOptions(options);
  const state = createMapState();
  const adapter = assembleGoogleAdapter(options, state);
  const detach = maplace.attach(adapter, holder);
  onTestFinished(() => {
    detach();
    holder.remove();
  });
  const googleMap = () => state.mounted?.map;
  return { maplace, container: holder, adapter, googleMap, errors, outcome };
}

/** `maplace` attached to Google as `attachedToGoogle` does, once its load is ready. */
export async function onGoogle<Store extends Attachable>(maplace: Store, site: StoreSite = {}) {
  const attached = attachedToGoogle(maplace, site);
  await maplace.whenReady();
  return attached;
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

/**
 * How long a wait on Google's tiles may take: its `idle`, so a move settled and reported, waits
 * for them, which G5 saw take seconds under the test runner's load (CI's runners are slower still).
 */
export const TILES_TIMEOUT_MS = 15_000;

/** Waits for the store's fit of its locations, not the view a map opens at (zoom 1). */
export async function fitted(maplace: {
  getSnapshot(): { viewport?: { zoom: number } | undefined };
}) {
  const zoom = () => maplace.getSnapshot().viewport?.zoom ?? 0;
  await expect.poll(zoom, { timeout: TILES_TIMEOUT_MS }).toBeGreaterThan(2);
}
