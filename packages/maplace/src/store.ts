import type { Adapter } from "./adapter";
import type { Listener, ListenOptions, MaplaceEventName, Unsubscribe } from "./events";
import type { LatLng } from "./geometry";
import type { Location } from "./location";
import type { FilterRequest, LocationFilter } from "./location-state";
import type { Route, RouteResult } from "./route";
import type { Bounds, FitOptions, SelectOptions, View, Viewport } from "./viewport";

/** `idle` until attached (or while held for consent), then `loading`, then `ready` or `error`. */
export type LoadState = "idle" | "loading" | "ready" | "error";

/**
 * Immutable state: a new object on every change, while unchanged parts (e.g. `locations`) keep
 * their reference, so subscribers can compare slices cheaply.
 */
export interface Snapshot<Data = unknown> {
  readonly locations: readonly Location<Data>[];
  readonly selectedId: string | undefined;
  readonly hoveredId: string | undefined;
  /** The groups, tags and query shown; undefined shows everything. */
  readonly filter: LocationFilter | undefined;
  /** Last requested view. */
  readonly view: View;
  /** Last reported visible area; undefined until the map is ready. */
  readonly viewport: Viewport | undefined;
  readonly route: Route | undefined;
  readonly routeResult: RouteResult | undefined;
  readonly loadState: LoadState;
}

/** A headless map state: locations, selection, filter, view and route. */
export interface Maplace<Data = unknown> {
  /**
   * Calls `onChange` after every change, once per call. A subscriber or listener that throws
   * doesn't stop the others; its error is rethrown in a microtask.
   */
  subscribe(onChange: () => void): Unsubscribe;
  getSnapshot(): Snapshot<Data>;
  /**
   * Replaces all locations; only the differences reach the map. A location counts as updated
   * when its object changes, so reuse unchanged objects; reused objects are not validated again.
   * Throws on invalid input.
   */
  setLocations(locations: readonly Location<Data>[]): void;
  /**
   * Selects a location, or clears the selection (closing its popup) with `undefined`. Selecting a
   * hidden location (filtered out or `visible: false`) throws.
   */
  select(id: string | undefined, options?: SelectOptions): void;
  /**
   * Marks the location under the pointer or keyboard focus, or none with `undefined`; fires
   * `hoverChange` when it changes. Unknown or hidden ids throw, as for `select`.
   */
  hover(id: string | undefined): void;
  /**
   * Shows only what is in any of these groups (a list, or `{ groups }`), has all of these tags
   * (`{ tags }`) and every word of this `{ query }`, ignoring case and accents, all that are given;
   * locations without a group, or without tags, hide while those are asked for. It replaces the
   * whole filter, so spread `getSnapshot().filter` to change one part. An empty list of tags and a
   * blank query ask for nothing; an empty list of groups, in either form, shows nothing. Hiding the
   * selected location deselects it.
   */
  setFilter(filter: FilterRequest): void;
  fitAll(options?: FitOptions): void;
  /** Shows a box; throws when south is above north or a coordinate is out of range. */
  fitBounds(bounds: Bounds, options?: FitOptions): void;
  setView(center: LatLng, zoom: number): void;
  setRoute(route: Route | undefined): void;
  on<K extends MaplaceEventName>(
    event: K,
    listener: Listener<K, Data>,
    options?: ListenOptions,
  ): Unsubscribe;
  /**
   * Connects a provider and starts loading; returns `detach`, which returns the store to `idle`.
   * `container` is an element or a selector the page's document matches. Throws if already
   * attached, if the selector isn't valid or matches nothing, or if the current state needs a
   * missing capability.
   */
  attach(adapter: Adapter, container: HTMLElement | string): () => void;
  /**
   * Resolves once the provider loaded and the first locations are drawn; rejects on load error.
   * Called before `attach`, or across `detach`, it waits for the next load; after `destroy` it
   * rejects with `destroyed`.
   */
  whenReady(): Promise<void>;
  /**
   * Detaches and drops every listener. Afterwards, calls that change state or add a listener
   * throw `destroyed`; `getSnapshot`, a second `destroy` and unsubscribe functions stay safe.
   */
  destroy(): void;
}
