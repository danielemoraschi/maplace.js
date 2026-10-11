import type { Adapter } from "./adapter";
import type { Listener, ListenOptions, MaplaceEventName, Unsubscribe } from "./events";
import type { LatLng, Location } from "./location";

/** The visible area, as the provider reports it. */
export interface Viewport {
  readonly center: LatLng;
  readonly zoom: number;
  readonly bounds: {
    readonly south: number;
    readonly west: number;
    readonly north: number;
    readonly east: number;
  };
}

/** What the map should show; adapters turn intents into camera moves. */
export type ViewportIntent =
  | { readonly kind: "fit-all"; readonly padding: number }
  | { readonly kind: "view"; readonly center: LatLng; readonly zoom: number }
  | { readonly kind: "location"; readonly id: string };

export type TravelMode = "driving" | "walking" | "bicycling" | "transit";

/** One route through your own locations, in order. Needs the `route` capability. */
export interface Route {
  /** Location ids: at least 2, at most 27 (origin, 25 intermediates, destination). */
  readonly stops: readonly string[];
  readonly travelMode?: TravelMode;
}

export interface RouteLeg {
  readonly from: string;
  readonly to: string;
  readonly distanceMeters: number;
  readonly durationSeconds: number;
}

/** A computed route, in neutral units; never a provider object. */
export interface RouteResult {
  readonly legs: readonly RouteLeg[];
  readonly distanceMeters: number;
  readonly durationSeconds: number;
  readonly path: readonly LatLng[];
}

/** `idle` until attached (or while held for consent), then `loading`, then `ready` or `error`. */
export type LoadState = "idle" | "loading" | "ready" | "error";

export interface PopupOptions {
  readonly maxWidth?: number;
  /** Pixel offset from the anchor, `[x, y]`. */
  readonly offset?: readonly [number, number];
  /** Default `click`. */
  readonly openOn?: "click" | "hover";
}

export interface MaplaceOptions {
  readonly locations?: readonly Location[];
  /** Required before any location uses `html`; return safe HTML. */
  readonly sanitize?: (html: string) => string;
  readonly popup?: PopupOptions;
  /** Cluster markers; needs the `cluster` capability. */
  readonly cluster?: boolean;
  /** Initial view. Default: fit all locations with 40px padding. */
  readonly view?: ViewportIntent;
}

/** Immutable state; a new object on every change, so it can be compared by reference. */
export interface Snapshot {
  readonly locations: readonly Location[];
  readonly selectedId: string | undefined;
  readonly hoveredId: string | undefined;
  /** Visible groups; undefined shows every group. */
  readonly filter: readonly string[] | undefined;
  /** Last requested view. */
  readonly view: ViewportIntent;
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
  /** Replaces all locations; only the differences reach the map. Throws on invalid input. */
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
  /** Connects a provider and starts loading. Throws if the current state needs a missing capability. */
  attach(adapter: Adapter, container: HTMLElement): void;
  /** Resolves when the map is ready; rejects with the load error. */
  ready(): Promise<void>;
  destroy(): void;
}

export declare function createMaplace(options?: MaplaceOptions): Maplace;
