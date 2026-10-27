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
   * `viewport`: a "This area only" button lists only the locations in the map's view (a shape
   * when any of its points is). It shows after a move that would list other locations (a resize
   * or a rotation isn't one); "Show all", shown while the list is filtered, lists them all again.
   * Until the first is pressed, and with no view (not attached, held, not laid out), the list
   * lists them all, which at load is what the fitted view holds. For `as: 'list'` only.
   */
  readonly scope?: "viewport" | undefined;
  /** The label of "This area only". Default "This area only". */
  readonly areaOnlyLabel?: string | undefined;
  /** The label of "Show all". Default "Show all". */
  readonly showAllLabel?: string | undefined;
  /** What a scoped list says when nothing is in its view. Default "No locations in this area". */
  readonly emptyAreaLabel?: string | undefined;
}

/**
 * A list view renders store state and asks the store for changes; it never talks to an adapter.
 * Without `fitAllLabel` a listbox can't clear the selection; the "fit all" entry shows as selected
 * whenever nothing is (a selected location the list leaves out marks no entry).
 */
export interface ListView {
  /**
   * The listbox or select itself, or with `heading` or `scope` a block holding the heading, the
   * "This area only" and "Show all" buttons, the empty-area status and the listbox, each with the
   * class `maplace-list-view`: place it with `mountControl`. Label it from the page only without either:
   * the block is no list, so a label on it names nothing (give `label` instead).
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
const DEFAULT_AREA_ONLY_LABEL = "This area only";
const DEFAULT_SHOW_ALL_LABEL = "Show all";
const DEFAULT_EMPTY_AREA_LABEL = "No locations in this area";

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
  const list: ListVariant<Data> = VARIANTS[options?.as ?? "list"](actions, {
    label: options?.label ?? options?.heading ?? DEFAULT_LABEL,
    fitAllLabel: options?.fitAllLabel,
    render: options?.render,
  });
  const { variant, areaFilter } = listBlock(list, blockPartsOf(options));
  const stopFollowing = follow(maplace, {
    variant,
    rules: { groupHeadings: options?.groupHeadings },
    areaFilter,
  });
  let destroyed = false;
  destroy = () => {
    if (destroyed) return;
    destroyed = true;
    stopFollowing();
    variant.destroy();
  };
  variant.element.classList.add(LIST_VIEW_CLASS);
  return { element: variant.element, destroy };
}

/** What the view shows above its entries: the heading and the area filter, each when asked for. */
function blockPartsOf(options: ListViewOptions<never> | undefined): BlockParts {
  const heading = options?.heading;
  return {
    heading:
      heading === undefined
        ? undefined
        : { text: heading, namesList: options?.label === undefined },
    areaFilter:
      options?.scope === "viewport"
        ? {
            areaOnly: options.areaOnlyLabel ?? DEFAULT_AREA_ONLY_LABEL,
            showAll: options.showAllLabel ?? DEFAULT_SHOW_ALL_LABEL,
            emptyArea: options.emptyAreaLabel ?? DEFAULT_EMPTY_AREA_LABEL,
          }
        : undefined,
  };
}
