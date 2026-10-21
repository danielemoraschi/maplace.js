import {
  createPopupPart,
  type PopupPart,
  type PopupSession,
  startPopupSession,
} from "../adapter-kit/popup-session";
import { adoptStyles } from "../adopted-styles";
import type { MapLibreState } from "./map-state";
import type { MountedMapLibre } from "./mounted-map";
import { POPUP_STYLES } from "./popup-styles";
import { createPopupWindow } from "./popup-window";

/** The adapter's popup: a part on the open map, kept in step after each `present` and `apply`. */
export type Popup = PopupPart<MountedMapLibre>;

/** Popups for the map once it opens, ended when it closes; until then and after, no-ops. */
export function createPopup(state: MapLibreState): Popup {
  return createPopupPart((mounted) => startMapLibrePopups(state, mounted));
}

/** The popup session on MapLibre's popup, its heading styled by maplace's popup styles. */
function startMapLibrePopups(state: MapLibreState, mounted: MountedMapLibre): PopupSession {
  const document = mounted.map.getContainer().ownerDocument;
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
