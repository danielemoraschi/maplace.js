import type { Maplace } from "../index";
import { isSelectable } from "../location-state";
import type { StandingMisuse } from "./standing-misuse";

/**
 * A selection waiting for its location: `selected-id`, misuse until the locations have it, and
 * the one the page's address names (`url-state`), which wins and is never misuse. Either, once
 * made, or any other selection, drops both.
 */
export class PendingSelection {
  readonly #store: () => Maplace | undefined;
  readonly #misuse: StandingMisuse;
  /** `selected-id`, until the locations have it or something else is selected. */
  #fromAttribute: string | undefined;
  /** The address's id, until the locations show it or something else is selected. */
  #fromAddress: string | undefined;

  constructor(store: () => Maplace | undefined, misuse: StandingMisuse) {
    this.#store = store;
    this.#misuse = misuse;
  }

  fromAttribute(id: string | undefined): void {
    this.#fromAttribute = id;
  }

  fromAddress(id: string): void {
    this.#fromAddress = id;
  }

  /** Selects what waits, if the store has it: the address's location first, else `selected-id`. */
  trySelect(): void {
    const store = this.#store();
    if (store === undefined || this.#selectAddressLocation(store)) return;
    const id = this.#fromAttribute;
    if (id === undefined || this.#hiddenByQuery(store, id)) return;
    const selected = this.#misuse.retry("selection", () => {
      store.select(id);
      return true;
    });
    if (selected) this.drop();
  }

  /** A selection was made: nothing waits any more, and no selection misuse stands. */
  drop(): void {
    this.#fromAttribute = undefined;
    this.#fromAddress = undefined;
    this.#misuse.clear("selection");
  }

  /** What a visitor typed in the box is no misuse of the page's: `id` waits for the next locations. */
  #hiddenByQuery(store: Maplace, id: string): boolean {
    return store.getSnapshot().filter?.query !== undefined && !isShownIn(store, id);
  }

  /** Selects the address's location if shown; whether it was. */
  #selectAddressLocation(store: Maplace): boolean {
    const id = this.#fromAddress;
    if (id === undefined || !selectIfShown(store, id)) return false;
    this.drop();
    return true;
  }
}

/**
 * Selects `id` if the store shows it, unless it already is (a selection pans); whether it is
 * shown. An unknown or hidden id is left alone, as no misuse.
 */
export function selectIfShown(store: Maplace, id: string): boolean {
  if (!isShownIn(store, id)) return false;
  if (store.getSnapshot().selectedId !== id) store.select(id);
  return true;
}

/** Known and shown in the store: a location the address may select. */
export function isShownIn(store: Maplace, id: string): boolean {
  return isSelectable(store.getSnapshot(), id);
}
