import type { MountContext } from "../../adapter";
import type { ResolvedPopupOptions } from "../../popup";
import { createRecordingHost } from "../../testing/conformance/recording-host";
import { createMapState, type GoogleMapState } from "../map-state";
import { mountMap } from "../mounted-map";
import { createPlacingSite } from "../placing-site";
import { StubMap, stubLibraries } from "./stub-libraries";

/** Popups that open on a click, as the store resolves them by default. */
export const CLICK_POPUPS: ResolvedPopupOptions = {
  maxWidth: undefined,
  offset: [0, 0],
  openOn: "click",
};

/**
 * A mounted map of stubs on happy-dom, as placing and drawing see it: its state, the host it
 * reports to, and how to close it. Popups open on click unless `popup` says otherwise.
 */
export function stubMounted(
  state: GoogleMapState = createMapState(),
  popup: Partial<ResolvedPopupOptions> = {},
) {
  const host = createRecordingHost();
  const controller = new AbortController();
  const libraries = stubLibraries();
  const container = document.createElement("div");
  const map = new StubMap(container) as unknown as google.maps.Map;
  const context: MountContext = {
    container,
    host,
    signal: controller.signal,
    cluster: false,
    popup: { ...CLICK_POPUPS, ...popup },
  };
  const { mounted, close } = mountMap({ inUse: { map, release() {} }, libraries, context });
  state.mounted = mounted;
  return { state, mounted, host, controller, close };
}

/** A placing site on a stub map, reading the state's presentation. */
export function stubSite(state: GoogleMapState = createMapState()) {
  const mounted = stubMounted(state);
  return { ...mounted, site: createPlacingSite(mounted.mounted, state) };
}
