import type { Adapter, ControlPosition } from "../adapter";
import type { MaplaceEvents } from "../events";
import type { Location } from "../location";
import type { Route } from "../route";
import type { Maplace } from "../store";

/** Where the element puts its list: on the map, or outside it in the page. */
export type ListPosition = ControlPosition | "outside";

/** Builds an adapter from the element's own attributes (e.g. `api-key`, `map-id`). */
export type ProviderFactory = (element: MaplaceMapElement) => Adapter;

/**
 * Registers a provider under a name for `<maplace-map provider="…">`.
 * Also defines the elements if needed; a second maplace copy on the page throws `already-defined`.
 */
export declare function defineProvider(name: string, factory: ProviderFactory): void;

/**
 * `<maplace-map>`: a map plus an optional list, from child `<maplace-location>` elements,
 * an inline `<script type="application/json">` child, or the `locations` property.
 *
 * Attributes:
 * - `provider`: registered provider name; defaults to the only one registered.
 * - `list`: present = list view; `list="select"` = native select; absent = no list.
 * - `list-position`: a `ListPosition`.
 * - `fit-all-label`: label of a first list entry that fits all locations.
 * - `selected-id`: the initial selection, like `<input value>`; later changes go through `maplace`.
 * - `cluster`: cluster markers (a CDN page needs the cluster build).
 * - `hold`: stay idle, with no provider request, until `release()`.
 * - provider attributes, such as `api-key` and `map-id` for Google.
 *
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

/**
 * `<maplace-location location-id="…" lat lng title type group radius>`: `lat`/`lng` are a
 * marker's position or a circle's centre; a `<template>` child is trusted popup content.
 */
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
