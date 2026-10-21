import type { Geometry } from "../geometry";
import type { ResolvedView } from "../viewport";
import { type CameraMove, type CameraSite, cameraMove } from "./camera-move";
import type { DiffQueue } from "./diff-queue";
import type { MapSize } from "./web-mercator";

/** The view the map was last moved to, while nothing else has moved it. */
export interface StandingView {
  /** The camera is being moved to `view`: it stands from now on. */
  shown(view: ResolvedView): void;
  /** Undefined once the user moved the map: a resize then keeps what they chose. */
  standing(): ResolvedView | undefined;
  stop(): void;
}

/** The open map as the follower sees it. */
export interface ViewSite {
  /** The map's size as the provider has taken it in; undefined while it has none. */
  sizeOf(): MapSize | undefined;
  /** Where a placed location is drawn now. */
  geometryOf(id: string): Geometry | undefined;
  move(move: CameraMove): void;
  readonly standing: StandingView;
}

/** An adapter's camera, short of moving it: which view to show, and when it can be. */
export interface ViewFollower {
  setView(view: ResolvedView): void;
  /** Shows a view still waiting for its location, once the location is placed. */
  sync(): void;
  /** The map's size changed: the standing view is shown again. */
  resized(): void;
  open(site: ViewSite): void;
  close(): void;
}

/** A view still to show, and how many diffs the store had applied when it sent it. */
interface WaitingView {
  readonly view: ResolvedView;
  readonly diffsBefore: number;
}

/**
 * Follows the store's views. A view waits until the map opens and has a size, and a `location`
 * view until the diffs sent before it are drawn (its location may be moving, or placed anew under
 * its id), never for later ones; then it moves the camera once, and a newer view replaces it. A
 * resize shows the last view again, unless the user has moved the map since.
 */
export function createViewFollower(
  drawing: Pick<DiffQueue, "applied" | "drawnThrough">,
): ViewFollower {
  let waiting: WaitingView | undefined;
  let site: ViewSite | undefined;

  function sync(): void {
    if (site === undefined || waiting === undefined) return;
    const size = site.sizeOf();
    if (size === undefined) return;
    const move = cameraMove(waiting.view, cameraSiteFor(site, waiting, size));
    if (move === undefined) return;
    site.standing.shown(waiting.view);
    waiting = undefined;
    site.move(move);
  }

  /** The map as `waiting` sees it: no location is known until the diffs before it are drawn. */
  function cameraSiteFor(on: ViewSite, { diffsBefore }: WaitingView, size: MapSize): CameraSite {
    const drawn = drawing.drawnThrough(diffsBefore);
    return {
      geometryOf: (id) => (drawn ? on.geometryOf(id) : undefined),
      size: () => size,
    };
  }

  return {
    setView(view) {
      waiting = { view, diffsBefore: drawing.applied() };
      sync();
    },
    sync,
    resized() {
      const view = site?.standing.standing();
      waiting ??= view && { view, diffsBefore: drawing.applied() };
      sync();
    },
    open(next) {
      site = next;
      sync();
    },
    close() {
      site = undefined;
    },
  };
}
