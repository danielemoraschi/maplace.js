import { createViewFollower, type ViewFollower } from "../adapter-kit/view-follower";
import { moveTo } from "./camera-moves";
import type { Drawing } from "./drawing";
import { mapSizeOf } from "./map-size";
import type { MapLibreState } from "./map-state";
import type { MapPart, MountedMapLibre } from "./mounted-map";
import { createStandingView } from "./standing-view";

/** The adapter's camera: a part on the open map, `setView`, and a `sync` after each `apply`. */
export interface Camera extends Pick<ViewFollower, "setView" | "sync"> {
  readonly part: MapPart;
}

/**
 * Moves the MapLibre map to the store's views, as the view follower says when: once the map has
 * a size MapLibre has taken in, shown again after MapLibre resizes it.
 */
export function createCamera(
  state: MapLibreState,
  drawing: Pick<Drawing, "applied" | "drawnThrough">,
): Camera {
  const follower = createViewFollower(drawing);

  function open({ map, onDestroy }: MountedMapLibre): void {
    const standing = createStandingView(map);
    map.on("resize", follower.resized);
    onDestroy(() => {
      follower.close();
      map.off("resize", follower.resized);
      standing.stop();
    });
    follower.open({
      sizeOf: () => mapSizeOf(map),
      geometryOf: (id) => state.placed.get(id)?.drawable().geometry,
      move: (move) => moveTo(map, move),
      standing,
    });
  }

  return { part: { open }, setView: follower.setView, sync: follower.sync };
}
