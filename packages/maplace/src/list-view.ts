import { adoptStyles } from "./adopted-styles";
import type { Location, LocationState } from "./location";
import { runSafely } from "./state/safely";
import type { Maplace } from "./store";
import { child, root } from "./validate/fail";
import { listActionsFor } from "./views/actions";
import { follow } from "./views/follow";
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
  /** The list's accessible name. Default "Locations"; or label `element` from the page. */
  readonly label?: string | undefined;
  /**
   * Custom entry content for `as: 'list'`, re-run only for entries whose location object or state
   * changed; the view keeps keyboard, focus and ARIA handling. Return a non-interactive node for
   * this entry alone (it sits inside an option): fresh, or the same one each time for its id. Not
   * for `as: 'select'`, whose options hold text.
   */
  readonly render?: ((entry: ListEntry<Data>) => Node) | undefined;
}

/**
 * A list view renders store state and asks the store for changes; it never talks to an adapter.
 * Without `fitAllLabel` a listbox can't clear the selection; the "fit all" entry shows as selected
 * whenever nothing else is.
 */
export interface ListView {
  /** The listbox or select itself: label it from the page, or place it with `mountControl`. */
  readonly element: HTMLElement;
  /**
   * Stops following the store, clears the hover it set, and removes `element` (a later remover
   * from `mountControl` then has nothing to do). Safe to call twice. Destroy views before their
   * store; a view whose store is destroyed first destroys itself and reports it once.
   */
  destroy(): void;
}

const DEFAULT_LABEL = "Locations";

const VARIANTS = { list: createListbox, select: createNativeSelect } as const;

/** A list or native select of the store's shown locations, in step with it both ways. */
export function createListView<Data>(
  maplace: Maplace<Data>,
  options?: ListViewOptions<Data>,
): ListView {
  checkListViewOptions(options, child(root("createListView"), "options"));
  adoptStyles(document, LIST_STYLES);
  let destroy: () => void = () => {};
  const actions = listActionsFor(maplace, (error) => {
    destroy();
    runSafely(() => {
      throw error;
    });
  });
  const variant: ListVariant<Data> = VARIANTS[options?.as ?? "list"](actions, {
    label: options?.label ?? DEFAULT_LABEL,
    fitAllLabel: options?.fitAllLabel,
    render: options?.render,
  });
  const stopFollowing = follow(maplace, {
    variant,
    rules: { groupHeadings: options?.groupHeadings },
  });
  let destroyed = false;
  destroy = () => {
    if (destroyed) return;
    destroyed = true;
    stopFollowing();
    variant.destroy();
  };
  return { element: variant.element, destroy };
}
