/// <reference types="google.maps" preserve="true" />
import { type CameraSite, cameraMove } from "../adapter-kit/camera-move";
import { hasSize, sizeOf } from "../adapter-kit/map-size";
import type { MapSize } from "../adapter-kit/web-mercator";
import type { ResolvedView } from "../viewport";
import { moveTo } from "./camera-moves";
import type { Drawing } from "./drawing";
import { watchMapResizes } from "./map-resizes";
import type { GoogleMapState } from "./map-state";
import type { MapPart, MountedMap } from "./mounted-map";
import { createStandingView, type StandingView } from "./standing-view";

/** The adapter's camera: a part on the open map, `setView`, and a `sync` after each `apply`. */
export interface Camera {
  readonly part: MapPart;
  setView(view: ResolvedView): void;
  /** Shows a view still waiting for its location, once the location is placed. */
  sync(): void;
}

/** A view still to show, and how many diffs the store had applied when it sent it. */
interface WaitingView {
  readonly view: ResolvedView;
  readonly diffsBefore: number;
}

/**
 * Moves the map to the store's views. A view waits until the map opens and has a size, and a
 * `location` view until the diffs sent before it are drawn (its location may be moving, or placed
 * anew under its id), never for later ones; then it moves the camera once, and a newer view
 * replaces it. A resize shows the last view again, unless the user has moved the map since.
 */
export function createCamera(
  state: GoogleMapState,
  drawing: Pick<Drawing, "applied" | "drawnThrough">,
): Camera {
  let waiting: WaitingView | undefined;
  let standing: StandingView | undefined;

  function sync(): void {
    const map = state.mounted?.map;
    if (map === undefined || waiting === undefined) return;
    const size = sizeOf(map.getDiv());
    if (!hasSize(size)) return;
    const move = cameraMove(waiting.view, siteFor(waiting, size));
    if (move === undefined) return;
    standing?.shown(waiting.view);
    waiting = undefined;
    moveTo(map, move);
  }

  function reapplyStandingView(): void {
    const view = standing?.standing();
    waiting ??= view && { view, diffsBefore: drawing.applied() };
    sync();
  }

  function open({ map, onDestroy }: MountedMap): void {
    const view = createStandingView(map);
    standing = view;
    const stopWatching = watchMapResizes(map, reapplyStandingView);
    onDestroy(() => {
      stopWatching();
      view.stop();
    });
    sync();
  }

  /** The map as `waiting` sees it: no location is known until the diffs before it are drawn. */
  function siteFor({ diffsBefore }: WaitingView, size: MapSize): CameraSite {
    const drawn = drawing.drawnThrough(diffsBefore);
    return {
      geometryOf: (id) => (drawn ? state.placed.get(id)?.drawable().geometry : undefined),
      size: () => size,
    };
  }

  return {
    part: { open },
    setView(view) {
      waiting = { view, diffsBefore: drawing.applied() };
      sync();
    },
    sync,
  };
}
