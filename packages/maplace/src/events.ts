import type { MaplaceError } from "./errors";
import type { Location } from "./location";
import type { RouteResult, Viewport } from "./store";

/** Payloads of every event `on()` can listen to. */
export interface MaplaceEvents {
  /** Selection changed, from the map, a view or `select()`. `id` is undefined when cleared. */
  readonly select: { readonly id: string | undefined };
  /** Pointer or focus moved onto (or off) a location. */
  readonly hover: { readonly id: string | undefined };
  /** A drag or edit changed a location's geometry; the store already holds the new value. */
  readonly change: { readonly location: Location; readonly previous: Location };
  /** A popup opened and its content is in the DOM. */
  readonly popupOpen: { readonly id: string; readonly element: HTMLElement };
  readonly popupClose: { readonly id: string };
  /** The visible area settled after a pan or zoom. */
  readonly viewport: { readonly viewport: Viewport };
  /** A route was computed, or cleared (`result` undefined). */
  readonly route: { readonly result: RouteResult | undefined };
  /** A runtime failure (load, auth, routing). Misuse throws instead. */
  readonly error: { readonly error: MaplaceError };
}

export type MaplaceEventName = keyof MaplaceEvents;

export type Listener<K extends MaplaceEventName> = (event: MaplaceEvents[K]) => void;

export interface ListenOptions {
  /** Aborting removes the listener. */
  readonly signal?: AbortSignal;
}

/** Removes the listener it was returned for. */
export type Unsubscribe = () => void;
