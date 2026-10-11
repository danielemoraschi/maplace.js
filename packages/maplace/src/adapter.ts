import type { Drawable } from "./drawable";
import type { MaplaceError } from "./errors";
import type { Geometry } from "./geometry";
import type { ResolvedPopupOptions } from "./popup";
import type { Route, RouteResult } from "./route";
import type { View, Viewport } from "./viewport";

/** Features that differ between providers. Asking for a missing one is misuse and throws. */
export type Capability = "route" | "cluster" | "circle" | "edit";

/** Where an on-map control sits, in provider-neutral terms. */
export type ControlPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** What changed since the last `apply`; adapters touch only these locations. */
export interface LocationDiff {
  readonly added: readonly Drawable[];
  readonly updated: readonly Drawable[];
  readonly removed: readonly string[];
}

/** Selection, hover and visibility. Unchanged fields keep their reference between calls. */
export interface PresentationState {
  readonly selectedId: string | undefined;
  readonly hoveredId: string | undefined;
  /** Ids hidden by the group filter or `visible: false`. */
  readonly hiddenIds: ReadonlySet<string>;
}

/** The only way an adapter reports back. Adapters never read or write the store directly. */
export interface AdapterHost {
  reportSelect(id: string | undefined): void;
  reportHover(id: string | undefined): void;
  /** A drag or edit moved or reshaped a location; `geometry.type` is the location's own. */
  reportChange(id: string, geometry: Geometry): void;
  reportPopupOpen(id: string, element: HTMLElement): void;
  reportPopupClose(id: string): void;
  reportViewport(viewport: Viewport): void;
  reportRoute(result: RouteResult | undefined): void;
  /** Runtime failures only; misuse is thrown by the store before it reaches the adapter. */
  reportError(error: MaplaceError): void;
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
  /** Loads the provider and draws into the container. */
  mount(context: MountContext): Promise<void>;
  apply(diff: LocationDiff): void;
  present(state: PresentationState): void;
  /** Moves the camera; `select` sends a `location` view unless `pan: false`. */
  setView(view: View): void;
  setRoute(route: Route | undefined): void;
  /** Places a view on the map; returns a function that removes it. */
  mountControl(node: HTMLElement, position: ControlPosition): () => void;
  destroy(): void;
}
