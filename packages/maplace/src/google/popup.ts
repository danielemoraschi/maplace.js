import type { GoogleMapState } from "./map-state";
import type { MapPart } from "./mounted-map";
import { type PopupSession, startPopupSession } from "./popup-session";

/** The adapter's popup: a part on the open map, kept in step after each `present` and `apply`. */
export interface Popup {
  readonly part: MapPart;
  sync(): void;
}

/** Popups for the map once it opens, ended when it closes; until then and after, no-ops. */
export function createPopup(state: GoogleMapState): Popup {
  let session: PopupSession | undefined;
  return {
    part: {
      open(mounted) {
        session = startPopupSession(state, mounted);
        mounted.onDestroy(() => {
          session?.end();
          session = undefined;
        });
        session.sync();
      },
    },
    sync: () => session?.sync(),
  };
}
