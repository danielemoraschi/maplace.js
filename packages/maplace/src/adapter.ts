import type { Drawable } from "./drawable";
import type { MaplaceError } from "./errors";
import type { Geometry, LatLng } from "./geometry";
import type { ResolvedPopupOptions } from "./popup";
import type { Route, RouteResult } from "./route";
import type { ResolvedView, Viewport } from "./viewport";

/** Features that differ between providers. Asking for a missing one is misuse and throws. */
export type Capability = "route" | "cluster" | "circle" | "edit";

/** Where an on-map control sits, in provider-neutral terms. */
export type ControlPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** Every corner, as a record so a new one fails to compile until it is listed. */
export const CONTROL_POSITIONS = {
  "top-left": true,
  "top-right": true,
  "bottom-left": true,
  "bottom-right": true,
} as const satisfies Record<ControlPosition, true>;

/**
 * What changed since the last `apply`; adapters touch only these locations. Apply `removed`
 * first: a location whose `type` changed is in `removed` and in `added`, never in `updated`. An
 * updated location has at least one `Drawable` field with a new reference.
 */
export interface LocationDiff {
  readonly added: readonly Drawable[];
  readonly updated: readonly Drawable[];
  readonly removed: readonly string[];
}

/** Selection, hover and visibility. Unchanged fields keep their reference between calls. */
export interface PresentationState {
  readonly selectedId: string | undefined;
  readonly hoveredId: string | undefined;
  /** Ids hidden by the filter or `visible: false`. */
  readonly hiddenIds: ReadonlySet<string>;
}

/**
 * The only way an adapter reports back. Adapters never read or write the store directly. A report
 * about a location the store no longer shows, or a route result or failure for a route since
 * replaced or cleared, is a race with what the adapter is still drawing and is ignored. A report
 * the store can't take (an edit or a write-back for a location that isn't `editable` or of another
 * type, a click position or a viewport no map shows, a route result whose legs don't run between
 * its route's stops) changes nothing and is rethrown in a microtask; no report ever throws back
 * into the adapter.
 */
export interface AdapterHost {
  /** A click on a location. */
  reportSelectionChange(id: string): void;
  /**
   * A single click on the map itself, not on any location, and where; the store clears the
   * selection. A double-click is not a click: neither of its clicks is reported.
   */
  reportMapClick(position: LatLng): void;
  reportHoverChange(id: string | undefined): void;
  /**
   * Where a user's drag or reshape has a location so far, as often as the provider says; before
   * `reportLocationChange`, the last edit reported is where it ended (a provider that says only on
   * release reports both then). The store keeps none of it.
   */
  reportLocationEdit(id: string, geometry: Geometry): void;
  /** A drag or edit ended, moving or reshaping a location; `geometry.type` is the location's own. */
  reportLocationChange(id: string, geometry: Geometry): void;
  reportPopupOpen(id: string, element: HTMLElement): void;
  /** With `openOn: 'click'`, the store deselects when the selected location's popup closes. */
  reportPopupClose(id: string): void;
  reportViewportChange(viewport: Viewport): void;
  /**
   * A route computed for `route`, the route `setRoute` gave; `result` undefined clears the stored
   * result. The store takes a result only for its current route (the same stops, the same ones
   * passed through, the same travel mode, the same things avoided).
   */
  reportRouteChange(route: Route, result: RouteResult | undefined): void;
  /**
   * Runtime failures only; misuse is thrown by the store before it reaches the adapter. A
   * `route-failed` names the route it was computing, and counts only for the current route.
   */
  reportError(error: MaplaceError, route?: Route): void;
}

/** Everything `mount` needs, as one object. */
export interface MountContext {
  readonly container: HTMLElement;
  readonly host: AdapterHost;
  /** Aborting cancels loading. */
  readonly signal: AbortSignal;
  /** Fixed for the life of the map, unlike `PresentationState`. */
  readonly cluster: boolean;
  readonly popup: ResolvedPopupOptions;
}

/**
 * A map provider. Google ships with maplace; others implement this contract. One instance
 * drives one map: create a new adapter for every `attach`.
 */
export interface Adapter {
  readonly capabilities: ReadonlySet<Capability>;
  /** Most stops a route may have; checked by the store like a capability. */
  readonly routeStopLimit?: number | undefined;
  /**
   * The element of a map the page made, when the adapter draws on one: `attach`'s container must
   * be it or hold it.
   */
  readonly pageMapElement?: HTMLElement | undefined;
  /**
   * Loads the provider and draws into the container; resolves once the provider has said what it
   * can say at load (Google: whether the page's map can show markers). A failure the provider
   * reports later goes to `reportError`.
   */
  mount(context: MountContext): Promise<void>;
  /**
   * Resolves once the diff is drawn and never rejects (failures go to `reportError`); `whenReady`
   * waits for the first one. Large diffs are drawn in chunks so input is never blocked for long
   * (aim: no task over 200 ms). The store does not wait between calls: an adapter applies diffs
   * in order, and `present`/`setView` may already name ids from a diff still being drawn.
   */
  apply(diff: LocationDiff): Promise<void>;
  present(state: PresentationState): void;
  /**
   * Moves the camera; `select` sends a `location` view unless `pan: false` (the store fills in a
   * location's own `zoom`; a shape with neither comes as a box around it). A view waits while the
   * container has no size (a closed tab or dialog), which reports no viewport either; once it has
   * one, and after each resize, the last view is shown again unless the user moved the map since
   * (a move after their input on it, until a view is shown again; one with no input doesn't count,
   * a page's code moving its own map for one).
   */
  setView(view: ResolvedView): void;
  /**
   * The route to draw, sent again only when it changes. A stop moving is the adapter's to notice
   * (its location's next diff): it computes again then, after a drag only once it ends, at most
   * once per task. A new style alone redraws the line without computing; new stops, `via`, travel
   * mode or `avoid` compute again; `undefined` clears it, reporting nothing (the store has).
   */
  setRoute(route: Route | undefined): void;
  /**
   * Places a view on the map, in a corner, whenever it is called (before the map opens it waits);
   * returns a function that removes it, safe twice and after destroy. Destroy takes every control
   * off. The node is moved, never changed, and its keys, wheel and drags never move the map. Mounted
   * again, the node moves, and only the remover its latest mount returned takes it off.
   */
  mountControl(node: HTMLElement, position: ControlPosition): () => void;
  destroy(): void;
}
