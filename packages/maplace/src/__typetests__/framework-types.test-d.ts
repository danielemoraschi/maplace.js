// Compile-time checks of the elements in Vue's and Svelte's templates (element/framework-types.ts): each @ts-expect-error must stay an error.
import type { Location, Route } from "maplace";
import type {
  MaplaceElementEventMap,
  MaplaceLocationElement,
  MaplaceMapElement,
} from "maplace/element";
import type { SvelteHTMLElements } from "svelte/elements";
import { expectTypeOf } from "vitest";
import type { GlobalComponents } from "vue";
import type { SCRIPT_ATTRIBUTES } from "../element/google-attributes";
import type { GOOGLE_MAP_SETTINGS } from "../element/google-map-attributes";
import type { LOCATION_ATTRIBUTES } from "../element/location-attributes";
import type { MAPLIBRE_MAP_SETTINGS } from "../element/maplibre-attributes";
import type { API_LISTS } from "./api-lists";

/** The keys `T` names, without what only its index signature allows. */
type NamedKeys<T> = keyof { [K in keyof T as string extends K ? never : K]: T[K] };

type VueMap = InstanceType<GlobalComponents["maplace-map"]>["$props"];
type VueLocation = InstanceType<GlobalComponents["maplace-location"]>["$props"];
type SvelteMap = SvelteHTMLElements["maplace-map"];
type SvelteLocation = SvelteHTMLElements["maplace-location"];

type StoreEvent = (typeof API_LISTS.events)[number];
/** A store event as the element names it: `maplace-` and the name in lower case (RFC §3). */
type ElementEvent = `maplace-${Lowercase<StoreEvent>}`;
type ProviderAttribute =
  | (typeof SCRIPT_ATTRIBUTES)[keyof typeof SCRIPT_ATTRIBUTES]
  | (typeof GOOGLE_MAP_SETTINGS)[number]
  | (typeof MAPLIBRE_MAP_SETTINGS)[number];
/** An event as a listener on the map gets it. */
type OnMap<T extends Event> = T & { readonly currentTarget: MaplaceMapElement };
type SelectionListener = (event: OnMap<MaplaceElementEventMap["maplace-selectionchange"]>) => void;

// Every attribute in a built-in provider's lists is typed on the map.
expectTypeOf<ProviderAttribute>().toExtend<NamedKeys<VueMap>>();
expectTypeOf<ProviderAttribute>().toExtend<NamedKeys<SvelteMap>>();

// The map's own attributes read by name are typed on the map.
expectTypeOf<"hold" | "loading">().toExtend<NamedKeys<VueMap>>();
expectTypeOf<"hold" | "loading">().toExtend<NamedKeys<SvelteMap>>();

// A location takes exactly its attributes, and no listener.
expectTypeOf<NamedKeys<VueLocation>>().toEqualTypeOf<(typeof LOCATION_ATTRIBUTES)[number]>();
expectTypeOf<NamedKeys<SvelteLocation>>().toEqualTypeOf<(typeof LOCATION_ATTRIBUTES)[number]>();

// A Vue template ref is the element itself.
expectTypeOf<InstanceType<GlobalComponents["maplace-map"]>>().toExtend<MaplaceMapElement>();
expectTypeOf<
  InstanceType<GlobalComponents["maplace-location"]>
>().toExtend<MaplaceLocationElement>();

// Every element event has a listener in each syntax, and nothing else is one.
expectTypeOf<
  Extract<NamedKeys<VueMap>, `onMaplace${string}`>
>().toEqualTypeOf<`onMaplace${Capitalize<Lowercase<StoreEvent>>}`>();
expectTypeOf<
  Extract<NamedKeys<SvelteMap>, `onmaplace-${string}` | `on:maplace-${string}`>
>().toEqualTypeOf<`on${ElementEvent}` | `on:${ElementEvent}`>();

// A DOM event's listener takes its event, as on any element.
type KeyListener = ((event: OnMap<KeyboardEvent>) => void) | null | undefined;
expectTypeOf<VueMap["onKeydown"]>().toEqualTypeOf<KeyListener>();
expectTypeOf<SvelteMap["onkeydown"]>().toEqualTypeOf<KeyListener>();
expectTypeOf<SvelteMap["on:keydown"]>().toEqualTypeOf<KeyListener>();

// A listener takes the element's own event.
expectTypeOf<VueMap["onMaplaceSelectionchange"]>().toEqualTypeOf<
  SelectionListener | null | undefined
>();
expectTypeOf<SvelteMap["onmaplace-selectionchange"]>().toEqualTypeOf<
  SelectionListener | null | undefined
>();
expectTypeOf<SvelteMap["on:maplace-selectionchange"]>().toEqualTypeOf<
  SelectionListener | null | undefined
>();

// The properties a template sets are the element's own.
expectTypeOf<VueMap["locations"]>().toEqualTypeOf<readonly Location[] | undefined>();
expectTypeOf<VueMap["route"]>().toEqualTypeOf<Route | undefined>();
expectTypeOf<SvelteMap["sanitize"]>().toEqualTypeOf<((html: string) => string) | undefined>();

// A template as a reader writes it compiles.
const locations: Location[] = [{ id: "rome", lat: 41.9, lng: 12.5 }];
export const vueMap: VueMap = {
  list: true,
  "map-options": '{"maxZoom": 12}',
  class: "map",
  "url-state": "place",
  locations,
  onMaplaceSelectionchange: (event) => event.detail.id,
  onKeydown: (event) => event.currentTarget.release(),
};
export const svelteMap: SvelteMap = {
  hold: true,
  loading: "lazy",
  "url-state": true,
  id: "m",
  "data-x": "1",
  locations,
  "onmaplace-error": (event) => event.detail.error,
};
const debug = false as boolean;
// As in Svelte's own attributes, `null` or `undefined` leaves an attribute or a listener out.
export const leftOut: SvelteMap = {
  cluster: debug ? "" : null,
  "selected-id": undefined,
  "onmaplace-error": debug ? (event) => event.detail.error : null,
};

// @ts-expect-error a location's lat is a number, as in the store
export const badLocations: SvelteMap = { locations: [{ id: "a", lat: "1", lng: 2 }] };

// @ts-expect-error false is written as "false", which turns a presence attribute such as cluster on
export const falseCluster: VueMap = { cluster: false };

// @ts-expect-error false is written as "false", which names a parameter "false"
export const falseUrlState: SvelteMap = { "url-state": false };

// A location reads "false" as false, so false is its off value.
export const unlisted: SvelteLocation = { listed: false, editable: false };
