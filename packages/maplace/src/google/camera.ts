/// <reference types="google.maps" />
import { type CameraMove, type CameraSite, cameraMove } from "../adapter-kit/camera-move";
import type { MapSize } from "../adapter-kit/web-mercator";
import type { ResolvedView } from "../viewport";
import type { Drawing } from "./drawing";
import type { GoogleMapState } from "./map-state";
import type { MapPart } from "./mounted-map";

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
 * Moves the map to the store's views. A view waits until the map opens, and a `location` view
 * until the diffs sent before it are drawn (its location may be moving, or placed anew under its
 * id), never for later ones; then it moves the camera once, and a newer view replaces it.
 */
export function createCamera(
  state: GoogleMapState,
  drawing: Pick<Drawing, "applied" | "drawnThrough">,
): Camera {
  let waiting: WaitingView | undefined;

  function sync(): void {
    const map = state.mounted?.map;
    if (map === undefined || waiting === undefined) return;
    const move = cameraMove(waiting.view, siteFor(waiting, map));
    if (move === undefined) return;
    waiting = undefined;
    moveTo(map, move);
  }

  /** The map as `waiting` sees it: no location is known until the diffs before it are drawn. */
  function siteFor({ diffsBefore }: WaitingView, map: google.maps.Map): CameraSite {
    const drawn = drawing.drawnThrough(diffsBefore);
    return {
      geometryOf: (id) => (drawn ? state.placed.get(id)?.drawable().geometry : undefined),
      size: () => sizeOf(map.getDiv()),
    };
  }

  return {
    part: { open: () => sync() },
    setView(view) {
      waiting = { view, diffsBefore: drawing.applied() };
      sync();
    },
    sync,
  };
}

function sizeOf(element: HTMLElement): MapSize {
  return { width: element.clientWidth, height: element.clientHeight };
}

function moveTo(map: google.maps.Map, move: CameraMove): void {
  switch (move.kind) {
    case "fit":
      map.fitBounds(move.bounds, move.padding);
      return;
    case "jump":
      map.moveCamera({ center: move.center, zoom: move.zoom });
      return;
    case "pan":
      // Google glides when the pan is shorter than the map, as 0.2's selection did.
      map.panTo(move.center);
  }
}
