import type { Location, LocationState } from "./location";
import type { Maplace } from "./store";

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
   * Custom entry content, re-run only for entries whose location or state changed; the view
   * keeps keyboard, focus and ARIA handling.
   */
  readonly render?: ((entry: ListEntry<Data>) => Node) | undefined;
}

/** A list view renders store state and asks the store for changes; it never talks to an adapter. */
export interface ListView {
  readonly element: HTMLElement;
  destroy(): void;
}

export declare function createListView<Data>(
  maplace: Maplace<Data>,
  options?: ListViewOptions<Data>,
): ListView;
