import type { ListActions } from "./actions";
import type { HoverIntent } from "./hover-intent";
import type { Roving } from "./roving";

/** What the handlers need from the listbox: its options in order and what each stands for. */
export interface ListboxEventContext {
  readonly actions: ListActions;
  readonly intent: HoverIntent;
  readonly roving: Roving;
  /** The option (or fit-all entry) `target` is in, found through the view's own map. */
  readonly optionAt: (target: EventTarget | null) => HTMLElement | undefined;
  /** The location id an option stands for; undefined for the fit-all entry. */
  readonly idOf: (option: HTMLElement) => string | undefined;
  readonly order: () => readonly HTMLElement[];
}
