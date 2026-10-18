import type { MaplaceError } from "./errors";
import type { Geometry, LatLng } from "./geometry";
import type { Location } from "./location";
import type { RouteResult } from "./route";
import type { Viewport } from "./viewport";

/** Payloads of every event `on()` can listen to. */
export interface MaplaceEvents<Data = unknown> {
  /** The selection changed, from the map, a view or `select()`; `id` is undefined when cleared. */
  readonly selectionChange: { readonly id: string | undefined };
  /** The pointer or focus moved onto a location, or off it (`id` undefined). */
  readonly hoverChange: { readonly id: string | undefined };
  /**
   * A single click on the map itself, not on a location; it clears the selection,
   * `selectionChange` following. A double-click is not a click: it fires neither.
   */
  readonly mapClick: { readonly position: LatLng };
  /**
   * While a user drags or reshapes a location: its geometry so far, never written to the store;
   * the last one is where the edit ended, just before `locationChange`.
   */
  readonly locationEdit: { readonly location: Location<Data>; readonly geometry: Geometry };
  /** A drag or edit changed a location's geometry; the store already holds the new value. */
  readonly locationChange: { readonly location: Location<Data>; readonly previous: Location<Data> };
  /** A popup opened and its content is in the DOM; again when an open popup gets new content. */
  readonly popupOpen: { readonly id: string; readonly element: HTMLElement };
  readonly popupClose: { readonly id: string };
  /** The visible area settled after a pan or zoom, the user's too, and once the map first shows. */
  readonly viewportChange: { readonly viewport: Viewport };
  /** A route was computed, or cleared (`result` undefined). */
  readonly routeChange: { readonly result: RouteResult | undefined };
  /** A runtime failure (load, auth, routing). Misuse throws instead. */
  readonly error: { readonly error: MaplaceError };
}

export type MaplaceEventName = keyof MaplaceEvents;

/** Every event's name, as a record so a new event fails to compile until it is listed. */
export const MAPLACE_EVENT_NAMES = {
  selectionChange: true,
  hoverChange: true,
  mapClick: true,
  locationEdit: true,
  locationChange: true,
  popupOpen: true,
  popupClose: true,
  viewportChange: true,
  routeChange: true,
  error: true,
} as const satisfies Record<MaplaceEventName, true>;

/** Every event's name, as a list to go through. */
export const MAPLACE_EVENT_NAME_LIST: readonly MaplaceEventName[] = Object.keys(
  MAPLACE_EVENT_NAMES,
) as MaplaceEventName[];

export type Listener<K extends MaplaceEventName, Data = unknown> = (
  event: MaplaceEvents<Data>[K],
) => void;

export interface ListenOptions {
  /** Aborting removes the listener. */
  readonly signal?: AbortSignal | undefined;
}

/** Removes the listener it was returned for. */
export type Unsubscribe = () => void;
