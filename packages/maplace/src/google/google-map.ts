import type { Adapter } from "../adapter";
import { createListView, createMaplace, type Maplace } from "../index";
import { containerOf } from "../validate/attach";
import { createGoogleAdapter } from "./create-adapter";
import {
  checkGoogleMapOptions,
  type GoogleMapList,
  type GoogleMapOptions,
  LIST_CONTAINER,
  listViewOptionsOf,
  splitGoogleMapOptions,
} from "./google-map-options";
import type { GoogleAdapterOptions } from "./options";

export type { GoogleMapList, GoogleMapOptions } from "./google-map-options";

type AdapterFactory = (options: GoogleAdapterOptions) => Adapter;

/** Where 0.2 put its controls. */
const DEFAULT_CORNER = "top-right";

/**
 * A store on a Google map in one call, as 0.2's `new Maplace(options).Load()`: attached to
 * `container` (an element or a selector), with its list when `list` asks for one. `destroy()`
 * takes the map and its list down.
 */
export function createGoogleMap<Data = unknown>(
  container: HTMLElement | string,
  options: GoogleMapOptions<Data>,
): Maplace<Data> {
  return googleMapWith(createGoogleAdapter, container, options);
}

/**
 * `createGoogleMap` on the adapter `createAdapter` makes. Exported for the example runners, which
 * run the examples on the fake adapter; never from the entry.
 */
export function googleMapWith<Data>(
  createAdapter: AdapterFactory,
  container: HTMLElement | string,
  options: GoogleMapOptions<Data>,
): Maplace<Data> {
  checkGoogleMapOptions<Data>(options);
  const { storeOptions, adapterOptions, list } = splitGoogleMapOptions(options);
  const maplace = createMaplace<Data>(storeOptions);
  const removeList = attachedOrDestroyed(maplace, () => {
    const adapter = createAdapter(adapterOptions);
    maplace.attach(adapter, container);
    return list === undefined ? undefined : placeList(maplace, adapter, list);
  });
  return { ...maplace, destroy: () => destroyWithList(maplace, removeList) };
}

/** Runs `attachToMap`; if it throws, destroys the store and rethrows, leaving nothing behind. */
function attachedOrDestroyed<T>(maplace: Maplace<unknown>, attachToMap: () => T): T {
  try {
    return attachToMap();
  } catch (error) {
    maplace.destroy();
    throw error;
  }
}

/** A list view on the map in its corner, or in the page's element; returns what removes it. */
function placeList<Data>(
  maplace: Maplace<Data>,
  adapter: Adapter,
  list: GoogleMapList<Data>,
): () => void {
  const view = createListView(maplace, listViewOptionsOf(list));
  if (list.container === undefined) {
    adapter.mountControl(view.element, list.position ?? DEFAULT_CORNER);
  } else {
    containerOf(list.container, LIST_CONTAINER).append(view.element);
  }
  return view.destroy;
}

/** The list comes down before the store: a view whose store goes first reports it as misuse. */
function destroyWithList(maplace: Maplace<unknown>, removeList: (() => void) | undefined): void {
  removeList?.();
  maplace.destroy();
}
