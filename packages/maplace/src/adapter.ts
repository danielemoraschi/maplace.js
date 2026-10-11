import type { MaplaceError } from "./errors";
import type { Location } from "./location";
import type { PopupOptions, Route, RouteResult, Snapshot, View, Viewport } from "./store";

/** Features that differ between providers. Asking for a missing one is misuse and throws. */
export type Capability = "route" | "cluster" | "circle" | "edit";

/** Where an on-map control sits, in provider-neutral terms. */
export type ControlPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** What changed since the last `apply`; adapters touch only these locations. */
export interface LocationDiff {
  readonly added: readonly Location[];
  readonly updated: readonly Location[];
  readonly removed: readonly string[];
}

/** Drawing state that is not geometry. Unchanged fields keep their reference between calls. */
export interface PresentationState extends Pick<Snapshot, "selectedId" | "hoveredId"> {
  /** Ids hidden by the group filter or `visible: false`. */
  readonly hiddenIds: ReadonlySet<string>;
  readonly cluster: boolean;
  readonly popup: PopupOptions;
}

/** The only way an adapter reports back. Adapters never read or write the store directly. */
export interface AdapterHost {
  select(id: string | undefined): void;
  hover(id: string | undefined): void;
  change(location: Location): void;
  popupOpen(id: string, element: HTMLElement): void;
  popupClose(id: string): void;
  viewport(viewport: Viewport): void;
  route(result: RouteResult | undefined): void;
  /** Runtime failures only; misuse is thrown by the store before it reaches the adapter. */
  error(error: MaplaceError): void;
}

/**
 * A map provider. Google ships with maplace; others implement this contract. One instance
 * drives one map: create a new adapter for every `attach`.
 */
export interface Adapter {
  readonly capabilities: ReadonlySet<Capability>;
  /** Most stops a route may have; checked by the store like a capability. */
  readonly routeStopLimit?: number;
  /** Loads the provider and draws into `container`. Aborting cancels loading. */
  mount(container: HTMLElement, host: AdapterHost, signal: AbortSignal): Promise<void>;
  apply(diff: LocationDiff): void;
  present(state: PresentationState): void;
  setView(view: View): void;
  /** Brings a location into view; the store calls it for `select(id)` unless `pan: false`. */
  reveal(id: string): void;
  setRoute(route: Route | undefined): void;
  /** Places a view on the map; returns a function that removes it. */
  mountControl(node: HTMLElement, position: ControlPosition): () => void;
  destroy(): void;
}
