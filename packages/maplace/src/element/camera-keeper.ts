import type { Maplace, Snapshot, View } from "../index";
import { isShown } from "../location-state";

/** Keeps a map's camera through a reopen, as the store's view. */
export interface CameraKeeper {
  /** A new map opens: its first viewport is where it opened, before the store's view landed. */
  opening(): void;
  /** Sets the store's view to where the map settled, unless a view the map hasn't shown waits. */
  keep(): void;
}

/**
 * Remembers the view each viewport after a map's first settled under, but for a fit waiting for
 * locations, which hasn't landed. A view set since (not shown yet), a fit the user hasn't moved
 * off, or a map that has only shown where it opened, is left to the store, which sends its view
 * to the next map.
 */
export function createCameraKeeper(store: Maplace): CameraKeeper {
  let openingShown = false;
  let settledView: View | undefined;
  let movedSinceView = false;
  store.on("viewportChange", () => {
    const now = store.getSnapshot();
    if (openingShown && !fitWaits(now)) {
      movedSinceView = now.view === settledView;
      settledView = now.view;
    }
    openingShown = true;
  });
  return {
    opening() {
      openingShown = false;
      settledView = undefined;
    },
    keep() {
      const { view, viewport } = store.getSnapshot();
      const fitStands = view.kind === "fit-all" && !movedSinceView;
      if (viewport === undefined || view !== settledView || fitStands) return;
      store.setView(viewport.center, viewport.zoom);
    },
  };
}

/** A fit with no location shown: what the map shows is where it opened, or the user's moves. */
function fitWaits({ view, locations, filter }: Snapshot): boolean {
  return view.kind === "fit-all" && !locations.some((location) => isShown(location, filter));
}
