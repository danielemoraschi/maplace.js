import type { PresentationState } from "../../adapter";
import type { Drawable } from "../../drawable";
import type { ResolvedPopupOptions } from "../../popup";
import { presented } from "../../testing/conformance/fixtures";
import { createMapState } from "../map-state";
import { PLACERS } from "../placers";
import { createPlacingSite } from "../placing-site";
import { createPopup } from "../popup";
import { wait } from "./map-waits";
import type { StubInfoWindow } from "./stub-popups";
import { stubMounted } from "./stub-site";

export /** Popups on a stub map holding `drawables`, and how a test drives them as the store would. */
function popupsOn(drawables: Drawable[], settings: Partial<ResolvedPopupOptions> = {}) {
  const state = createMapState();
  const { mounted, host, close } = stubMounted(state, settings);
  const site = createPlacingSite(mounted, state);
  for (const drawable of drawables)
    state.placed.set(drawable.id, PLACERS[drawable.geometry.type](drawable, site));
  const popup = createPopup(state);
  popup.part.open(mounted);
  return {
    state,
    mounted,
    host,
    destroy: close,
    present(next: Partial<PresentationState>) {
      state.presented = presented(next);
      popup.sync();
    },
    update(drawable: Drawable) {
      state.placed.get(drawable.id)?.update(drawable);
      popup.sync();
    },
    remove(id: string) {
      state.placed.get(id)?.remove();
      state.placed.delete(id);
      popup.sync();
    },
    /** As a diff with a type change: removed, then placed again as its new type. */
    replace(drawable: Drawable) {
      state.placed.get(drawable.id)?.remove();
      state.placed.set(drawable.id, PLACERS[drawable.geometry.type](drawable, site));
      popup.sync();
    },
    window: () => state.popup?.window.infoWindow as unknown as StubInfoWindow | undefined,
    /** Google's `domready`, which the stub fires in a microtask. */
    settled: () => wait(0),
  };
}
