import { carryStyles } from "./adopted-styles";
import type { Location, LocationState } from "./location";
import { runSafely } from "./state/safely";
import type { Maplace } from "./store";
import { child, root } from "./validate/fail";
import { listActionsFor } from "./views/actions";
import { follow } from "./views/follow";
import { type BlockParts, listBlock } from "./views/list-block";
import { LIST_STYLES } from "./views/list-styles";
import { createListbox } from "./views/listbox";
import { createNativeSelect } from "./views/native-select";
import { checkListViewOptions } from "./views/options";
import type { ListVariant } from "./views/variant";

/** One entry of a list view, as passed to a custom `render`. */
export interface ListEntry<Data = unknown> extends LocationState {
  readonly location: Location<Data>;
}

export interface ListViewOptions<Data = unknown> {
  /** `list` (default) renders a listbox; `select` renders a native `<select>`. */
  readonly as?: "list" | "select" | undefined;
  /** Show group headings. Default true when any location has a `group`. */
  readonly groupHeadings?: boolean | undefined;
  /**
   * Shows after each group heading how many are listed under it now, following the filter and
   * `scope`: "North (3)". Off by default; refused with `groupHeadings: false`.
   */
  readonly groupCounts?: boolean | undefined;
  /** Adds a first entry with this label that clears the selection and fits all locations. */
  readonly fitAllLabel?: string | undefined;
  /**
   * The list's accessible name. Default the `heading`, else "Locations"; or label `element` from
   * the page.
   */
  readonly label?: string | undefined;
  /** A visible heading above the entries; the list's accessible name unless `label` is given. */
  readonly heading?: string | undefined;
  /**
   * Custom entry content for `as: 'list'`, re-run only for entries whose location object or state
   * changed; the view keeps keyboard, focus and ARIA handling. Return a non-interactive node for
   * this entry alone (it sits inside an option): fresh, or the same one each time for its id. Not
   * for `as: 'select'`, whose options hold text.
   */
  readonly render?: ((entry: ListEntry<Data>) => Node) | undefined;
  /**
   * `viewport`: a switch above the entries, "All" and "This area", always shown. "All" (at load)
   * lists every location; "This area" lists those in the map's view (a shape when any of its
   * points is) and follows it, listing again on each new view (a resize isn't one) and with no
   * view (not attached, not laid out) every location until one comes. For `as: 'list'` only.
   */
  readonly scope?: "viewport" | undefined;
  /** The label of the switch's "This area". Default "This area". */
  readonly areaOnlyLabel?: string | undefined;
  /** The label of the switch's "All". Default "All". */
  readonly showAllLabel?: string | undefined;
  /** What a scoped list says when nothing is in its view. Default "No locations in this area". */
  readonly emptyAreaLabel?: string | undefined;
  /**
   * Shows a search box above the entries, named by this, for `as: 'list'` only: typing sets the
   * filter's `query` once it pauses for 150 ms, keeping the rest of the filter, so the map narrows
   * too and the camera stays.
   * It follows the store, emptying when a page's `setFilter` takes the query away, and a query
   * outlives the box.
   */
  readonly searchLabel?: string | undefined;
  /** What the box's status says when nothing matches. Default "No locations match". */
  readonly noMatchesLabel?: string | undefined;
  /** What the box's status says before the count while a query is on. Default "Locations found". */
  readonly matchesLabel?: string | undefined;
}

/**
 * A list view renders store state and asks the store for changes; it never talks to an adapter.
 * Without `fitAllLabel` a listbox can't clear the selection; the "fit all" entry shows as selected
 * whenever nothing is (a selected location the list leaves out marks no entry).
 */
export interface ListView {
  /**
   * The listbox or select itself, or with `heading`, `scope` or `searchLabel` a block holding the
   * heading, the search box, the "All" and "This area" switch, their statuses and the listbox, each
   * with the class `maplace-list-view`: place it with `mountControl`. Label it from the page only
   * without any of those: the block is no list, so a label on it names nothing (give `label`
   * instead).
   */
  readonly element: HTMLElement;
  /**
   * Stops following the store, clears the hover it set, and removes `element` (a later remover
   * from `mountControl` then has nothing to do). Safe to call twice. Destroy views before their
   * store; a view whose store is destroyed first destroys itself and reports it once.
   */
  destroy(): void;
}

const DEFAULT_LABEL = "Locations";
const DEFAULT_AREA_ONLY_LABEL = "This area";
const DEFAULT_SHOW_ALL_LABEL = "All";
const DEFAULT_EMPTY_AREA_LABEL = "No locations in this area";
const DEFAULT_NO_MATCHES_LABEL = "No locations match";
const DEFAULT_MATCHES_LABEL = "Locations found";

/** The class of every list view's element `createListView` builds, whichever it is: the class a page styles it by. */
export const LIST_VIEW_CLASS = "maplace-list-view";

const VARIANTS = { list: createListbox, select: createNativeSelect } as const;

/** A list or native select of the store's listed locations, in step with it both ways. */
export function createListView<Data>(
  maplace: Maplace<Data>,
  options?: ListViewOptions<Data>,
): ListView {
  checkListViewOptions(options, child(root("createListView"), "options"));
  carryStyles(LIST_STYLES);
  let destroy: () => void = () => {};
  const actions = listActionsFor(maplace, (error) => {
    destroy();
    runSafely(() => {
      throw error;
    });
  });
  const label = options?.label ?? options?.heading ?? DEFAULT_LABEL;
  const list: ListVariant<Data> = VARIANTS[options?.as ?? "list"](actions, {
    label,
    fitAllLabel: options?.fitAllLabel,
    render: options?.render,
  });
  const { variant, areaSwitch, searchBox } = listBlock(list, blockPartsOf(options, label));
  const stopSearching = searchBox?.onSearch(actions.search);
  const stopFollowing = follow(maplace, {
    variant,
    rules: { groupHeadings: options?.groupHeadings, groupCounts: options?.groupCounts },
    areaSwitch,
    searchBox,
  });
  let destroyed = false;
  destroy = () => {
    if (destroyed) return;
    destroyed = true;
    stopSearching?.();
    stopFollowing();
    variant.destroy();
  };
  variant.element.classList.add(LIST_VIEW_CLASS);
  return { element: variant.element, destroy };
}

/**
 * What the view shows above its entries: the heading, the search box and the area switch, each
 * when asked for; the switch named as the list, whose way of showing its locations it switches.
 */
function blockPartsOf(options: ListViewOptions<never> | undefined, name: string): BlockParts {
  const heading = options?.heading;
  const searchLabel = options?.searchLabel;
  return {
    search:
      searchLabel === undefined
        ? undefined
        : {
            label: searchLabel,
            noMatches: options?.noMatchesLabel ?? DEFAULT_NO_MATCHES_LABEL,
            matches: options?.matchesLabel ?? DEFAULT_MATCHES_LABEL,
          },
    heading:
      heading === undefined
        ? undefined
        : { text: heading, namesList: options?.label === undefined },
    areaSwitch:
      options?.scope === "viewport"
        ? {
            name,
            areaOnly: options.areaOnlyLabel ?? DEFAULT_AREA_ONLY_LABEL,
            showAll: options.showAllLabel ?? DEFAULT_SHOW_ALL_LABEL,
            emptyArea: options.emptyAreaLabel ?? DEFAULT_EMPTY_AREA_LABEL,
          }
        : undefined,
  };
}
