import { MaplaceError } from "../errors";
import type { Maplace } from "../store";

/** What a list asks of the store: the only place a view calls it. */
export interface ListActions {
  choose(id: string): void;
  /** Clears the selection and fits all locations: the "fit all" entry. */
  showAll(): void;
  hover(id: string): void;
  /** Clears the hover only if it is still `id`, so a view never clears the map's or another's. */
  unhover(id: string): void;
  /** Sets the filter's query, keeping the rest of what the page asked for. */
  search(text: string): void;
}

type ListStore = Pick<Maplace, "select" | "fitAll" | "hover" | "setFilter" | "getSnapshot">;

/**
 * Store commands for one view; `onStoreGone` hears, once, that the store was destroyed under it.
 */
export function listActionsFor(
  store: ListStore,
  onStoreGone: (error: MaplaceError) => void,
): ListActions {
  let gone = false;

  // A store destroyed under a live view would throw on every pointer move; one report is enough.
  function whileStoreLives(action: () => void): void {
    if (gone) return;
    try {
      action();
    } catch (error) {
      if (!(error instanceof MaplaceError && error.code === "destroyed")) throw error;
      gone = true;
      onStoreGone(error);
    }
  }

  return {
    choose: (id) => whileStoreLives(() => store.select(id)),
    showAll: () =>
      whileStoreLives(() => {
        store.select(undefined);
        store.fitAll();
      }),
    hover: (id) => whileStoreLives(() => store.hover(id)),
    unhover: (id) =>
      whileStoreLives(() => {
        if (store.getSnapshot().hoveredId === id) store.hover(undefined);
      }),
    search: (text) =>
      whileStoreLives(() => store.setFilter({ ...store.getSnapshot().filter, query: text })),
  };
}
