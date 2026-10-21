import { CONTROL_POSITIONS, type ControlPosition } from "../adapter";
import type { ListViewOptions } from "../index";
import type { MaplaceOptions } from "../options";
import { child, type Field, reject, root } from "../validate/fail";
import { checkObject, checkOneOf, members, optional } from "../validate/values";

/** maplace's list on the map, in a corner, or in an element of the page. */
export interface MapList<Data = unknown> extends ListViewOptions<Data> {
  /** The corner of the map the list sits in; default `top-right`, where 0.2 put its controls. */
  readonly position?: ControlPosition | undefined;
  /** An element or a selector to put the list in instead, beside the map (0.2's `controls_div`). */
  readonly container?: HTMLElement | string | undefined;
}

/** What every shortcut takes besides its adapter's options: a store's, and the list to show. */
export interface ShortcutOptions<Data = unknown> extends MaplaceOptions<Data> {
  /** maplace's list: `true` for the default one on the map, or its options and place. */
  readonly list?: true | MapList<Data> | undefined;
}

/** A shortcut and the adapter factory it stands for, as its misuse names them. */
export interface ShortcutNames {
  readonly shortcut: string;
  readonly adapterFactory: string;
}

/** A shortcut's options, split between the parts it hands them to. */
export interface SplitOptions<Data, AdapterOptions> {
  readonly storeOptions: MaplaceOptions<Data>;
  readonly adapterOptions: AdapterOptions;
  /** The list asked for: `true` for the default one, no options, top-right. */
  readonly list: ShortcutOptions<Data>["list"];
}

const CORNERS = members(CONTROL_POSITIONS);
const checkCorner = optional((value, field) => checkOneOf(value, field, CORNERS));

/** A shortcut's options, as its misuse names them: `createGoogleMap: options…`. */
export const optionsField = ({ shortcut }: ShortcutNames) => child(root(shortcut), "options");

/** Where a list in the page goes, named when its selector matches nothing. */
export function listContainerField(names: ShortcutNames): Field {
  return child(child(optionsField(names), "list"), "container");
}

/**
 * What a shortcut itself takes, before anything is made: the store's, the adapter's and the list
 * view's options are checked by the parts it hands them to. The page's own `map` is refused: a
 * page drawing on its own map has the adapter in hand, so it takes the parts.
 */
export function checkShortcutOptions<Data = unknown>(
  options: unknown,
  names: ShortcutNames,
): asserts options is ShortcutOptions<Data> {
  const field = optionsField(names);
  checkObject(options, field, "an object");
  if ("map" in options) {
    reject(child(field, "map"), `is for ${names.adapterFactory}: attach it to a store of your own`);
  }
  checkList(options.list, child(field, "list"));
}

const checkList = optional((list, field) => {
  if (list === true) return;
  checkObject(list, field, "true or an object");
  checkCorner(list.position, child(field, "position"));
  if (list.position !== undefined && list.container !== undefined) {
    reject(child(field, "container"), "is for a list in the page: leave out position");
  }
});

/** The list asked for: `true` is the default one, with no options. */
export function listAskedFor<Data>(list: ShortcutOptions<Data>["list"]): MapList<Data> | undefined {
  return list === true ? {} : list;
}

/** The list view's own options: where the list goes is the shortcut's to place. */
export function listViewOptionsOf<Data>(list: MapList<Data>): ListViewOptions<Data> {
  const { position: _position, container: _container, ...viewOptions } = list;
  return viewOptions;
}
