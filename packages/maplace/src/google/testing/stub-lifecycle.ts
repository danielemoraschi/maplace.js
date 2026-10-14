/// <reference types="google.maps" />
import type { MountContext } from "../../adapter";
import { createRecordingHost } from "../../testing/conformance/recording-host";
import { CONTAINER } from "../../testing/container";
import { createAuthHook } from "../auth-hook";
import type { GoogleLibraries } from "../libraries";
import type { MapInUse, MapSource } from "../map-source";
import { createMapState } from "../map-state";
import { createMapLifecycle, type MapLifecycleParts } from "../mount";
import type { MapPart, MountedMap } from "../mounted-map";
import { stubMapsJs } from "./stub-libraries";
import { CLICK_POPUPS } from "./stub-site";

/** The map every held source opens. */
export const HELD_MAP = { getDiv: () => CONTAINER } as google.maps.Map;

/** Maps JS whose libraries the test finishes loading, and a source counting opens and releases. */
export function heldMaps() {
  let finish: () => void = () => {};
  const loaded = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const libraries = stubMapsJs(loaded);
  const counts = { opened: 0, released: 0 };
  const opening: { libraries?: GoogleLibraries } = {};
  const source: MapSource = {
    open(_container, given): MapInUse {
      counts.opened += 1;
      opening.libraries = given;
      return { map: HELD_MAP, release: () => (counts.released += 1) };
    },
  };
  return { source, counts, finish, libraries, opening };
}

export function mountContext(
  controller = new AbortController(),
  host = createRecordingHost(),
): MountContext {
  return {
    container: CONTAINER,
    signal: controller.signal,
    host,
    cluster: false,
    popup: CLICK_POPUPS,
  };
}

/** A part that records the maps it was opened on. */
export function recordingPart() {
  const openedOn: MountedMap[] = [];
  const part: MapPart = { open: (mounted) => openedOn.push(mounted) };
  return { part, openedOn };
}

/** A page whose key Google refuses when told. */
export function page() {
  const window: { gm_authFailure?: () => void } = {};
  return { keyRefusal: createAuthHook(window), refuseKey: () => window.gm_authFailure?.() };
}

/** Google's verdict on a map it has already initialised: nothing to wait for. */
const INITIALISED = () => Promise.resolve();

/** A map lifecycle on its own map state, with no parts, wait or refusal unless given. */
export function lifecycle(
  source: MapSource,
  {
    parts = [],
    verdict = INITIALISED,
    keyRefusal = page().keyRefusal,
  }: Partial<MapLifecycleParts> = {},
) {
  const state = createMapState();
  return { state, ...createMapLifecycle({ source, state, parts, verdict, keyRefusal }) };
}
