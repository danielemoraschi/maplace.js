import { type MountSettings, mountSubject } from "../../testing/conformance/harness";
import type { ConformanceSubject } from "../../testing/conformance/subject";
import { assembleGoogleAdapter } from "../assemble";
import { createdMapOptions, elementFilling } from "../map-source";
import type { GoogleAdapterOptions } from "../options";
import { probedMapState } from "./probe";

/** The tests' Google adapter: on Google's public demo map ID. */
export const TEST_OPTIONS: GoogleAdapterOptions = { mapId: "DEMO_MAP_ID" };

/** The groups Google is built for; each row adds its own, and the last drops this list. */
const BUILT = [
  "declarations",
  "lifecycle",
  "drawing",
  "presentation",
  "popups",
  "camera",
  "container",
  "reports",
  "editing",
] as const;

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
  groups: BUILT,
  create: () => googleParts(),
};

/** Google on the page's own map, made in the container first, as a page would. */
export const PAGE_MAP_SUBJECT: ConformanceSubject = {
  name: "google on the page's map",
  groups: BUILT,
  create: (container) => googleParts({ ...TEST_OPTIONS, map: pageMapIn(container) }),
};

/** A map the page made in `container`, as a page would before attaching. */
export function pageMapIn(container: HTMLElement): google.maps.Map {
  return new google.maps.Map(elementFilling(container), createdMapOptions(TEST_OPTIONS));
}
