/// <reference types="google.maps" preserve="true" />
import { hasSize, sizeOf } from "../adapter-kit/map-size";
import { createViewFollower, type ViewFollower } from "../adapter-kit/view-follower";
import { moveTo } from "./camera-moves";
import type { Drawing } from "./drawing";
import { watchMapResizes } from "./map-resizes";
import type { GoogleMapState } from "./map-state";
import type { MapPart, MountedMap } from "./mounted-map";
import { createStandingView } from "./standing-view";

/** The adapter's camera: a part on the open map, `setView`, and a `sync` after each `apply`. */
export interface Camera extends Pick<ViewFollower, "setView" | "sync"> {
  readonly part: MapPart;
}

/** Moves the Google map to the store's views, as the view follower says when. */
export function createCamera(
  state: GoogleMapState,
  drawing: Pick<Drawing, "applied" | "drawnThrough">,
): Camera {
  const follower = createViewFollower(drawing);

  function open({ map, onDestroy }: MountedMap): void {
    const standing = createStandingView(map);
    const stopWatching = watchMapResizes(map, follower.resized);
    onDestroy(() => {
      follower.close();
      stopWatching();
      standing.stop();
    });
    follower.open({
      sizeOf() {
        const size = sizeOf(map.getDiv());
        return hasSize(size) ? size : undefined;
      },
      geometryOf: (id) => state.placed.get(id)?.drawable().geometry,
      move: (move) => moveTo(map, move),
      standing,
    });
  }

  return { part: { open }, setView: follower.setView, sync: follower.sync };
}
