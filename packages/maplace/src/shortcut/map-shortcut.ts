import type { Adapter } from "../adapter";
import { createListView, createMaplace, type Maplace } from "../index";
import { containerOf } from "../validate/attach";
import {
  listAskedFor,
  listContainerField,
  listViewOptionsOf,
  type MapList,
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
 * (an element or a selector), with its list when one is asked for. `destroy()` takes the map and
 * its list down.
 */
export function createShortcutMap<Data, AdapterOptions>({
  names,
  container,
  split: { storeOptions, adapterOptions, list: listAsked },
  createAdapter,
}: MapToMake<Data, AdapterOptions>): Maplace<Data> {
  const list = listAskedFor(listAsked);
  const maplace = createMaplace<Data>(storeOptions);
  const removeList = attachedOrDestroyed(maplace, () => {
    const adapter = createAdapter(adapterOptions);
    maplace.attach(adapter, container);
    return list === undefined ? undefined : placeList(maplace, adapter, list, names);
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
  list: MapList<Data>,
  names: ShortcutNames,
): () => void {
  const view = createListView(maplace, listViewOptionsOf(list));
  if (list.container === undefined) {
    adapter.mountControl(view.element, list.position ?? DEFAULT_CORNER);
  } else {
    containerOf(list.container, listContainerField(names)).append(view.element);
  }
  return view.destroy;
}

/** The list comes down before the store: a view whose store goes first reports it as misuse. */
function destroyWithList(maplace: Maplace<unknown>, removeList: (() => void) | undefined): void {
  removeList?.();
  maplace.destroy();
}
