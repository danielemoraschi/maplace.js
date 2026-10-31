import { type Adapter, type ControlPosition, MY_LOCATION_CORNER } from "../adapter";
import { adoptCarriedStyles } from "../adopted-styles";
import {
  createListView,
  createMaplace,
  createMyLocationControl,
  type Maplace,
  type MyLocationControl,
} from "../index";
import { containerOf } from "../validate/attach";
import {
  listAskedFor,
  listContainerField,
  listViewOptionsOf,
  type MapList,
  type MapMyLocation,
  type ShortcutNames,
  type SplitOptions,
} from "./shortcut-options";

/** Where 0.2 put its controls. */
const DEFAULT_CORNER = "top-right";

/** A store on a provider's map in one call: what the shortcut was given, already split. */
export interface MapToMake<Data, AdapterOptions> {
  readonly names: ShortcutNames;
  readonly container: HTMLElement | string;
  readonly split: SplitOptions<Data, AdapterOptions>;
  readonly createAdapter: (options: AdapterOptions) => Adapter;
}

/**
 * A store on a map in one call, as 0.2's `new Maplace(options).Load()`: attached to `container`
 * (an element or a selector), with its list and its "My location" control when asked for.
 * `destroy()` takes them all down.
 */
export function createShortcutMap<Data, AdapterOptions>({
  names,
  container,
  split: { storeOptions, adapterOptions, list: listAsked, myLocation },
  createAdapter,
}: MapToMake<Data, AdapterOptions>): Maplace<Data> {
  const list = listAskedFor(listAsked);
  const maplace = createMaplace<Data>(storeOptions);
  const removeViews = attachedOrDestroyed(maplace, () => {
    // Made first: a refused label then throws with no provider asked and no list in the page.
    const control = myLocation && controlOf(maplace, myLocation);
    const adapter = createAdapter(adapterOptions);
    maplace.attach(adapter, container);
    const removeList = list && placeList(maplace, adapter, list, names);
    if (control) adapter.mountControl(control.element, control.corner);
    return () => {
      control?.destroy();
      removeList?.();
    };
  });
  return { ...maplace, destroy: () => destroyWithViews(maplace, removeViews) };
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
  list: MapList<Data>,
  names: ShortcutNames,
): () => void {
  const view = createListView(maplace, listViewOptionsOf(list));
  if (list.container === undefined) {
    adapter.mountControl(view.element, list.position ?? DEFAULT_CORNER);
  } else {
    const beside = containerOf(list.container, listContainerField(names));
    beside.append(view.element);
    adoptCarriedStyles(beside.ownerDocument);
  }
  return view.destroy;
}

/** The "My location" control asked for, and the corner it goes in. */
function controlOf<Data>(
  maplace: Maplace<Data>,
  asked: true | MapMyLocation,
): MyLocationControl & { readonly corner: ControlPosition } {
  const { position = MY_LOCATION_CORNER, ...words }: MapMyLocation = asked === true ? {} : asked;
  return { ...createMyLocationControl(maplace, words), corner: position };
}

/** The views come down before the store: a view whose store goes first reports it as misuse. */
function destroyWithViews(maplace: Maplace<unknown>, removeViews: () => void): void {
  removeViews();
  maplace.destroy();
}
