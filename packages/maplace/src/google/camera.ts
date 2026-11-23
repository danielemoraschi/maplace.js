/// <reference types="google.maps" preserve="true" />
import { hasSize, sizeOf } from "../adapter-kit/map-size";
import { measurePanelInsets, NO_INSETS, panelsReachInto } from "../adapter-kit/panel-insets";
import { createViewFollower, type ViewFollower } from "../adapter-kit/view-follower";
import { moveTo } from "./camera-moves";
import type { Drawing } from "./drawing";
import { watchMapResizes } from "./map-resizes";
import type { GoogleMapState } from "./map-state";
import type { MapPart, MountedMap } from "./mounted-map";
import { createStandingView } from "./standing-view";

/** The adapter's camera: a part on the open map, `setView`, and a `sync` after each `apply`. */
export interface Camera extends Pick<ViewFollower, "setView" | "sync" | "panelsSettled"> {
  readonly part: MapPart;
}

/**
 * Moves the Google map to the store's views, as the view follower says when, a fit clear of
 * maplace's panels; Google draws a control late and moves it once more (`testing/controls-placed.ts`), so
 * each `idle` checks what they cover again.
 */
export function createCamera(
  state: GoogleMapState,
  drawing: Pick<Drawing, "applied" | "drawnThrough">,
): Camera {
  const follower = createViewFollower(drawing);

  function open({ map, onDestroy }: MountedMap): void {
    const standing = createStandingView(map);
    const stopWatching = watchMapResizes(map, follower.resized);
    const idle = map.addListener("idle", follower.panelsSettled);
    onDestroy(() => {
      follower.close();
      stopWatching();
      idle.remove();
      standing.stop();
    });
    follower.open({
      sizeOf() {
        const size = sizeOf(map.getDiv());
        return hasSize(size) ? size : undefined;
      },
      geometryOf: (id) => state.placed.get(id)?.drawable().geometry,
      panelInsets: () => measurePanelInsets(map.getDiv()),
      keptClear: () => NO_INSETS,
      reachesInto: (insets) => panelsReachInto(map.getDiv(), insets),
      move: (move, insets) => moveTo(map, move, insets),
      standing,
    });
  }

  return {
    part: { open },
    setView: follower.setView,
    sync: follower.sync,
    panelsSettled: follower.panelsSettled,
  };
}
