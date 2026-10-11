import type { Adapter } from "./adapter";
import type { Listener, ListenOptions, MaplaceEventName, Unsubscribe } from "./events";
import type { LatLng, Location } from "./location";
import type { PopupOptions } from "./popup";
import type { Route, RouteResult } from "./route";
import type { View, Viewport } from "./viewport";

/** `idle` until attached (or while held for consent), then `loading`, then `ready` or `error`. */
export type LoadState = "idle" | "loading" | "ready" | "error";

export interface MaplaceOptions {
  readonly locations?: readonly Location[];
  /** Required before any location uses `html`; return safe HTML. */
  readonly sanitize?: (html: string) => string;
  readonly popup?: PopupOptions;
  /** Cluster markers; needs the `cluster` capability. */
  readonly cluster?: boolean;
  /** Initial view. Default: fit all locations with 40px padding. */
  readonly view?: View;
}

/**
 * Immutable state: a new object on every change, while unchanged parts (e.g. `locations`) keep
 * their reference, so subscribers can compare slices cheaply.
 */
export interface Snapshot {
  readonly locations: readonly Location[];
  readonly selectedId: string | undefined;
  readonly hoveredId: string | undefined;
  /** Visible groups; undefined shows every group. */
  readonly filter: readonly string[] | undefined;
  /** Last requested view. */
  readonly view: View;
  /** Last reported visible area; undefined until the map is ready. */
  readonly viewport: Viewport | undefined;
  readonly route: Route | undefined;
  readonly routeResult: RouteResult | undefined;
  readonly loadState: LoadState;
}

export interface SelectOptions {
  /** Pan the map to the selected location. Default true. */
  readonly pan?: boolean;
}

export interface FitOptions {
  /** Padding in pixels. Default 40. */
  readonly padding?: number;
}

/** A headless map state: locations, selection, filter, view and route. */
export interface Maplace {
  subscribe(onChange: () => void): Unsubscribe;
  getSnapshot(): Snapshot;
  /**
   * Replaces all locations; only the differences reach the map. A location counts as updated
   * when its object changes, so reuse unchanged objects. Throws on invalid input.
   */
  setLocations(locations: readonly Location[]): void;
  select(id: string | undefined, options?: SelectOptions): void;
  setFilter(groups: readonly string[] | undefined): void;
  fitAll(options?: FitOptions): void;
  setView(center: LatLng, zoom: number): void;
  setRoute(route: Route | undefined): void;
  on<K extends MaplaceEventName>(
    event: K,
    listener: Listener<K>,
    options?: ListenOptions,
  ): Unsubscribe;
  /**
   * Connects a provider and starts loading; returns `detach`, which returns the store to `idle`.
   * Throws if already attached or if the current state needs a missing capability.
   */
  attach(adapter: Adapter, container: HTMLElement): () => void;
  /** Resolves when the map is ready; rejects with the load error. */
  whenReady(): Promise<void>;
  destroy(): void;
}

export declare function createMaplace(options?: MaplaceOptions): Maplace;
