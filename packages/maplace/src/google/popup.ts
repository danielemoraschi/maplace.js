import {
  createPopupPart,
  type PopupPart,
  type PopupSession,
  startPopupSession,
} from "../adapter-kit/popup-session";
import { adoptStyles } from "../adopted-styles";
import type { GoogleMapState } from "./map-state";
import type { MountedMap } from "./mounted-map";
import { POPUP_STYLES } from "./popup-styles";
import { createPopupWindow } from "./popup-window";

/** The adapter's popup: a part on the open map, kept in step after each `present` and `apply`. */
export type Popup = PopupPart<MountedMap>;

/** Popups for the map once it opens, ended when it closes; until then and after, no-ops. */
export function createPopup(state: GoogleMapState): Popup {
  return createPopupPart((mounted) => startGooglePopups(state, mounted));
}

/**
 * The popup session on Google's InfoWindow, which reports its content in the DOM at `domready`,
 * in Google's bubble styled by maplace's popup styles.
 */
function startGooglePopups(state: GoogleMapState, mounted: MountedMap): PopupSession {
  const document = mounted.map.getDiv().ownerDocument;
  adoptStyles(document, POPUP_STYLES);
  return startPopupSession({
    presented: () => state.presented,
    placedOf: (id) => state.placed.get(id),
    openWindow: (events) => createPopupWindow(mounted, events),
    document,
    openOn: mounted.popup.openOn,
    live: mounted.live,
    onTracked(popup) {
      state.popup = popup;
    },
  });
}
