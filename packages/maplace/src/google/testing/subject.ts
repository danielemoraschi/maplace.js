import { elementFilling } from "../../adapter-kit/map-element";
import { type MountSettings, mountSubject } from "../../testing/conformance/harness";
import type { ConformanceSubject } from "../../testing/conformance/subject";
import { assembleGoogleAdapter } from "../assemble";
import { createdMapOptions } from "../map-source";
import type { GoogleAdapterOptions } from "../options";
import { probedMapState } from "./probe";

/** The tests' Google adapter: on Google's public demo map ID. */
export const TEST_OPTIONS: GoogleAdapterOptions = { mapId: "DEMO_MAP_ID" };

/** A new Google adapter, its probe, and the map state the adapter draws into. */
export function googleParts(options = TEST_OPTIONS) {
  const { state, probe } = probedMapState();
  return { state, adapter: assembleGoogleAdapter(options, state), probe };
}

/** A Google adapter mounted as the store would, taken down after the test (`unmountAll`). */
export async function mountedGoogle(
  options: GoogleAdapterOptions = TEST_OPTIONS,
  settings?: MountSettings,
) {
  const parts = googleParts(options);
  const mounted = await mountSubject({ name: "google", create: () => parts }, settings);
  return { state: parts.state, ...mounted };
}

/** Google on a map it creates, for the conformance suite. */
export const GOOGLE_SUBJECT: ConformanceSubject = {
  name: "google",
  create: () => googleParts(),
};

/**
 * Google on the page's own map, made in the container first, as a page would. It runs only the
 * groups the page's map can change: once open, the adapter draws on it with the same code as on a
 * map it creates, so the others are `GOOGLE_SUBJECT`'s, and each check here makes a billed map.
 * What differs: the map is made before mount (the camera's and container's reports start at once),
 * sits in the page's element, not maplace's (no panel class for controls), and is given back as
 * the page made it (lifecycle). Clusters render when maplace flushes, not on Google's idle, so
 * they stay with the created map.
 */
export const PAGE_MAP_SUBJECT: ConformanceSubject = {
  name: "google on the page's map",
  provedOn: {
    subject: GOOGLE_SUBJECT,
    groups: ["drawing", "presentation", "popups", "reports", "editing", "route", "cluster"],
  },
  create: (container) => googleParts({ ...TEST_OPTIONS, map: pageMapIn(container) }),
};

/** A map the page made in `container`, as a page would before attaching; `options` override. */
export function pageMapIn(
  container: HTMLElement,
  options: google.maps.MapOptions = {},
): google.maps.Map {
  return new google.maps.Map(elementFilling(container), {
    ...createdMapOptions(TEST_OPTIONS),
    ...options,
  });
}
