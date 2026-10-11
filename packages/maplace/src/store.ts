import type { Adapter } from "./adapter";
import type { Listener, ListenOptions, MaplaceEventName, Unsubscribe } from "./events";
import type { LatLng, Location } from "./location";
import type { PopupOptions } from "./popup";
import type { Route, RouteResult } from "./route";
import type { ShapeStyle } from "./style";
import type { View, Viewport } from "./viewport";

/** `idle` until attached (or while held for consent), then `loading`, then `ready` or `error`. */
export type LoadState = "idle" | "loading" | "ready" | "error";

/**
 * The initial view is `view` when given, else the `selectedId` location, else all locations
 * fitted with 40px padding.
 */
export interface MaplaceOptions<Data = unknown> {
  readonly locations?: readonly Location<Data>[] | undefined;
  /** Initially selected location; an unknown id throws. */
  readonly selectedId?: string | undefined;
  /** Required before any location uses `html`; return safe HTML. */
  readonly sanitize?: ((html: string) => string) | undefined;
  readonly popup?: PopupOptions | undefined;
  /** Default style of circles, polylines and polygons; a location's `style` overrides it. */
  readonly style?: ShapeStyle | undefined;
  /** Cluster markers; needs the `cluster` capability. */
  readonly cluster?: boolean | undefined;
  readonly view?: View | undefined;
}

/**
 * Immutable state: a new object on every change, while unchanged parts (e.g. `locations`) keep
 * their reference, so subscribers can compare slices cheaply.
 */
export interface Snapshot<Data = unknown> {
  readonly locations: readonly Location<Data>[];
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

/** Selecting pans to the location by default; `zoom` sets the zoom while panning. */
export type SelectOptions =
  | { readonly pan?: true | undefined; readonly zoom?: number | undefined }
  | { readonly pan: false };

export interface FitOptions {
  /** Padding in pixels. Default 40. */
  readonly padding?: number | undefined;
}

/** A headless map state: locations, selection, filter, view and route. */
export interface Maplace<Data = unknown> {
  subscribe(onChange: () => void): Unsubscribe;
  getSnapshot(): Snapshot<Data>;
  /**
   * Replaces all locations; only the differences reach the map. A location counts as updated
   * when its object changes, so reuse unchanged objects. Throws on invalid input.
   */
  setLocations(locations: readonly Location<Data>[]): void;
  /** Selects a location, or clears the selection (closing its popup) with `undefined`. */
  select(id: string | undefined, options?: SelectOptions): void;
  setFilter(groups: readonly string[] | undefined): void;
  fitAll(options?: FitOptions): void;
  setView(center: LatLng, zoom: number): void;
  setRoute(route: Route | undefined): void;
  on<K extends MaplaceEventName>(
    event: K,
    listener: Listener<K, Data>,
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

export declare function createMaplace<Data = unknown>(
  options?: MaplaceOptions<Data>,
): Maplace<Data>;
