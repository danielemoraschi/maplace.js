import type { Adapter } from "../adapter";
import type { MaplaceEvents } from "../events";
import type { Location } from "../location";
import type { Maplace, Route } from "../store";

/** Builds an adapter from the element's own attributes (e.g. `api-key`, `map-id`). */
export type ProviderFactory = (element: MaplaceMapElement) => Adapter;

/**
 * Registers a provider under a name for `<maplace-map provider="…">`.
 * Also defines the elements if needed; a second maplace copy on the page fails loudly.
 */
export declare function defineProvider(name: string, factory: ProviderFactory): void;

/**
 * `<maplace-map>`: a map plus an optional list, from child `<maplace-location>` elements,
 * an inline `<script type="application/json">` child, or the `locations` property.
 *
 * Attributes: `provider`, `list` (`list` | `select`; absent = no list), `list-position`
 * (`top-left` | `top-right` | `bottom-left` | `bottom-right` | `outside`), `hold` (stay idle,
 * no provider request, until `release()`), plus provider attributes such as `api-key`.
 * Misuse sets `loadState` to `error` and dispatches `maplace-error`; it is never silent.
 */
export interface MaplaceMapElement extends HTMLElement {
  locations: readonly Location[];
  route: Route | undefined;
  /** The underlying store, for anything the attributes don't cover. */
  readonly maplace: Maplace;
  /** Starts loading when the element has `hold`. */
  release(): void;
}

/** `<maplace-location location-id="…" lat lng title type group>`; a `<template>` child is trusted popup content. */
export interface MaplaceLocationElement extends HTMLElement {
  readonly location: Location;
}

/** DOM events dispatched by `<maplace-map>`, named `maplace-<event>`. */
export type MaplaceElementEventMap = {
  readonly [K in keyof MaplaceEvents as `maplace-${Lowercase<K & string>}`]: CustomEvent<
    MaplaceEvents[K]
  >;
};

declare global {
  interface HTMLElementTagNameMap {
    "maplace-map": MaplaceMapElement;
    "maplace-location": MaplaceLocationElement;
  }
}
