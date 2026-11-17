import { carryStyles } from "./adopted-styles";
import type { ListViewOptions } from "./list-view-options";
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

export type { ListEntry, ListViewOptions } from "./list-view-options";

/**
 * A list view renders store state and asks the store for changes; it never talks to an adapter.
 * Without `fitAll` a listbox can't clear the selection; its "fit all" entry shows as selected
 * whenever nothing is (a selected location the list leaves out marks no entry). A select shows it
 * only while the view is that fit, or choosing it would fire nothing.
 */
export interface ListView {
  /**
   * The listbox or select itself, or with `heading`, `scope`, `search` or `groupFilter` a block
   * holding the heading, the search box, the group filter, the "All" and "This area" switch, their
   * statuses and the listbox, each with the class `maplace-list-view`: place it with
   * `mountControl`. Label it from the page only without any of those: the block is no list, so a
   * label on it names nothing (give `label` instead).
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
const DEFAULT_FIT_ALL_LABEL = "All locations";
const DEFAULT_SEARCH_LABEL = "Search";
const DEFAULT_AREA_ONLY_LABEL = "This area";
const DEFAULT_SHOW_ALL_LABEL = "All";
const DEFAULT_EMPTY_AREA_LABEL = "No locations in this area";
const DEFAULT_NO_MATCHES_LABEL = "No locations match";
const DEFAULT_MATCHES_LABEL = "Locations found";
const DEFAULT_GROUP_FILTER_LABEL = "Groups";

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
    fitAllLabel: options?.fitAll ? (options.fitAllLabel ?? DEFAULT_FIT_ALL_LABEL) : undefined,
    render: options?.render,
  });
  const { variant, areaSwitch, searchBox, groupFilter } = listBlock(
    list,
    blockPartsOf(options, label),
  );
  const stopSearching = searchBox?.onSearch(actions.search);
  const stopChoosing = groupFilter?.onChoose(actions.filterGroups);
  const stopFollowing = follow(maplace, {
    variant,
    rules: options ?? {},
    areaSwitch,
    searchBox,
    groupFilter,
  });
  let destroyed = false;
  destroy = () => {
    if (destroyed) return;
    destroyed = true;
    stopSearching?.();
    stopChoosing?.();
    stopFollowing();
    variant.destroy();
  };
  variant.element.classList.add(LIST_VIEW_CLASS);
  return { element: variant.element, destroy };
}

/**
 * What the view shows above its entries: the heading, the search box, the group filter and the
 * area switch, each when asked for; the switch named as the list, whose way of showing its
 * locations it switches.
 */
function blockPartsOf(options: ListViewOptions<never> | undefined, name: string): BlockParts {
  const heading = options?.heading;
  return {
    search: options?.search
      ? {
          label: options.searchLabel ?? DEFAULT_SEARCH_LABEL,
          noMatches: options.noMatchesLabel ?? DEFAULT_NO_MATCHES_LABEL,
          matches: options.matchesLabel ?? DEFAULT_MATCHES_LABEL,
        }
      : undefined,
    groupFilter: options?.groupFilter
      ? (options.groupFilterLabel ?? DEFAULT_GROUP_FILTER_LABEL)
      : undefined,
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
