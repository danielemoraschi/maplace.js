import type { Adapter, ControlPosition } from "../adapter";
import type { MaplaceEvents } from "../events";
import type { ListView, ListViewOptions } from "../list-view";
import type { Location } from "../location";
import type { Route } from "../route";
import type { LoadState, Maplace } from "../store";
import { defineElements } from "./define";

/** Where the element puts its list: on the map, or outside it in the page. */
export type ListPosition = ControlPosition | "outside";

/** Builds an adapter from the element's own attributes (e.g. `api-key`, `map-id`). */
export type ProviderFactory = (element: MaplaceMapElement) => Adapter;

export { defineProvider } from "./define";

/** The list options `<maplace-map>` reads from its attributes and gives every list view. */
export type ElementListOptions = Pick<ListViewOptions, "fitAllLabel" | "heading">;

/** What `<maplace-map>` gives a list view besides its store. */
export interface ListViewSetup {
  /** The list options from the attributes (`fit-all-label`, `list-heading`). */
  readonly options: ElementListOptions;
  /**
   * The locations maplace's own lists show now, in data order (those shown under the filter).
   * Read it again on each store change, so a view of yours lists what they list.
   */
  listed(): readonly Location[];
}

/** Builds the list view `<maplace-map list="<name>">` names, from the element's store and setup. */
export type ListViewFactory = (maplace: Maplace, setup: ListViewSetup) => ListView;

export { defineListView } from "./list-views";

/**
 * `<maplace-map>`: a map plus an optional list. Its locations come from the `locations` property
 * once set; else from one inline `<script type="application/json">` child, or from
 * `<maplace-location>` children (both is misuse). Children and the script are watched.
 *
 * Attributes:
 * - `provider`: registered provider name; defaults to the only one registered. A change opens
 *   the map again on it.
 * - `color-scheme`, `map-options`: the map's colour scheme and the provider's map options
 *   (Google: `light`, `dark`, `follow-system`; a JSON object of its map options). A change opens
 *   the map again where it was.
 * - `list`: present = list view; `list="select"` = native select; `list="<name>"` = a view given
 *   to `defineListView`; absent = no list.
 * - `list-position`: a `ListPosition`; `outside` (beside the map) by default.
 * - `fit-all-label`: label of a first list entry that fits all locations.
 * - `list-heading`: a heading above the list, beside the map or on it; the list's accessible name.
 *   (`list`, `list-position`, `fit-all-label` and `list-heading` are live: the list is built
 *   again.)
 * - `selected-id`: the initial selection, like `<input value>`; later changes go through `maplace`.
 * - `cluster`: cluster markers (a CDN page needs the cluster build); can't change afterwards.
 * - `hold`: stay idle, with no provider request, until `release()`.
 * - provider attributes, such as `api-key` and `map-id` for Google, read when the map opens.
 *
 * The store is created when the element first connects (or `maplace`, `locations` or `route` is
 * first read), from `cluster`, `sanitize`, `selected-id` and the locations, and lives as long as
 * the element: disconnected, the map closes and the store goes back to `idle`, keeping its
 * locations, selection and listeners; connected again, a new map opens. A move within one task
 * keeps the map. A map waits for the document to parse its children before it opens, whether
 * parsed or created by a script, so its first view and `selected-id` see them all.
 *
 * Misuse sets `loadState` to `error` and dispatches `maplace-error`; it is never silent. It stands
 * until corrected: bad locations or route keep the previous ones until valid ones are given, and
 * a `selected-id` the locations don't have is selected once they do.
 */
export interface MaplaceMapElement extends HTMLElement {
  locations: readonly Location[];
  route: Route | undefined;
  /**
   * Makes `html` in the locations safe to render, as the store's `sanitize` option (a
   * `<template>` child needs none: it is the page's own markup). Read when the store is created,
   * so set it before the map opens; set later, it is misuse.
   */
  sanitize: ((html: string) => string) | undefined;
  /** The underlying store, for anything the attributes don't cover. */
  readonly maplace: Maplace;
  /**
   * `error` while a misuse stands, else the store's. Shown as the custom state
   * `:state(idle | loading | ready | error)`, so CSS can style e.g. a consent placeholder.
   */
  readonly loadState: LoadState;
  /** Starts loading when the element has `hold`. */
  release(): void;
}

/**
 * `<maplace-location location-id="…" lat lng title type group radius icon zoom listed shape-style
 * selected-style hovered-style>`: `lat`/`lng` are a marker's position or a circle's centre,
 * `icon` a marker's image URL, `zoom` the zoom selecting it shows it at, `listed="false"` keeps
 * it out of the list (on the map still), and the three style attributes a shape's `style`,
 * `selectedStyle` and `hoveredStyle` as JSON; a `<template>` child is trusted popup content, and
 * a `<template data-icon>` child the marker, in place of `icon`.
 */
export interface MaplaceLocationElement extends HTMLElement {
  readonly location: Location;
}

/** DOM events dispatched by `<maplace-map>`, named `maplace-<event>` in lower case; they bubble. */
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

defineElements();
