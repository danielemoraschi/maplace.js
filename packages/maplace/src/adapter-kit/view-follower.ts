import type { Geometry } from "../geometry";
import type { ResolvedView } from "../viewport";
import { type CameraMove, type CameraSite, cameraMove } from "./camera-move";
import type { DiffQueue } from "./diff-queue";
import {
  deeperInsets,
  type Insets,
  insetsLeavingRoom,
  NO_INSETS,
  sameInsets,
  sizeClearOf,
} from "./panel-insets";
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
  /** What maplace's panels cover of the map's edges now: a fit keeps clear of it where there is room. */
  panelInsets(): Insets;
  /** What a fit always keeps clear of, whatever the room: a provider's own (MapLibre's attribution). */
  keptClear(): Insets;
  /** Whether anything a fit keeps clear of now reaches into the map inside `insets`. */
  reachesInto(insets: Insets): boolean;
  /** Moves the camera, a fit kept clear of `insets` as well as its own padding. */
  move(move: CameraMove, insets: Insets): void;
  readonly standing: StandingView;
}

/** An adapter's camera, short of moving it: which view to show, and when it can be. */
export interface ViewFollower {
  setView(view: ResolvedView): void;
  /** Shows a view still waiting for its location, once the location is placed. */
  sync(): void;
  /** The map's size or projection changed: the standing view is shown again. */
  resized(): void;
  /**
   * What covers the map's edges may have changed (a panel placed, grown or gone): a standing fit is
   * shown again if it no longer keeps clear of it.
   */
  panelsSettled(): void;
  open(site: ViewSite): void;
  close(): void;
}

/** What a move to `view` keeps clear of: the panels where they leave room, and the provider's own. */
function clearOfFor(site: ViewSite, size: MapSize, view: ResolvedView): Insets {
  const panels = insetsLeavingRoom(site.panelInsets(), size, paddingOf(view));
  return deeperInsets(panels, site.keptClear());
}

/** The padding a view keeps around what it fits; none for a view that fits nothing. */
function paddingOf(view: ResolvedView): number {
  return view.kind === "fit-bounds" ? view.padding : 0;
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
  /** What the last move kept clear of. */
  let clearOfAtMove: Insets = NO_INSETS;
  /** What covered the map's edges at the last move, kept clear of or not (the room rule). */
  let coveredAtMove: Insets = NO_INSETS;

  function sync(): void {
    if (site === undefined || waiting === undefined) return;
    const size = site.sizeOf();
    if (size === undefined) return;
    const clearOf = clearOfFor(site, size, waiting.view);
    const move = cameraMove(waiting.view, cameraSiteFor(site, waiting, sizeClearOf(size, clearOf)));
    if (move === undefined) return;
    site.standing.shown(waiting.view);
    waiting = undefined;
    clearOfAtMove = clearOf;
    coveredAtMove = deeperInsets(site.panelInsets(), site.keptClear());
    site.move(move, clearOf);
  }

  /** Shows the standing view again: the map changed under it. */
  function showStanding(): void {
    const view = site?.standing.standing();
    waiting ??= view && { view, diffsBefore: drawing.applied() };
    sync();
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
    resized: showStanding,
    panelsSettled() {
      const view = site?.standing.standing();
      const size = site?.sizeOf();
      if (site === undefined || view?.kind !== "fit-bounds" || size === undefined) return;
      // Fitted again only when a panel reaches past what covered the map at the fit, and the fit
      // would change: a list narrowing as the visitor types, whichever edge it now counts on and
      // kept clear of or not, leaves the camera where it is (RFC); a panel that grows fits again.
      if (sameInsets(clearOfFor(site, size, view), clearOfAtMove)) {
        // The fit stands as it is with what covers the map now: a panel that came too large to
        // keep clear of is part of what it was fitted with from here on.
        coveredAtMove = deeperInsets(coveredAtMove, site.panelInsets());
        return;
      }
      if (site.reachesInto(coveredAtMove)) showStanding();
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
