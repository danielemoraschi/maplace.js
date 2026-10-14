import type { SelectionAndHover } from "../location-state";
import type { ListStructure } from "./model";

/** Selection and hover, as a list shows them. */
export type ListState = SelectionAndHover;

/**
 * One way to show the list (`as`): a listbox or a native select. `renderStructure` follows the
 * locations and filter; `renderState` follows selection and hover, touching only what changed.
 */
export interface ListVariant<Data = unknown> {
  readonly element: HTMLElement;
  renderStructure(structure: ListStructure<Data>): void;
  renderState(state: ListState): void;
  destroy(): void;
}

/** A move from one state to the next, as a variant repaints it. */
export interface StateChange {
  readonly previous: ListState;
  readonly next: ListState;
}
