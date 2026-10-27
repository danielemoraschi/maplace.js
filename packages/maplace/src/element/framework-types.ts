// Build-only: the source's augmentations need both modules in the program; unpreserved, these
// directives stay out of the .d.ts, so a project without the framework never loads it.
/// <reference types="vue" />
/// <reference types="svelte/elements" />
import type { LIST_ATTRIBUTES } from "./element-list";
import type { MaplaceElementEventMap, MaplaceLocationElement, MaplaceMapElement } from "./index";
import type { LOCATION_ATTRIBUTES } from "./location-attributes";
import type { MapSettingAttribute } from "./map-settings-watch";

// The elements in Vue's and Svelte's templates, for vue-tsc and svelte-check: augmentations only,
// naming only maplace's and the DOM's types, so a project without the framework ignores them.

/**
 * What a template gives an attribute: written as text; a bare attribute arrives as `true`, and
 * `null` or `undefined` leaves it out. Not `false`, which both frameworks write as `"false"`,
 * turning a presence attribute (`cluster`) on.
 */
type AttributeValue = string | number | true | null | undefined;

type Attributes<Name extends string, Value = AttributeValue> = { [N in Name]?: Value };

/** Any other attribute (`class`, `id`, `data-*`) passes as it is. */
type OtherAttributes = { [attribute: string]: unknown };

/** Attributes read by a name in no list this entry can import: the map's own, then Google's. */
type NamedMapAttribute =
  | "provider"
  | "cluster"
  | "hold"
  | "loading"
  | "selected-id"
  | "api-key"
  | "map-id"
  | "nonce"
  | "version"
  | "language"
  | "region";

type MapAttribute = (typeof LIST_ATTRIBUTES)[number] | MapSettingAttribute | NamedMapAttribute;

/** The properties a template sets on the map; both frameworks set a defined element's own. */
type MapProperties = Partial<Pick<MaplaceMapElement, "locations" | "route" | "sanitize">>;

type MapTemplate = Attributes<MapAttribute> & MapProperties & OtherAttributes;
/** A location reads `"false"` as false (`listed`, `editable`), so `false` is its off value. */
type LocationTemplate = Attributes<(typeof LOCATION_ATTRIBUTES)[number], AttributeValue | false> &
  OtherAttributes;

/** The map's own events and the DOM's, so a listener of either takes its event. */
type MapEvents = MaplaceElementEventMap & HTMLElementEventMap;
type MapEvent = keyof MapEvents;
/** A listener on the map, its event's `currentTarget` the map; `null` or `undefined` is none. */
type Listener<E extends MapEvent> =
  | ((event: MapEvents[E] & { readonly currentTarget: MaplaceMapElement }) => void)
  | null
  | undefined;

/** Vue's listener props: `@maplace-selectionchange` is `onMaplaceSelectionchange`, `@click` `onClick`. */
type VueListeners = {
  [E in MapEvent as E extends `maplace-${infer Name}`
    ? `onMaplace${Capitalize<Name>}`
    : `on${Capitalize<E>}`]?: Listener<E>;
};
/** Svelte's: `onmaplace-selectionchange` (Svelte 5) and `on:maplace-selectionchange` (Svelte 4). */
type SvelteListeners = { [E in MapEvent as `on${E}` | `on:${E}`]?: Listener<E> };

/** A Vue component whose instance, a template ref's value, is the element; `$props` is vue-tsc's. */
type VueElement<Instance, Props> = new () => Instance & { $props: Props };

declare module "vue" {
  interface GlobalComponents {
    "maplace-map": VueElement<MaplaceMapElement, MapTemplate & VueListeners>;
    "maplace-location": VueElement<MaplaceLocationElement, LocationTemplate>;
  }
}

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "maplace-map": MapTemplate & SvelteListeners;
    "maplace-location": LocationTemplate;
  }
}
