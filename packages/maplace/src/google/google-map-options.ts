import { CONTROL_POSITIONS, type ControlPosition } from "../adapter";
import type { ListViewOptions } from "../index";
import type { MaplaceOptions } from "../options";
import { child, reject, root } from "../validate/fail";
import { checkObject, checkOneOf, members, optional } from "../validate/values";
import type { GoogleAdapterOptions } from "./options";

/** maplace's list on the map, in a corner, or in an element of the page. */
export interface GoogleMapList<Data = unknown> extends ListViewOptions<Data> {
  /** The corner of the map the list sits in; default `top-right`, where 0.2 put its controls. */
  readonly position?: ControlPosition | undefined;
  /** An element or a selector to put the list in instead, beside the map (0.2's `controls_div`). */
  readonly container?: HTMLElement | string | undefined;
}

/**
 * A store's options and a Google adapter's, and the list to show. The page's own `map` is left
 * out: a page drawing on its own map has the adapter in hand, so it takes the parts.
 */
export interface GoogleMapOptions<Data = unknown>
  extends MaplaceOptions<Data>,
    Omit<GoogleAdapterOptions, "map"> {
  /** maplace's list: `true` for the default one on the map, or its options and place. */
  readonly list?: true | GoogleMapList<Data> | undefined;
}

/** The options `createGoogleMap` hands to `createGoogleAdapter`; the rest go to the store. */
type AdapterKey = "mapId" | "colorScheme" | "mapOptions";

/** `createGoogleMap`'s options, split between the parts it hands them to. */
export interface SplitOptions<Data> {
  readonly storeOptions: MaplaceOptions<Data>;
  readonly adapterOptions: Pick<GoogleAdapterOptions, AdapterKey>;
  /** The list asked for, `true` being the default one: no options, top-right. */
  readonly list: GoogleMapList<Data> | undefined;
}

const OPTIONS = child(root("createGoogleMap"), "options");
const LIST = child(OPTIONS, "list");
/** Where a list in the page goes, named when its selector matches nothing. */
export const LIST_CONTAINER = child(LIST, "container");
const CORNERS = members(CONTROL_POSITIONS);
const checkCorner = optional((value, field) => checkOneOf(value, field, CORNERS));

/**
 * What `createGoogleMap` itself takes, before anything is made: the store's, the adapter's and
 * the list view's options are checked by the parts it hands them to.
 */
export function checkGoogleMapOptions<Data = unknown>(
  options: unknown,
): asserts options is GoogleMapOptions<Data> {
  checkObject(options, OPTIONS, "an object");
  if ("map" in options) {
    reject(child(OPTIONS, "map"), "is for createGoogleAdapter: attach it to a store of your own");
  }
  checkList(options.list, LIST);
}

const checkList = optional((list, field) => {
  if (list === true) return;
  checkObject(list, field, "true or an object");
  checkCorner(list.position, child(field, "position"));
  if (list.position !== undefined && list.container !== undefined) {
    reject(LIST_CONTAINER, "is for a list in the page: leave out position");
  }
});

/** The store's options, the adapter's and the list, each part refusing keys it doesn't know. */
export function splitGoogleMapOptions<Data>(options: GoogleMapOptions<Data>): SplitOptions<Data> {
  const { mapId, colorScheme, mapOptions, list, ...storeOptions } = options;
  const adapterOptions = { mapId, colorScheme, mapOptions };
  return { storeOptions, adapterOptions, list: list === true ? {} : list };
}

/** The list view's own options: where the list goes is the shortcut's to place. */
export function listViewOptionsOf<Data>(list: GoogleMapList<Data>): ListViewOptions<Data> {
  const { position: _position, container: _container, ...viewOptions } = list;
  return viewOptions;
}
