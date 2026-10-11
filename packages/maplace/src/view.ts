import type { IconState, Location } from "./location";
import type { Maplace } from "./store";

/** One entry of a list view, as passed to a custom `render`. */
export interface ListEntry extends IconState {
  readonly location: Location;
}

export interface ListViewOptions {
  /** `list` (default) renders a listbox; `select` renders a native `<select>`. */
  readonly as?: "list" | "select";
  /** Show group headings. Default true when any location has a `group`. */
  readonly groupHeadings?: boolean;
  /** Custom entry content; the view keeps keyboard, focus and ARIA handling. */
  readonly render?: (entry: ListEntry) => Node;
}

/** A list view renders store state and asks the store for changes; it never talks to an adapter. */
export interface ListView {
  readonly element: HTMLElement;
  destroy(): void;
}

export declare function createListView(maplace: Maplace, options?: ListViewOptions): ListView;
